/**
 * @file Defensive validation for anything arriving over IPC from the
 * renderer. The renderer is untrusted input as far as the main process is
 * concerned, even though it ships inside our own app.
 */

const MAX_SHORT_TEXT = 200;
const MAX_LONG_TEXT = 8000;

/**
 * Thrown when a payload fails validation. Carries a user-facing message so
 * the renderer can display it directly.
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Trims and length-checks a string field.
 * @param {*} value
 * @param {string} fieldName
 * @param {{ required?: boolean, max?: number }} [options]
 * @returns {string}
 */
export function sanitizeText(value, fieldName, options = {}) {
  const { required = false, max = MAX_SHORT_TEXT } = options;
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`${fieldName} is required.`);
    return '';
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be text.`);
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  if (trimmed.length > max) {
    throw new ValidationError(`${fieldName} must be under ${max} characters.`);
  }
  return trimmed;
}

/**
 * Validates an email address loosely — good enough to catch typos, not
 * meant to be a full RFC 5322 parser.
 * @param {*} value
 * @param {string} fieldName
 * @param {{ required?: boolean }} [options]
 * @returns {string}
 */
export function sanitizeEmail(value, fieldName, options = {}) {
  const text = sanitizeText(value, fieldName, { ...options, max: MAX_SHORT_TEXT });
  if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    throw new ValidationError(`${fieldName} does not look like a valid email.`);
  }
  return text;
}

/**
 * Validates a URL loosely, auto-prefixing "https://" when the protocol is
 * missing so users can type "acme.com" during onboarding.
 * @param {*} value
 * @param {string} fieldName
 * @param {{ required?: boolean }} [options]
 * @returns {string}
 */
export function sanitizeUrl(value, fieldName, options = {}) {
  let text = sanitizeText(value, fieldName, { ...options, max: MAX_SHORT_TEXT });
  if (!text) return '';
  if (!/^https?:\/\//i.test(text)) {
    text = `https://${text}`;
  }
  try {
    // eslint-disable-next-line no-new
    new URL(text);
  } catch {
    throw new ValidationError(`${fieldName} does not look like a valid URL.`);
  }
  return text;
}

/**
 * Validates an array of short strings (used for the services list).
 * @param {*} value
 * @param {string} fieldName
 * @returns {string[]}
 */
export function sanitizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be a list.`);
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .slice(0, 50);
}

export const LIMITS = { MAX_SHORT_TEXT, MAX_LONG_TEXT };
