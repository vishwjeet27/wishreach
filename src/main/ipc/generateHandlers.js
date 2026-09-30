/**
 * @file IPC handlers for AI generation, streaming, regeneration, and one-click polishing.
 * Uses the unified multi-provider AI client (Groq, OpenAI, Gemini, Claude, Ollama).
 */

import { ipcMain, app } from 'electron';
import { getState, updateState } from '../store/index.js';
import { readProviderKey } from '../ai/keyVault.js';
import { callAI, callAIVision, AIClientError } from '../ai/client.js';
import { PROVIDERS } from '../ai/providers.js';
import {
  buildFullGenerationPrompt,
  buildRegeneratePrompt,
  buildPolishPrompt,
  parseGroqJson,
} from '../groq/promptBuilder.js';
import { CONTENT_FIELDS } from '../../shared/contentFields.js';
import { CHANNELS } from '../../shared/channels.js';
import { sanitizeText, ValidationError, LIMITS } from '../utils/validate.js';

/**
 * Validates the client-details payload from the Generate page.
 * @param {Object} payload
 * @returns {Object}
 */
function sanitizeClientPayload(payload) {
  return {
    clientName: sanitizeText(payload.clientName, 'Client name', { required: true }),
    clientCompany: sanitizeText(payload.clientCompany, 'Client company', { required: true }),
    clientDesignation: sanitizeText(payload.clientDesignation, 'Client designation'),
    clientWebsite: payload.clientWebsite ? sanitizeText(payload.clientWebsite, 'Client website') : '',
    targetCountry: sanitizeText(payload.targetCountry, 'Target country', { required: true }),
    industry: sanitizeText(payload.industry, 'Industry'),
    requirements: sanitizeText(payload.requirements, 'Requirements', {
      required: true,
      max: LIMITS.MAX_LONG_TEXT,
    }),
    tone: sanitizeText(payload.tone || 'Professional', 'Tone', { required: true }),
    goal: sanitizeText(payload.goal || 'Cold Outreach', 'Goal', { required: true }),
    language: sanitizeText(payload.language || 'English (US)', 'Language'),
    strategy: sanitizeText(payload.strategy || 'Direct & Solution-Focused', 'Strategy'),
    senderProfileId: payload.senderProfileId ? sanitizeText(payload.senderProfileId, 'Sender Profile') : undefined,
  };
}

/**
 * Confirms the app is configured enough to call the active AI provider.
 * @param {Object} state
 * @returns {Promise<{ providerId: string, apiKey: string, model: string, customBaseUrl: string, temperature: number } | { error: string }>}
 */
async function ensureReady(state) {
  if (!state.company.name || !state.user.fullName) {
    return { error: 'Finish setting up your company profile in Settings first.' };
  }

  const providerId = state.ai?.provider || 'groq';
  const provider = PROVIDERS[providerId] || PROVIDERS.groq;
  const model = state.ai?.model || state.groq?.model || provider.defaultModel;
  const customBaseUrl = state.ai?.customBaseUrl || '';
  const temperature = state.ai?.temperature ?? 0.7;

  let apiKey = '';
  if (provider.requiresKey) {
    apiKey = await readProviderKey(app.getPath('userData'), providerId);
    if (!apiKey) {
      return { error: `Add an API key for ${provider.name} in Settings before generating.` };
    }
  }

  return { providerId, apiKey, model, customBaseUrl, temperature };
}

/** Bumps the dashboard counters after a successful generation. */
function recordGenerationStats(fieldsGenerated) {
  const state = getState();
  const linkedinCount = fieldsGenerated.filter((k) => k === 'linkedinConnection' || k === 'linkedinDm').length;
  const emailCount = fieldsGenerated.length - linkedinCount;
  updateState({
    stats: {
      totalDrafts: (state.stats?.totalDrafts || 0) + fieldsGenerated.length,
      emailsGenerated: (state.stats?.emailsGenerated || 0) + emailCount,
      linkedinGenerated: (state.stats?.linkedinGenerated || 0) + linkedinCount,
      lastGeneratedAt: Date.now(),
    },
  });
}

