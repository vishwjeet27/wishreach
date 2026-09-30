/**
 * @file Stores the Groq API key using Electron's `safeStorage`, which on
 * Windows encrypts with DPAPI tied to the logged-in user. This is
 * meaningfully stronger than electron-store's own "encryption" option
 * (that only obfuscates against casual file inspection, since the key it
 * uses ships inside the app). The encrypted blob is kept in its own file,
 * outside the main JSON settings file, so exporting/importing settings can
 * never leak the raw key.
 */

import { safeStorage } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * @param {string} userDataPath  app.getPath('userData')
 * @returns {string}
 */
function vaultPath(userDataPath) {
  return path.join(userDataPath, 'groq.key');
}

/**
 * Persists the Groq API key encrypted at rest.
 * @param {string} userDataPath
 * @param {string} apiKey
 * @returns {Promise<void>}
 */
export async function saveApiKey(userDataPath, apiKey) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Secure storage is unavailable on this system, so the API key cannot be saved safely.'
    );
  }
  const encrypted = safeStorage.encryptString(apiKey);
  await fs.writeFile(vaultPath(userDataPath), encrypted);
}

/**
 * Reads and decrypts the Groq API key, if one has been saved.
 * @param {string} userDataPath
 * @returns {Promise<string|null>}
 */
export async function readApiKey(userDataPath) {
  try {
    const encrypted = await fs.readFile(vaultPath(userDataPath));
    if (!safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(encrypted);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

/**
 * Removes the stored key entirely.
 * @param {string} userDataPath
 * @returns {Promise<void>}
 */
export async function clearApiKey(userDataPath) {
  try {
    await fs.unlink(vaultPath(userDataPath));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

/**
 * @param {string} userDataPath
 * @returns {Promise<boolean>}
 */
export async function hasApiKey(userDataPath) {
  try {
    await fs.access(vaultPath(userDataPath));
    return true;
  } catch {
    return false;
  }
}
