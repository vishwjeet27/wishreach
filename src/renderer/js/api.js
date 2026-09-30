/**
 * @file Renderer-side API surface. Every call goes through
 * `window.wishreach`, the object exposed by the contextBridge preload —
 * the renderer never touches ipcRenderer or Node directly.
 */

/** @type {any} */
const bridge = window.wishreach;

/**
 * Unwraps the `{ ok, error, ... }` convention used by write-style IPC
 * handlers, throwing a plain Error with the user-facing message on
 * failure so callers can just try/catch.
 * @param {Promise<{ok: boolean, error?: string}>} promise
 * @returns {Promise<any>}
 */
async function unwrap(promise) {
  const result = await promise;
  if (result && result.ok === false) {
    if (result.canceled) return null;
    throw new Error(result.error || 'Something went wrong.');
  }
  return result;
}

export const api = {
  app: {
    getVersion: () => bridge.app.getVersion(),
  },
  settings: {
    get: () => bridge.settings.get(),
    save: (payload) => unwrap(bridge.settings.save(payload)),
    reset: () => bridge.settings.reset(),
    export: () => unwrap(bridge.settings.export()),
    import: () => unwrap(bridge.settings.import()),
  },
  groq: {
    listModels: () => bridge.groq.listModels(),
    saveKey: (key) => unwrap(bridge.groq.saveKey(key)),
    clearKey: () => unwrap(bridge.groq.clearKey()),
    testKey: () => unwrap(bridge.groq.testKey()),
  },
  ai: {
    generate: (client) => unwrap(bridge.ai.generate(client)),
    regenerate: (client, fieldKey) => unwrap(bridge.ai.regenerate({ client, fieldKey })),
    polish: ({ text, instruction, language }) => unwrap(bridge.ai.polish({ text, instruction, language })),
    getProviders: () => bridge.ai.getProviders(),
    saveProviderKey: (providerId, key) => unwrap(bridge.ai.saveProviderKey(providerId, key)),
    clearProviderKey: (providerId) => unwrap(bridge.ai.clearProviderKey(providerId)),
    testProviderKey: (payload) => unwrap(bridge.ai.testProviderKey(payload)),
    extractFromImage: (payload) => bridge.ai.extractFromImage(payload),
    onStreamChunk: (cb) => bridge.ai.onStreamChunk(cb),
    onStreamDone: (cb) => bridge.ai.onStreamDone(cb),
  },
  drafts: {
    list: () => bridge.drafts.list(),
    save: (draft) => unwrap(bridge.drafts.save(draft)),
    delete: (id) => bridge.drafts.delete(id),
    export: () => unwrap(bridge.drafts.export()),
    exportCsv: () => unwrap(bridge.drafts.exportCsv()),
    exportPdf: (payload) => unwrap(bridge.drafts.exportPdf(payload)),
  },
  leads: {
    list: () => bridge.leads.list(),
    save: (lead) => unwrap(bridge.leads.save(lead)),
    delete: (id) => bridge.leads.delete(id),
  },
  templates: {
    list: () => bridge.templates.list(),
    save: (template) => unwrap(bridge.templates.save(template)),
    delete: (id) => bridge.templates.delete(id),
  },
  system: {
    copyToClipboard: (text) => bridge.system.copyToClipboard(text),
    pickLogoImage: () => unwrap(bridge.system.pickLogoImage()),
  },
};
