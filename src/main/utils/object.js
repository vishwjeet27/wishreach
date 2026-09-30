/**
 * @file Small, dependency-free object helpers used by the store and IPC
 * layers. Kept separate from business logic so they stay easy to unit test.
 */

/**
 * Returns true when a value is a plain object (not an array, not null).
 * @param {*} value
 * @returns {boolean}
 */
export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep-merges `source` into `target` without mutating either argument.
 * Arrays are replaced wholesale (not concatenated) because every array in
 * the store schema — drafts, templates, services — is always written back
 * in full by the caller.
 * @param {Record<string, any>} target
 * @param {Record<string, any>} source
 * @returns {Record<string, any>}
 */
export function deepMerge(target, source) {
  const output = { ...target };
  if (!isPlainObject(source)) return output;

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      output[key] = deepMerge(targetValue, sourceValue);
    } else {
      output[key] = sourceValue;
    }
  }
  return output;
}

/**
 * Generates a short, sortable, collision-resistant id for drafts/templates
 * without pulling in a UUID dependency.
 * @returns {string}
 */
export function generateId() {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 9);
  return `${timePart}-${randomPart}`;
}
