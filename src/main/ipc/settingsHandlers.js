/**
 * @file IPC handlers for the company/user/services settings that back the
 * onboarding wizard and the Settings page.
 */

import { ipcMain, dialog, app } from 'electron';
import { promises as fs } from 'node:fs';
import { getState, updateState, resetState } from '../store/index.js';
import { clearApiKey } from '../groq/keyVault.js';
import { clearAllProviderKeys } from '../ai/keyVault.js';
import { CHANNELS } from '../../shared/channels.js';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeStringArray,
  ValidationError,
  LIMITS,
} from '../utils/validate.js';

/**
 * Validates and normalizes a settings payload from the renderer. Any field
 * omitted from `payload` is left untouched by the caller (updateState does
 * a deep merge), so partial saves — e.g. just the Groq model — are safe.
 * @param {Object} payload
 * @returns {Object}
 */
function sanitizeSettingsPayload(payload) {
  const clean = {};

  if (payload.company) {
    clean.company = {
      name: sanitizeText(payload.company.name, 'Company name', { required: true }),
      logo: typeof payload.company.logo === 'string' ? payload.company.logo : undefined,
      website: sanitizeUrl(payload.company.website, 'Company website'),
      address: sanitizeText(payload.company.address, 'Address', { max: LIMITS.MAX_SHORT_TEXT }),
      phone: sanitizeText(payload.company.phone, 'Contact number', { max: 40 }),
      email: sanitizeEmail(payload.company.email, 'Company email'),
      linkedin: sanitizeUrl(payload.company.linkedin, 'Company LinkedIn URL'),
    };
  }

  if (payload.user) {
    clean.user = {
      fullName: sanitizeText(payload.user.fullName, 'Full name', { required: true }),
      designation: sanitizeText(payload.user.designation, 'Designation'),
      department: sanitizeText(payload.user.department, 'Department'),
      signature: sanitizeText(payload.user.signature, 'Signature', { max: LIMITS.MAX_LONG_TEXT }),
      avatar: typeof payload.user.avatar === 'string' ? payload.user.avatar : '',
    };
  }

  if (Array.isArray(payload.senderProfiles)) {
    clean.senderProfiles = payload.senderProfiles.map((p, idx) => ({
      id: sanitizeText(p.id || `profile_${idx + 1}`, 'Profile ID'),
      name: sanitizeText(p.name || `Profile ${idx + 1}`, 'Profile Name'),
      fullName: sanitizeText(p.fullName || '', 'Full Name'),
      designation: sanitizeText(p.designation || '', 'Designation'),
      department: sanitizeText(p.department || '', 'Department'),
      signature: sanitizeText(p.signature || '', 'Signature', { max: LIMITS.MAX_LONG_TEXT }),
      avatar: typeof p.avatar === 'string' ? p.avatar : '',
    }));
  }

  if (typeof payload.activeSenderProfileId === 'string') {
    clean.activeSenderProfileId = sanitizeText(payload.activeSenderProfileId, 'Active Profile');
  }

  if (payload.services) {
    clean.services = sanitizeStringArray(payload.services, 'Services');
  }

  if (payload.groq?.model) {
    clean.groq = { model: sanitizeText(payload.groq.model, 'Model') };
  }

  if (payload.ai) {
    clean.ai = {
      ...(typeof payload.ai.provider === 'string' ? { provider: sanitizeText(payload.ai.provider, 'Provider') } : {}),
      ...(typeof payload.ai.model === 'string' ? { model: sanitizeText(payload.ai.model, 'Model') } : {}),
      ...(typeof payload.ai.customBaseUrl === 'string' ? { customBaseUrl: sanitizeText(payload.ai.customBaseUrl, 'Base URL') } : {}),
      ...(typeof payload.ai.temperature === 'number' ? { temperature: Math.max(0, Math.min(1.0, payload.ai.temperature)) } : {}),
      ...(typeof payload.ai.defaultLanguage === 'string' ? { defaultLanguage: sanitizeText(payload.ai.defaultLanguage, 'Default Language') } : {}),
    };
  }

  if (typeof payload.theme === 'string') {
    clean.theme = sanitizeText(payload.theme, 'Theme');
  }

  if (typeof payload.onboarded === 'boolean') {
    clean.onboarded = payload.onboarded;
  }

  return clean;
}

/** Registers every settings-related ipcMain.handle listener. */
export function registerSettingsHandlers() {
  ipcMain.handle(CHANNELS.SETTINGS_GET, () => {
    const state = getState();
    // Never send the raw key; hasKey already lives in state.groq.
    return state;
  });

  ipcMain.handle(CHANNELS.SETTINGS_SAVE, (_event, payload) => {
    try {
      const clean = sanitizeSettingsPayload(payload || {});
      return { ok: true, state: updateState(clean) };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { ok: false, error: error.message };
      }
      return { ok: false, error: 'Could not save settings.' };
    }
  });

  ipcMain.handle(CHANNELS.SETTINGS_RESET, async () => {
    try {
      await clearApiKey(app.getPath('userData'));
      await clearAllProviderKeys(app.getPath('userData'));
    } catch {}
    return resetState();
  });

  ipcMain.handle(CHANNELS.SETTINGS_EXPORT, async () => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export WishReach configuration',
        defaultPath: 'wishreach-config.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (canceled || !filePath) return { ok: false, canceled: true };

      const state = getState();
      const exportable = {
        company: state.company,
        user: state.user,
        services: state.services,
        senderProfiles: state.senderProfiles || [],
        activeSenderProfileId: state.activeSenderProfileId || '',
        theme: state.theme || 'dark',
        groq: { model: state.groq?.model },
      };
      await fs.writeFile(filePath, JSON.stringify(exportable, null, 2), 'utf-8');
      return { ok: true, filePath };
    } catch (err) {
      return { ok: false, error: err.message || 'Could not export configuration.' };
    }
  });

  ipcMain.handle(CHANNELS.SETTINGS_IMPORT, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import WishReach configuration',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (canceled || filePaths.length === 0) return { ok: false, canceled: true };

    try {
      const raw = await fs.readFile(filePaths[0], 'utf-8');
      const parsed = JSON.parse(raw);
      const clean = sanitizeSettingsPayload(parsed);
      return { ok: true, state: updateState({ ...clean, onboarded: true }) };
    } catch {
      return { ok: false, error: 'That file is not a valid WishReach configuration.' };
    }
  });
}
