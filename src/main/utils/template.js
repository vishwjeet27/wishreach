/**
 * @file Minimal `{{token}}` template renderer for the prompt files in
 * /prompts. Deliberately not a templating library — the prompt files are
 * plain text with a handful of placeholders, so a tiny regex replace keeps
 * the dependency surface small.
 */

/**
 * Replaces every `{{key}}` occurrence in `template` with `values[key]`.
 * Unknown keys are replaced with an empty string rather than left in place,
 * so a missing field never leaks a raw "{{token}}" into a generated email.
 * @param {string} template
 * @param {Record<string, string>} values
 * @returns {string}
 */
export function renderTemplate(template, values) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
    const value = values[key];
    return value === undefined || value === null || value === '' ? '' : String(value);
  });
}