/** Registers the AI generation ipcMain.handle listeners. */
export function registerGenerateHandlers() {
  ipcMain.handle(CHANNELS.AI_GENERATE, async (event, rawClient) => {
    const state = getState();
    const ready = await ensureReady(state);
    if (ready.error) return { ok: false, error: ready.error };

    const streamId = `gen_${Date.now()}`;

    try {
      const client = sanitizeClientPayload(rawClient || {});
      const { systemPrompt, userPrompt } = await buildFullGenerationPrompt(state, client);

      const raw = await callAI({
        providerId: ready.providerId,
        apiKey: ready.apiKey,
        model: ready.model,
        customBaseUrl: ready.customBaseUrl,
        temperature: ready.temperature,
        systemPrompt,
        userPrompt,
        jsonMode: true,
        onChunk: (token) => {
          try {
            event.sender.send(CHANNELS.AI_STREAM_CHUNK, { streamId, token, kind: 'full' });
          } catch {}
        },
      });

      try {
        event.sender.send(CHANNELS.AI_STREAM_DONE, { streamId });
      } catch {}

      const parsed = parseGroqJson(raw);

      const content = {};
      for (const field of CONTENT_FIELDS) {
        content[field.key] = typeof parsed[field.key] === 'string' ? parsed[field.key].trim() : '';
      }

      recordGenerationStats(CONTENT_FIELDS.map((f) => f.key));
      return { ok: true, content, client, provider: ready.providerId, model: ready.model };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AIClientError) {
        return { ok: false, error: error.message };
      }
      return { ok: false, error: `Generation failed: ${error.message}` };
    }
  });

  ipcMain.handle(CHANNELS.AI_REGENERATE, async (event, { client: rawClient, fieldKey } = {}) => {
    const state = getState();
    const ready = await ensureReady(state);
    if (ready.error) return { ok: false, error: ready.error };

    if (!CONTENT_FIELDS.some((f) => f.key === fieldKey)) {
      return { ok: false, error: 'Unknown content field.' };
    }

    const streamId = `regen_${Date.now()}`;

    try {
      const client = sanitizeClientPayload(rawClient || {});
      const { systemPrompt, userPrompt } = await buildRegeneratePrompt(state, client, fieldKey);

      const raw = await callAI({
        providerId: ready.providerId,
        apiKey: ready.apiKey,
        model: ready.model,
        customBaseUrl: ready.customBaseUrl,
        temperature: Math.min(1.0, ready.temperature + 0.15),
        systemPrompt,
        userPrompt,
        jsonMode: true,
        onChunk: (token) => {
          try {
            event.sender.send(CHANNELS.AI_STREAM_CHUNK, { streamId, fieldKey, token, kind: 'field' });
          } catch {}
        },
      });

      try {
        event.sender.send(CHANNELS.AI_STREAM_DONE, { streamId, fieldKey });
      } catch {}

      const parsed = parseGroqJson(raw);
      const value = typeof parsed[fieldKey] === 'string' ? parsed[fieldKey].trim() : '';
      if (!value) throw new AIClientError('AI did not return usable content. Try again.');

      recordGenerationStats([fieldKey]);
      return { ok: true, fieldKey, value };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AIClientError) {
        return { ok: false, error: error.message };
      }
      return { ok: false, error: `Regeneration failed: ${error.message}` };
    }
  });

  ipcMain.handle(CHANNELS.AI_POLISH, async (event, { text, instruction, language } = {}) => {
    if (!text || !text.trim()) {
      return { ok: false, error: 'No text provided to polish.' };
    }
    if (!instruction || !instruction.trim()) {
      return { ok: false, error: 'No polish instruction provided.' };
    }

    const state = getState();
    const ready = await ensureReady(state);
    if (ready.error) return { ok: false, error: ready.error };

    const streamId = `polish_${Date.now()}`;

    try {
      const userPrompt = await buildPolishPrompt({
        text,
        instruction,
        language: language || state.ai?.defaultLanguage || 'English (US)',
      });

      const polished = await callAI({
        providerId: ready.providerId,
        apiKey: ready.apiKey,
        model: ready.model,
        customBaseUrl: ready.customBaseUrl,
        temperature: 0.5,
        systemPrompt: 'You are an expert copy polish engine. Output ONLY the rewritten text without commentary.',
        userPrompt,
        jsonMode: false,
        onChunk: (token) => {
          try {
            event.sender.send(CHANNELS.AI_STREAM_CHUNK, { streamId, token, kind: 'polish' });
          } catch {}
        },
      });

      try {
        event.sender.send(CHANNELS.AI_STREAM_DONE, { streamId, kind: 'polish' });
      } catch {}

      return { ok: true, value: polished.trim() };
    } catch (error) {
      return { ok: false, error: `Polish failed: ${error.message}` };
    }
  });
}

/**
 * Maps provider ID to a suitable vision-capable model.
 */
function getVisionModel(providerId, configuredModel) {
  if (providerId === 'groq') {
    return 'qwen/qwen3.8-27b';
  }
  if (providerId === 'openai') {
    return (configuredModel?.includes('gpt-4') || configuredModel?.includes('o3') || configuredModel?.includes('o1'))
      ? configuredModel
      : 'gpt-4o-mini';
  }
  if (providerId === 'gemini') {
    return configuredModel || 'gemini-2.0-flash';
  }
  if (providerId === 'anthropic') {
    return configuredModel || 'claude-3-5-haiku-20241022';
  }
  if (providerId === 'ollama') {
    return configuredModel || 'llava';
  }
  return null;
}

