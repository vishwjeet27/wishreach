/**
 * @file IPC handlers for user-authored templates, grouped by industry
 * category, shown on the Templates page.
 */

import { ipcMain } from 'electron';
import { getState, updateState } from '../store/index.js';
import { CHANNELS } from '../../shared/channels.js';
import { generateId } from '../utils/object.js';
import { sanitizeText, ValidationError, LIMITS } from '../utils/validate.js';

const CATEGORIES = ['SaaS', 'Healthcare', 'E-commerce', 'Agencies', 'Startups', 'Other'];

/** Registers the templates ipcMain.handle listeners. */
export function registerTemplatesHandlers() {
  ipcMain.handle(CHANNELS.TEMPLATES_LIST, () => getState().templates);

  ipcMain.handle(CHANNELS.TEMPLATES_SAVE, (_event, payload) => {
    try {
      const name = sanitizeText(payload?.name, 'Template name', { required: true });
      const category = CATEGORIES.includes(payload?.category) ? payload.category : 'Other';
      const content = sanitizeText(payload?.content, 'Template content', {
        required: true,
        max: LIMITS.MAX_LONG_TEXT,
      });

      const state = getState();
      let templates;
      if (payload?.id) {
        templates = state.templates.map((t) =>
          t.id === payload.id ? { ...t, name, category, content } : t
        );
      } else {
        templates = [
          { id: generateId(), name, category, content, createdAt: Date.now() },
          ...state.templates,
        ];
      }
      updateState({ templates });
      return { ok: true, templates };
    } catch (error) {
      if (error instanceof ValidationError) return { ok: false, error: error.message };
      return { ok: false, error: 'Could not save template.' };
    }
  });

  ipcMain.handle(CHANNELS.TEMPLATES_DELETE, (_event, id) => {
    const state = getState();
    const templates = state.templates.filter((t) => t.id !== id);
    updateState({ templates });
    return templates;
  });
}
