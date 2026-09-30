/**
 * @file Client-side validation for instant form feedback. These mirror,
 * but do not replace, the authoritative checks in the main process
 * (src/main/utils/validate.js) — the renderer is never trusted as the
 * final gate.
 */

/** @param {string} value @returns {boolean} */
export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/** @param {string} value @returns {boolean} */
export function isValidEmail(value) {
  if (!value) return true; // empty is allowed unless required elsewhere
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** @param {string} value @returns {boolean} */
export function isValidUrl(value) {
  if (!value) return true;
  try {
    // eslint-disable-next-line no-new
    new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a set of { value, rules } fields and returns the first error
 * message, or null if everything passes.
 * @param {Array<{ value: string, label: string, required?: boolean, email?: boolean, url?: boolean }>} fields
 * @returns {string|null}
 */
export function firstError(fields) {
  for (const field of fields) {
    if (field.required && !isNonEmpty(field.value)) return `${field.label} is required.`;
    if (field.email && !isValidEmail(field.value)) return `${field.label} does not look like a valid email.`;
    if (field.url && !isValidUrl(field.value)) return `${field.label} does not look like a valid URL.`;
  }
  return null;
}
