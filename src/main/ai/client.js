/**
 * @file Unified multi-provider AI client supporting real-time streaming
 * across Groq, OpenAI, Google Gemini, Anthropic Claude, and Ollama.
 */

import { PROVIDERS } from './providers.js';

const DEFAULT_TIMEOUT_MS = 90000;

export class AIClientError extends Error {
  constructor(message, { status, provider } = {}) {
    super(message);
    this.name = 'AIClientError';
    this.status = status;
    this.provider = provider;
  }
}

/**
 * Parses Server-Sent Events (SSE) data lines into tokens.
 * @param {string} line
 * @param {string} providerType
 * @returns {string|null}
 */
function extractTokenFromSSE(line, providerType) {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('data:')) return null;

  const dataStr = trimmed.slice(5).trim();
  if (dataStr === '[DONE]') return null;

  try {
    const parsed = JSON.parse(dataStr);
    if (providerType === 'anthropic') {
      if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
        return parsed.delta.text;
      }
      return null;
    }

    // OpenAI-compatible format (Groq, OpenAI, Gemini, Ollama)
    const delta = parsed?.choices?.[0]?.delta;
    return delta?.content || null;
  } catch {
    return null;
  }
}

/**
 * Universal chat streaming and completion caller.
 * @param {Object} options
 * @param {string} options.providerId
 * @param {string} [options.apiKey]
 * @param {string} options.model
 * @param {string} [options.customBaseUrl]
 * @param {string} options.systemPrompt
 * @param {string} options.userPrompt
 * @param {number} [options.temperature]
 * @param {boolean} [options.jsonMode]
 * @param {(token: string) => void} [options.onChunk]
 * @returns {Promise<string>} Full accumulated response text
 */
