/**
 * @file Multi-model provider definitions and configurations.
 * Supports Groq, OpenAI, Google Gemini, Anthropic Claude, and Ollama.
 */

export const PROVIDERS = Object.freeze({
  groq: {
    id: 'groq',
    name: 'Groq (Ultra-Fast)',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B (Recommended)' },
      { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
      { id: 'openai/gpt-oss-safeguard-20b', label: 'GPT-OSS Safeguard 20B' },
      { id: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2 Instruct' },
      { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B (Alibaba Cloud - Vision)' },
    ],
    defaultModel: 'openai/gpt-oss-120b',
    type: 'openai-compatible',
    requiresKey: true,
    helpUrl: 'https://console.groq.com/keys',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o (Flagship Smart)' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Efficient)' },
      { id: 'o3-mini', label: 'o3-mini (Reasoning)' },
    ],
    defaultModel: 'gpt-4o-mini',
    type: 'openai-compatible',
    requiresKey: true,
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Next-Gen Fast)' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Deep Context)' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Balanced)' },
    ],
    defaultModel: 'gemini-2.0-flash',
    type: 'openai-compatible',
    requiresKey: true,
    helpUrl: 'https://aistudio.google.com/app/apikey',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Best Writer)' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Speed & Quality)' },
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    type: 'anthropic',
    requiresKey: true,
    helpUrl: 'https://console.anthropic.com/settings/keys',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local / Privacy-First)',
    baseUrl: 'http://localhost:11434/v1',
    models: [
      { id: 'llama3.2', label: 'Llama 3.2' },
      { id: 'mistral', label: 'Mistral 7B' },
      { id: 'qwen2.5', label: 'Qwen 2.5' },
      { id: 'deepseek-r1:8b', label: 'DeepSeek R1 8B' },
    ],
    defaultModel: 'llama3.2',
    type: 'openai-compatible',
    requiresKey: false,
    helpUrl: 'https://ollama.com/',
  },
});

export const LANGUAGES = Object.freeze([
  { id: 'English (US)', label: 'English (US)' },
  { id: 'English (UK)', label: 'English (UK)' },
  { id: 'Spanish (Español)', label: 'Spanish (Español)' },
  { id: 'French (Français)', label: 'French (Français)' },
  { id: 'German (Deutsch)', label: 'German (Deutsch)' },
  { id: 'Italian (Italiano)', label: 'Italian (Italiano)' },
  { id: 'Portuguese (Português)', label: 'Portuguese (Português)' },
  { id: 'Dutch (Nederlands)', label: 'Dutch (Nederlands)' },
  { id: 'Hindi (हिन्दी)', label: 'Hindi (हिन्दी)' },
  { id: 'Japanese (日本語)', label: 'Japanese (日本語)' },
  { id: 'Arabic (العربية)', label: 'Arabic (العربية)' },
]);

export const STRATEGY_VARIANTS = Object.freeze([
  {
    id: 'A',
    name: 'Variant A',
    label: 'Direct & Solution',
    description: 'Outcome-driven pitch focusing on immediate value proposition and concrete ROI.',
  },
  {
    id: 'B',
    name: 'Variant B',
    label: 'Pain-Point & Agitate',
    description: 'Highlights common industry friction, bottlenecks, and costs of delayed action.',
  },
  {
    id: 'C',
    name: 'Variant C',
    label: 'Consultative & Hook',
    description: 'Low-friction conversational approach asking an insightful question to start a peer dialogue.',
  },
]);

export const POLISH_ACTIONS = Object.freeze([
  {
    id: 'shorten',
    label: 'Shorten (50%)',
    instruction: 'Cut length roughly in half. Keep it punchy, remove all filler words, retain core value hook and call to action.',
  },
  {
    id: 'executive',
    label: 'More Executive',
    instruction: 'Adopt a crisp C-suite executive tone: strategic, outcome-oriented, zero fluff, authoritative yet respectful.',
  },
  {
    id: 'casual',
    label: 'More Casual',
    instruction: 'Make it sound friendly, relaxed, and conversational — like a message from a knowledgeable peer rather than a formal sales pitch.',
  },
  {
    id: 'urgency',
    label: 'Add Urgency',
    instruction: 'Introduce a compelling, realistic reason to connect sooner (e.g. upcoming quarter planning, limited capacity, recent market shift) without sounding spammy.',
  },
  {
    id: 'grammar',
    label: 'Fix Grammar & Polish',
    instruction: 'Improve sentence flow, clarity, and rhythm. Eliminate awkward phrasing and fix any grammatical issues while preserving tone.',
  },
]);
