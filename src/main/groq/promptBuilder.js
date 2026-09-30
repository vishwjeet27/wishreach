/**
 * @file Bridges the prompt files in /prompts with the Groq client. Prompts
 * are never hardcoded in JS — they are loaded from disk and filled in with
 * renderTemplate() so a non-developer can tweak tone by editing a .txt
 * file.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTemplate } from '../utils/template.js';
import { CONTENT_FIELDS } from '../../shared/contentFields.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', '..', '..', 'prompts');

const promptCache = new Map();

/**
 * Reads a prompt file from /prompts, caching the raw text in memory.
 * @param {string} fileName
 * @returns {Promise<string>}
 */
async function loadPrompt(fileName) {
  if (promptCache.has(fileName)) return promptCache.get(fileName);
  const filePath = path.join(PROMPTS_DIR, fileName);
  const text = await fs.readFile(filePath, 'utf-8');
  promptCache.set(fileName, text);
  return text;
}

/**
 * Builds the system prompt that carries the company identity. Never sent
 * back to the renderer — only used server-side (main process) for the AI
 * call.
 * @param {Object} state  Full persisted app state (company, user, services).
 * @param {{ tone: string, goal: string, language?: string, strategy?: string }} request
 * @returns {Promise<string>}
 */
async function buildSystemPrompt(state, request) {
  const raw = await loadPrompt('system_prompt.txt');

  let activeUser = state.user || {};
  if (request.senderProfileId && Array.isArray(state.senderProfiles)) {
    const found = state.senderProfiles.find((p) => p.id === request.senderProfileId);
    if (found && found.fullName) activeUser = found;
  } else if (state.activeSenderProfileId && Array.isArray(state.senderProfiles)) {
    const found = state.senderProfiles.find((p) => p.id === state.activeSenderProfileId);
    if (found && found.fullName) activeUser = found;
  }

  return renderTemplate(raw, {
    companyName: state.company.name,
    companyWebsite: state.company.website,
    servicesList: state.services.join(', '),
    userName: activeUser.fullName || state.user?.fullName || '',
    userDesignation: activeUser.designation || state.user?.designation || '',
    userDepartment: activeUser.department || state.user?.department || '',
    signature: activeUser.signature || state.user?.signature || '',
    tone: request.tone,
    goal: request.goal,
    language: request.language || 'English (US)',
    strategy: request.strategy || 'Direct & Solution-Focused',
  });
}

/**
 * Builds prompt for one-click polish transformations.
 * @param {{ text: string, instruction: string, language?: string }} options
 * @returns {Promise<string>}
 */
export async function buildPolishPrompt({ text, instruction, language = 'English (US)' }) {
  const raw = await loadPrompt('polish.txt');
  return renderTemplate(raw, {
    originalText: text,
    instruction,
    language,
  });
}

/**
 * Builds the system + user prompt pair for a full "generate everything" run.
 * @param {Object} state
 * @param {Object} client  Client-facing fields from the Generate page.
 * @returns {Promise<{ systemPrompt: string, userPrompt: string }>}
 */
export async function buildFullGenerationPrompt(state, client) {
  const [systemPrompt, userRaw] = await Promise.all([
    buildSystemPrompt(state, client),
    loadPrompt('cold_email.txt'),
  ]);
  const userPrompt = renderTemplate(userRaw, {
    clientName: client.clientName,
    clientCompany: client.clientCompany,
    clientDesignation: client.clientDesignation,
    clientWebsite: client.clientWebsite,
    targetCountry: client.targetCountry,
    industry: client.industry,
    requirements: client.requirements,
  });
  return { systemPrompt, userPrompt };
}

/**
 * Builds the system + user prompt pair for regenerating a single field.
 * Routes to linkedin.txt for the two LinkedIn fields and followup.txt for
 * everything else, matching the dedicated prompt files requested for the
 * project.
 * @param {Object} state
 * @param {Object} client
 * @param {string} fieldKey  One of CONTENT_FIELDS[].key
 * @returns {Promise<{ systemPrompt: string, userPrompt: string }>}
 */
export async function buildRegeneratePrompt(state, client, fieldKey) {
  const field = CONTENT_FIELDS.find((f) => f.key === fieldKey);
  if (!field) {
    throw new Error(`Unknown content field: ${fieldKey}`);
  }

  const systemPrompt = await buildSystemPrompt(state, client);
  const templateFile = fieldKey === 'linkedinConnection' || fieldKey === 'linkedinDm'
    ? 'linkedin.txt'
    : 'followup.txt';
  const raw = await loadPrompt(templateFile);
  const userPrompt = renderTemplate(raw, {
    clientName: client.clientName,
    clientCompany: client.clientCompany,
    clientDesignation: client.clientDesignation,
    targetCountry: client.targetCountry,
    industry: client.industry,
    requirements: client.requirements,
    fieldKey: field.key,
    fieldLabel: field.label,
  });
  return { systemPrompt, userPrompt };
}

/**
 * Parses the JSON object Groq is instructed to return, tolerating stray
 * markdown code fences some models add despite instructions.
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export function parseGroqJson(raw) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Groq returned content that could not be parsed as JSON.');
  }
}