export async function callAI({
  providerId = 'groq',
  apiKey = '',
  model,
  customBaseUrl = '',
  systemPrompt = '',
  userPrompt = '',
  temperature = 0.7,
  jsonMode = false,
  onChunk = null,
}) {
  const providerConfig = PROVIDERS[providerId];
  if (!providerConfig) {
    throw new AIClientError(`Unknown AI provider: "${providerId}"`);
  }

  if (providerConfig.requiresKey && !apiKey?.trim()) {
    throw new AIClientError(`No API key provided for ${providerConfig.name}. Please configure it in Settings.`);
  }

  const baseUrl = customBaseUrl || providerConfig.baseUrl;
  const targetModel = model || providerConfig.defaultModel;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    if (providerConfig.type === 'anthropic') {
      return await callAnthropic({
        baseUrl,
        apiKey,
        model: targetModel,
        systemPrompt,
        userPrompt,
        temperature,
        onChunk,
        signal: controller.signal,
      });
    }

    return await callOpenAICompatible({
      providerId,
      providerName: providerConfig.name,
      baseUrl,
      apiKey,
      model: targetModel,
      systemPrompt,
      userPrompt,
      temperature,
      jsonMode,
      onChunk,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AIClientError(`Request to ${providerConfig.name} timed out after ${DEFAULT_TIMEOUT_MS / 1000} seconds.`);
    }
    if (err instanceof AIClientError) throw err;
    throw new AIClientError(`Failed communicating with ${providerConfig.name}: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Standard OpenAI-compatible API caller (Groq, OpenAI, Gemini, Ollama).
 */
async function callOpenAICompatible({
  providerId,
  providerName,
  baseUrl,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  temperature,
  jsonMode,
  onChunk,
  signal,
}) {
  const isStreaming = typeof onChunk === 'function';
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const bodyPayload = {
    model,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: isStreaming,
  };

  // Enable JSON object response format when required and supported
  // Note: Ollama and Groq and OpenAI support json_object
  if (jsonMode && providerId !== 'ollama') {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload),
    signal,
  });

  if (!response.ok) {
    let errMsg = '';
    try {
      const json = await response.json();
      errMsg = json?.error?.message || json?.message || '';
    } catch {}
    if (response.status === 401) {
      throw new AIClientError(`Invalid API key for ${providerName}. Please check it in Settings.`, { status: 401, provider: providerId });
    }
    if (response.status === 429) {
      throw new AIClientError(`${providerName} rate limit reached. Please wait a moment.`, { status: 429, provider: providerId });
    }
    throw new AIClientError(errMsg || `${providerName} request failed with status ${response.status}.`, { status: response.status, provider: providerId });
  }

  if (isStreaming && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const token = extractTokenFromSSE(line, 'openai-compatible');
        if (token) {
          fullText += token;
          try {
            onChunk(token);
          } catch {}
        }
      }
    }

    if (buffer.trim()) {
      const token = extractTokenFromSSE(buffer, 'openai-compatible');
      if (token) {
        fullText += token;
        try {
          onChunk(token);
        } catch {}
      }
    }

    if (!fullText.trim()) {
      throw new AIClientError(`${providerName} returned an empty response.`);
    }
    return fullText;
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new AIClientError(`${providerName} returned an empty response.`);
  }
  return content;
}

/**
 * Anthropic Messages API caller.
 */
async function callAnthropic({
  baseUrl,
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  temperature,
  onChunk,
  signal,
}) {
  const isStreaming = typeof onChunk === 'function';
  const url = `${baseUrl.replace(/\/+$/, '')}/messages`;

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey.trim(),
    'anthropic-version': '2023-06-01',
  };

  const bodyPayload = {
    model,
    max_tokens: 4096,
    temperature,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
    stream: isStreaming,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload),
    signal,
  });

  if (!response.ok) {
    let errMsg = '';
    try {
      const json = await response.json();
      errMsg = json?.error?.message || '';
    } catch {}
    if (response.status === 401) {
      throw new AIClientError('Invalid Anthropic API key. Please check it in Settings.', { status: 401, provider: 'anthropic' });
    }
    throw new AIClientError(errMsg || `Anthropic request failed with status ${response.status}.`, { status: response.status, provider: 'anthropic' });
  }

  if (isStreaming && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const token = extractTokenFromSSE(line, 'anthropic');
        if (token) {
          fullText += token;
          try {
            onChunk(token);
          } catch {}
        }
      }
    }

    if (buffer.trim()) {
      const token = extractTokenFromSSE(buffer, 'anthropic');
      if (token) {
        fullText += token;
        try {
          onChunk(token);
        } catch {}
      }
    }

    return fullText;
  }

  const json = await response.json();
  const content = json?.content?.[0]?.text;
  if (!content) {
    throw new AIClientError('Anthropic returned an empty response.');
  }
  return content;
}

/**
 * Validates a provider API key by making a minimal test call.
 * @param {{ providerId: string, apiKey: string, model?: string, customBaseUrl?: string }} params
 * @returns {Promise<boolean>}
 */
export async function testProviderConnection({ providerId, apiKey, model, customBaseUrl }) {
  await callAI({
    providerId,
    apiKey,
    model,
    customBaseUrl,
    systemPrompt: 'Respond only with OK.',
    userPrompt: 'Test ping.',
    temperature: 0.1,
  });
  return true;
}

/**
 * Sends an image (base64) + prompt to a vision-capable AI model and returns text response.
 * Supports OpenAI-compatible (GPT-4o, Gemini, Groq vision models) and Anthropic.
 *
 * @param {Object} options
 * @param {string} options.providerId
 * @param {string} [options.apiKey]
 * @param {string} options.model
 * @param {string} [options.customBaseUrl]
 * @param {string} options.systemPrompt
 * @param {string} options.textPrompt - Text portion of the user message
 * @param {string} options.imageBase64 - Base64-encoded image data (no data URI prefix)
 * @param {string} [options.mimeType] - MIME type of image e.g. 'image/png'
 * @returns {Promise<string>}
 */
export async function callAIVision({
  providerId = 'openai',
  apiKey = '',
  model,
  customBaseUrl = '',
  systemPrompt = '',
  textPrompt = '',
  imageBase64 = '',
  mimeType = 'image/png',
}) {
  const providerConfig = PROVIDERS[providerId];
  if (!providerConfig) throw new AIClientError(`Unknown AI provider: "${providerId}"`);
  if (providerConfig.requiresKey && !apiKey?.trim()) {
    throw new AIClientError(`No API key for ${providerConfig.name}. Please configure it in Settings.`);
  }

  const baseUrl = customBaseUrl || providerConfig.baseUrl;
  const targetModel = model || providerConfig.defaultModel;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    if (providerConfig.type === 'anthropic') {
      // Anthropic multimodal
      const url = `${baseUrl.replace(/\/+$/, '')}/messages`;
      const body = {
        model: targetModel,
        max_tokens: 2048,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: textPrompt },
          ],
        }],
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey.trim(), 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new AIClientError(j?.error?.message || `Anthropic vision failed (${res.status}).`);
      }
      const j = await res.json();
      return j?.content?.[0]?.text || '';
    }

    // OpenAI-compatible vision (GPT-4o, Gemini OpenAI-compat, Groq vision)
    const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey.trim()}`;

    const body = {
      model: targetModel,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: textPrompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new AIClientError(j?.error?.message || `Vision request failed (${res.status}).`);
    }

    const j = await res.json();
    return j?.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err.name === 'AbortError') throw new AIClientError('Vision request timed out.');
    if (err instanceof AIClientError) throw err;
    throw new AIClientError(`Vision call failed: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}
