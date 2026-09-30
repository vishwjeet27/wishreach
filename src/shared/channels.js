/**
 * @file Single source of truth for IPC channel names. Imported by both the
 * preload bridge and the main-process handlers so a typo fails loudly at
 * import time instead of silently at call time.
 */

export const CHANNELS = Object.freeze({
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
});
