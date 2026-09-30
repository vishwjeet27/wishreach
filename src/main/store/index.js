/**
 * @file Single persistent store for WishReach. Wraps electron-store
 * so the rest of the app never touches the library directly — that keeps
 * the on-disk shape and migration logic in one place.
 */

import Store from 'electron-store';
import { createDefaultState } from './schema.js';
import { deepMerge } from '../utils/object.js';

let store;

/**
 * Lazily creates the singleton electron-store instance. Deferred so this
 * module can be imported before `app.whenReady()`.
 * @returns {Store}
 */
function getStore() {
  if (!store) {
    store = new Store({
      name: 'wishreach',
      defaults: createDefaultState(),
      clearInvalidConfig: true,
    });
  }
  return store;
}

/** @returns {ReturnType<typeof createDefaultState>} */
export function getState() {
  return getStore().store;
}

/**
 * Merges a partial state update into the store. Deep-merges plain objects
 * (company, user, groq, stats); arrays are replaced wholesale by the
 * caller, matching how the renderer always sends the full list.
 * @param {Partial<ReturnType<typeof createDefaultState>>} partial
 * @returns {ReturnType<typeof createDefaultState>}
 */
export function updateState(partial) {
  const next = deepMerge(getState(), partial);
  getStore().store = next;
  return next;
}

/** Wipes the store back to defaults. Does not touch the Groq key vault. */
export function resetState() {
  getStore().store = createDefaultState();
  return getState();
}

/** @returns {string} Absolute path to the underlying JSON file, for export. */
export function getStoreFilePath() {
  return getStore().path;
}