/**
 * Resolves the best available vision provider and API key.
 * Prioritizes the active provider (e.g. Groq with qwen/qwen3.8-27b),
 * and seamlessly falls back to other saved keys if needed.
 */
async function resolveVisionProvider(state) {
  const activeProviderId = state.ai?.provider || 'groq';
  const userDataPath = app.getPath('userData');

  let activeKey = '';
  const activeConfig = PROVIDERS[activeProviderId];
  if (activeConfig?.requiresKey) {
    activeKey = await readProviderKey(userDataPath, activeProviderId);
  }

  const activeVisionModel = getVisionModel(activeProviderId, state.ai?.model);

  // If active provider directly supports vision (Groq, OpenAI, Gemini, Anthropic, Ollama)
  if (activeVisionModel && (activeKey || !activeConfig?.requiresKey)) {
    return {
      providerId: activeProviderId,
      apiKey: activeKey,
      model: activeVisionModel,
      customBaseUrl: state.ai?.customBaseUrl || '',
    };
  }

  // Fallback to any other saved provider key that supports vision
  for (const altId of ['groq', 'gemini', 'openai', 'anthropic']) {
    if (altId === activeProviderId) continue;
    const altKey = await readProviderKey(userDataPath, altId);
    if (altKey) {
      return {
        providerId: altId,
        apiKey: altKey,
        model: getVisionModel(altId, null),
        customBaseUrl: '',
      };
    }
  }

  return {
    error: 'Please configure an API key for Groq, Google Gemini (free at aistudio.google.com), or OpenAI in Settings to analyze screenshots.',
  };
}

/**
 * Registers the image extraction IPC handler.
 * Exposed as api.ai.extractFromImage in the renderer.
 */
export function registerImageExtractHandler() {
  ipcMain.handle(CHANNELS.AI_EXTRACT_IMAGE, async (_event, { imageBase64, mimeType }) => {
    const state = getState();
    const resolved = await resolveVisionProvider(state);
    if (resolved.error) return { ok: false, error: resolved.error };

    const systemPrompt = `You are an expert sales intelligence AI. You analyze screenshots of LinkedIn profiles, LinkedIn posts, job descriptions (JDs), company pages, or emails, and extract high-accuracy lead data for cold outreach. Always respond ONLY with a raw JSON object — no code blocks, no backticks, no explanations.`;

    const textPrompt = `Analyze this screenshot thoroughly. Extract all visible details about the person, job, or company. Return a JSON object with these exact keys:
{
  "name": "Full name of the person (author of the post, profile owner, or hiring manager; empty string if not found)",
  "company": "Company or organization name (empty string if not found)",
  "designation": "Job title or current role (e.g. Founder, VP of Engineering, Head of Sales; empty string if not found)",
  "website": "Company website or domain URL if visible (empty string if not found)",
  "industry": "Industry or market sector (e.g. SaaS, Fintech, HealthTech, AI / ML, E-commerce, Agency; empty string if not found)",
  "country": "Location, city, or country if visible (empty string if not found)",
  "requirements": "Key context, pain points, job requirements, skills, or highlights from the post/JD that can be referenced in an outreach email (2-4 clear sentences)."
}
Output valid JSON only.`;

    try {
      const raw = await callAIVision({
        providerId: resolved.providerId,
        apiKey: resolved.apiKey,
        model: resolved.model,
        customBaseUrl: resolved.customBaseUrl,
        systemPrompt,
        textPrompt,
        imageBase64,
        mimeType: mimeType || 'image/png',
      });

      // Parse JSON from response — handle reasoning thinking blocks and markdown fences
      let cleaned = raw.trim();
      cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      } else {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      }

      const parsed = JSON.parse(cleaned);

      return {
        ok: true,
        providerUsed: resolved.providerId,
        data: {
          name: String(parsed.name || '').trim(),
          company: String(parsed.company || '').trim(),
          designation: String(parsed.designation || '').trim(),
          website: String(parsed.website || '').trim(),
          industry: String(parsed.industry || '').trim(),
          country: String(parsed.country || '').trim(),
          requirements: String(parsed.requirements || '').trim(),
        },
      };
    } catch (err) {
      if (err instanceof SyntaxError) {
        return { ok: false, error: 'Could not parse AI response as JSON. Try taking a tighter or clearer screenshot.' };
      }
      return { ok: false, error: err.message };
    }
  });
}
