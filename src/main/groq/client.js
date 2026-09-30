/**
 * @file Thin wrapper around Groq's OpenAI-compatible chat completions
 * endpoint. Contains no prompt knowledge — that lives in promptBuilder.js —
 * so this file only knows how to make the HTTP call and parse the result.
 */

const DEFAULT_BASE_URL = process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1';
const DEFAULT_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS) || 60000;

/** Raised for any failure talking to Groq, with a message safe to show the user. */
export class GroqError extends Error {
  constructor(message, { status } = {}) {
    super(message);
    this.name = 'GroqError';
    this.status = status;
  }
}

/**
 * Calls Groq's chat completions endpoint and returns the assistant's raw
 * text content.
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.model
 * @param {string} params.systemPrompt
 * @param {string} params.userPrompt
 * @param {number} [params.temperature]
 * @returns {Promise<string>}
 */
export async function callGroqChat({ apiKey, model, systemPrompt, userPrompt, temperature = 0.7 }) {
  if (!apiKey) {
    throw new GroqError('No Groq API key is saved yet. Add one in Settings.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${DEFAULT_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new GroqError('The request to Groq timed out. Please try again.');
    }
    throw new GroqError(`Could not reach Groq: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const status = response.status;
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.message || '';
    } catch {
      // response body was not JSON; fall through with empty detail
    }
    if (status === 401) {
      throw new GroqError('Groq rejected the API key. Check it in Settings.', { status });
    }
    if (status === 429) {
      throw new GroqError('Groq rate limit reached. Wait a moment and try again.', { status });
    }
    throw new GroqError(detail || `Groq request failed with status ${status}.`, { status });
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new GroqError('Groq returned an empty response.');
  }
  return content;
}

/**
 * Sends a single lightweight request to confirm an API key is valid.
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.model
 * @returns {Promise<boolean>}
 */
export async function testGroqKey({ apiKey, model }) {
  await callGroqChat({
    apiKey,
    model,
    systemPrompt: 'Respond with only this JSON object: {"ok": true}',
    userPrompt: 'ping',
    temperature: 0,
  });
  return true;
}
