/**
 * WishReach - Personalized AI Cold Outreach Platform
 * Copyright (C) 2026 Vishwjeet Singh Vilkhu <https://github.com/vishwjeet-vilkhu>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * @file Preload script. Runs in an isolated context with access to Node
 * and Electron, but the renderer only ever sees whatever is explicitly
 * exposed through contextBridge below — no ipcRenderer, no require, no
 * process object ever reaches page JS.
 *
 * This file is intentionally CommonJS (.cjs): package.json sets
 * "type": "module" for the rest of the app, but Electron's preload loader
 * needs `require`, so it is carved out as CommonJS explicitly.
 *
 * The CHANNELS values below must stay identical to src/shared/channels.js
 * — duplicated here rather than imported to avoid an ESM/CJS interop step
 * in the one file where that step matters most for security review.
 */

const { contextBridge, ipcRenderer } = require('electron');

const CHANNELS = {
  APP_GET_VERSION: 'app:get-version',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SAVE: 'settings:save',
  SETTINGS_RESET: 'settings:reset',
  SETTINGS_EXPORT: 'settings:export',
  SETTINGS_IMPORT: 'settings:import',

  GROQ_SAVE_KEY: 'groq:save-key',
  GROQ_TEST_KEY: 'groq:test-key',
  GROQ_CLEAR_KEY: 'groq:clear-key',
  GROQ_MODELS: 'groq:models',

  AI_GENERATE: 'ai:generate',
  AI_REGENERATE: 'ai:regenerate',
  AI_POLISH: 'ai:polish',
  AI_STREAM_CHUNK: 'ai:stream-chunk',
  AI_STREAM_DONE: 'ai:stream-done',
  AI_PROVIDERS_GET: 'ai:providers-get',
  AI_PROVIDER_SAVE_KEY: 'ai:provider-save-key',
  AI_PROVIDER_CLEAR_KEY: 'ai:provider-clear-key',
  AI_PROVIDER_TEST_KEY: 'ai:provider-test-key',
  AI_EXTRACT_IMAGE: 'ai:extract-image',

  DRAFTS_SAVE: 'drafts:save',
  DRAFTS_LIST: 'drafts:list',
  DRAFTS_DELETE: 'drafts:delete',
  DRAFTS_EXPORT: 'drafts:export',
  DRAFTS_EXPORT_CSV: 'drafts:export-csv',
  CAMPAIGN_EXPORT_PDF: 'campaign:export-pdf',

  LEADS_LIST: 'leads:list',
  LEADS_SAVE: 'leads:save',
  LEADS_DELETE: 'leads:delete',

  TEMPLATES_LIST: 'templates:list',
  TEMPLATES_SAVE: 'templates:save',
  TEMPLATES_DELETE: 'templates:delete',

  CLIPBOARD_COPY: 'clipboard:copy',
  DIALOG_PICK_IMAGE: 'dialog:pick-image',
};

/**
 * Wraps ipcRenderer.invoke so renderer code calls plain async functions
 * instead of raw channel strings.
 * @param {string} channel
 * @returns {(...args: any[]) => Promise<any>}
 */
function invoke(channel) {
  return (...args) => ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld('wishreach', {
  app: {
    getVersion: invoke(CHANNELS.APP_GET_VERSION),
  },
  settings: {
    get: invoke(CHANNELS.SETTINGS_GET),
    save: invoke(CHANNELS.SETTINGS_SAVE),
    reset: invoke(CHANNELS.SETTINGS_RESET),
    export: invoke(CHANNELS.SETTINGS_EXPORT),
    import: invoke(CHANNELS.SETTINGS_IMPORT),
  },
  groq: {
    listModels: invoke(CHANNELS.GROQ_MODELS),
    saveKey: invoke(CHANNELS.GROQ_SAVE_KEY),
    clearKey: invoke(CHANNELS.GROQ_CLEAR_KEY),
    testKey: invoke(CHANNELS.GROQ_TEST_KEY),
  },
  ai: {
    generate: invoke(CHANNELS.AI_GENERATE),
    regenerate: invoke(CHANNELS.AI_REGENERATE),
    polish: invoke(CHANNELS.AI_POLISH),
    getProviders: invoke(CHANNELS.AI_PROVIDERS_GET),
    saveProviderKey: (providerId, key) => ipcRenderer.invoke(CHANNELS.AI_PROVIDER_SAVE_KEY, { providerId, key }),
    clearProviderKey: (providerId) => ipcRenderer.invoke(CHANNELS.AI_PROVIDER_CLEAR_KEY, { providerId }),
    testProviderKey: (payload) => ipcRenderer.invoke(CHANNELS.AI_PROVIDER_TEST_KEY, payload),
    extractFromImage: (payload) => ipcRenderer.invoke(CHANNELS.AI_EXTRACT_IMAGE, payload),
    onStreamChunk: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on(CHANNELS.AI_STREAM_CHUNK, handler);
      return () => ipcRenderer.removeListener(CHANNELS.AI_STREAM_CHUNK, handler);
    },
    onStreamDone: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on(CHANNELS.AI_STREAM_DONE, handler);
      return () => ipcRenderer.removeListener(CHANNELS.AI_STREAM_DONE, handler);
    },
  },
  drafts: {
    list: invoke(CHANNELS.DRAFTS_LIST),
    save: invoke(CHANNELS.DRAFTS_SAVE),
    delete: invoke(CHANNELS.DRAFTS_DELETE),
    export: invoke(CHANNELS.DRAFTS_EXPORT),
    exportCsv: invoke(CHANNELS.DRAFTS_EXPORT_CSV),
    exportPdf: (payload) => ipcRenderer.invoke(CHANNELS.CAMPAIGN_EXPORT_PDF, payload),
  },
  leads: {
    list: invoke(CHANNELS.LEADS_LIST),
    save: invoke(CHANNELS.LEADS_SAVE),
    delete: invoke(CHANNELS.LEADS_DELETE),
  },
  templates: {
    list: invoke(CHANNELS.TEMPLATES_LIST),
    save: invoke(CHANNELS.TEMPLATES_SAVE),
    delete: invoke(CHANNELS.TEMPLATES_DELETE),
  },
  system: {
    copyToClipboard: invoke(CHANNELS.CLIPBOARD_COPY),
    pickLogoImage: invoke(CHANNELS.DIALOG_PICK_IMAGE),
  },
});
