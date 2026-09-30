/**
 * @file Single in-memory store for the renderer. Not Redux — just an
 * object plus a subscriber list — because the app's state shape is small
 * and mirrors what main.js already persists.
 */

const listeners = new Set();

/** @type {{settings: Object|null, drafts: Array, templates: Array, lastGeneration: Object|null}} */
let state = {
  settings: null,
  drafts: [],
  templates: [],
  lastGeneration: null,
  generatorSession: {
    client: {
      clientName: '',
      clientCompany: '',
      clientDesignation: '',
      clientWebsite: '',
      targetCountry: '',
      industry: '',
      requirements: '',
      tone: 'Professional',
      goal: 'Cold Outreach',
      language: 'English (US)',
      strategy: 'Variant A: Direct & Solution',
      senderProfileId: '',
    },
    variantsContent: { A: null, B: null, C: null },
    currentVariantId: 'A',
    activeTab: 'coldEmail',
  },
  signatureSession: {
    fullName: '',
    designation: '',
    department: '',
    companyName: '',
    companyWebsite: '',
    email: '',
    phone: '',
    address: '',
    logoUrl: '',
    avatarShape: 'round', // 'round' | 'square'
    bookingText: 'Book a 15-min call',
    bookingUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    githubUrl: '',
    disclaimer: '',
    templateId: 'executive', // 'executive' | 'minimal' | 'compact' | 'brand_card'
    accentColor: '#4f46e5',
    themeBg: 'light', // 'light' or 'dark' preview mode
  },
};

/** @returns {typeof state} */
export function getAppState() {
  return state;
}

/**
 * Updates signature session state.
 * @param {Partial<typeof state.signatureSession>} partial
 */
export function updateSignatureSession(partial) {
  state.signatureSession = {
    ...state.signatureSession,
    ...partial,
  };
}

/**
 * Updates generator persistent session state.
 * @param {Partial<typeof state.generatorSession>} partial
 */
export function updateGeneratorSession(partial) {
  state.generatorSession = {
    ...state.generatorSession,
    ...partial,
    client: {
      ...state.generatorSession.client,
      ...(partial.client || {}),
    },
    variantsContent: {
      ...state.generatorSession.variantsContent,
      ...(partial.variantsContent || {}),
    },
  };
}

/** Resets the generator state back to clean initial state. */
export function resetGeneratorSession() {
  state.generatorSession = {
    client: {
      clientName: '',
      clientCompany: '',
      clientDesignation: '',
      clientWebsite: '',
      targetCountry: '',
      industry: '',
      requirements: '',
      tone: 'Professional',
      goal: 'Cold Outreach',
      language: state.settings?.ai?.defaultLanguage || 'English (US)',
      strategy: 'Variant A: Direct & Solution',
      senderProfileId: '',
    },
    variantsContent: { A: null, B: null, C: null },
    currentVariantId: 'A',
    activeTab: 'coldEmail',
  };
}

/**
 * Shallow-merges `partial` into the store and notifies subscribers.
 * @param {Partial<typeof state>} partial
 */
export function setAppState(partial) {
  state = { ...state, ...partial };
  for (const listener of listeners) listener(state);
}

/**
 * Subscribes to store changes.
 * @param {(state: typeof state) => void} listener
 * @returns {() => void} Unsubscribe function.
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
