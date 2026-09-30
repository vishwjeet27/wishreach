/**
 * @file IPC handlers for everything Groq-credential related. The raw API
 * key only ever exists in the main process; the renderer sends it once to
 * be encrypted and never receives it back.
 */

import { ipcMain, app } from 'electron';
import { saveApiKey, readApiKey, clearApiKey } from '../groq/keyVault.js';
import { testGroqKey, GroqError } from '../groq/client.js';
import { getState, updateState } from '../store/index.js';
import { GROQ_MODELS } from '../store/schema.js';
import { CHANNELS } from '../../shared/channels.js';
import { sanitizeText, ValidationError } from '../utils/validate.js';

/** Registers every Groq-credential ipcMain.handle listener. */
export function registerGroqHandlers() {
  ipcMain.handle(CHANNELS.GROQ_MODELS, () => GROQ_MODELS);

  ipcMain.handle(CHANNELS.GROQ_SAVE_KEY, async (_event, apiKey) => {
    try {
      const clean = sanitizeText(apiKey, 'API key', { required: true, max: 300 });
      await saveApiKey(app.getPath('userData'), clean);
      const state = updateState({ groq: { hasKey: true } });
      return { ok: true, state };
    } catch (error) {
      if (error instanceof ValidationError) return { ok: false, error: error.message };
      return { ok: false, error: error.message || 'Could not save the API key.' };
    }
  });

  ipcMain.handle(CHANNELS.GROQ_CLEAR_KEY, async () => {
    await clearApiKey(app.getPath('userData'));
    const state = updateState({ groq: { hasKey: false } });
    return { ok: true, state };
  });

  ipcMain.handle(CHANNELS.GROQ_TEST_KEY, async () => {
    try {
      const apiKey = await readApiKey(app.getPath('userData'));
      if (!apiKey) return { ok: false, error: 'No API key saved yet.' };
      const { groq } = getState();
      await testGroqKey({ apiKey, model: groq.model });
      return { ok: true };
    } catch (error) {
      if (error instanceof GroqError) return { ok: false, error: error.message };
      return { ok: false, error: 'Could not verify the API key.' };
    }
  });
}
