/**
 * @file Default shape of the persisted application state. electron-store
 * writes this to disk as JSON; the Groq API key itself never lives here in
 * plaintext (see groq/keyVault.js) — only a boolean flag and the chosen
 * model do.
 */

/**
 * @typedef {Object} CompanyProfile
 * @property {string} name
 * @property {string} logo       Data URI ("data:image/png;base64,...") or "".
 * @property {string} website
 * @property {string} address
 * @property {string} phone
 * @property {string} email
 * @property {string} linkedin
 */

/**
 * @typedef {Object} UserIdentity
 * @property {string} fullName
 * @property {string} designation
 * @property {string} department
 * @property {string} signature
 */

/**
 * @typedef {Object} GroqSettings
 * @property {string} model
 * @property {boolean} hasKey     True once a key has been saved via safeStorage.
 */

/**
 * @typedef {Object} Draft
 * @property {string} id
 * @property {number} timestamp
 * @property {string} clientName
 * @property {string} clientCompany
 * @property {string} type          One of the CONTENT_TYPES ids.
 * @property {string} content
 * @property {string} goal
 * @property {string} tone
 */

/**
 * @typedef {Object} Template
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} content
 * @property {number} createdAt
 */

/** Canonical list of models we know Groq serves well for business writing. */
export const GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B (Recommended)' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
  { id: 'openai/gpt-oss-safeguard-20b', label: 'GPT-OSS Safeguard 20B' },
  { id: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2 Instruct' },
  { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B (Alibaba Cloud - Vision)' },
];

/** @returns {{company: CompanyProfile, user: UserIdentity, services: string[], groq: GroqSettings, drafts: Draft[], templates: Template[], onboarded: boolean, stats: object}} */
export function createDefaultState() {
  return {
    onboarded: false,
    company: {
      name: '',
      logo: '',
      website: '',
      address: '',
      phone: '',
      email: '',
      linkedin: '',
    },
    user: {
      fullName: '',
      designation: '',
      department: '',
      signature: '',
      avatar: '',
    },
    senderProfiles: [],
    activeSenderProfileId: '',
    services: [],
    groq: {
      model: GROQ_MODELS[0].id,
      hasKey: false,
    },
    ai: {
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      customBaseUrl: '',
      temperature: 0.7,
      defaultLanguage: 'English (US)',
      keys: {
        groq: false,
        openai: false,
        gemini: false,
        anthropic: false,
        ollama: true,
      },
    },
    drafts: [],
    templates: [],
    leads: [],
    theme: 'dark',
    stats: {
      totalDrafts: 0,
      emailsGenerated: 0,
      linkedinGenerated: 0,
      lastGeneratedAt: null,
    },
  };
}
