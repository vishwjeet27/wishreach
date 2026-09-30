/**
 * @file Multi-provider API key vault using Electron's `safeStorage`.
 * Encrypts API keys at rest with OS DPAPI (Windows) or Keychain (macOS).
 */

import { safeStorage } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * @param {string} userDataPath
 * @param {string} providerId
 * @returns {string}
 */
function vaultPath(userDataPath, providerId) {
  return path.join(userDataPath, `ai_${providerId}.key`);
}

/**
 * Legacy Groq key path for seamless backward compatibility.
 * @param {string} userDataPath
 * @returns {string}
 */
function legacyGroqPath(userDataPath) {
  return path.join(userDataPath, 'groq.key');
}

/**
 * @param {string} userDataPath
 * @param {string} providerId
 * @param {string} apiKey
 * @returns {Promise<void>}
 */
export async function saveProviderKey(userDataPath, providerId, apiKey) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is unavailable on this system. Cannot save API key safely.');
  }
  const encrypted = safeStorage.encryptString(apiKey);
  await fs.writeFile(vaultPath(userDataPath, providerId), encrypted);

  // If Groq, also keep legacy file up to date
  if (providerId === 'groq') {
    try {
      await fs.writeFile(legacyGroqPath(userDataPath), encrypted);
    } catch {}
  }
}

/**
 * @param {string} userDataPath
 * @param {string} providerId
 * @returns {Promise<string|null>}
 */
export async function readProviderKey(userDataPath, providerId) {
  try {
    const encrypted = await fs.readFile(vaultPath(userDataPath, providerId));
    if (!safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(encrypted);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Check legacy groq.key if provider is groq
      if (providerId === 'groq') {
        try {
          const legacyEncrypted = await fs.readFile(legacyGroqPath(userDataPath));
          if (!safeStorage.isEncryptionAvailable()) return null;
          return safeStorage.decryptString(legacyEncrypted);
        } catch {}
      }
      return null;
    }
    throw error;
  }
}

/**
 * @param {string} userDataPath
 * @param {string} providerId
 * @returns {Promise<void>}
 */
export async function clearProviderKey(userDataPath, providerId) {
  try {
    await fs.unlink(vaultPath(userDataPath, providerId));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (providerId === 'groq') {
    try {
      await fs.unlink(legacyGroqPath(userDataPath));
    } catch {}
  }
}

/**
 * Returns a map of which providers have saved keys: { groq: true, openai: false, ... }
 * @param {string} userDataPath
 * @param {string[]} providerIds
 * @returns {Promise<Record<string, boolean>>}
 */
export async function getSavedKeysMap(userDataPath, providerIds) {
  const result = {};
  for (const id of providerIds) {
    const key = await readProviderKey(userDataPath, id);
    result[id] = Boolean(key && key.trim());
  }
  return result;
}

/**
 * Clears all stored provider keys upon application reset.
 * @param {string} userDataPath
 * @returns {Promise<void>}
 */
export async function clearAllProviderKeys(userDataPath) {
  const knownProviders = ['groq', 'openai', 'gemini', 'anthropic', 'ollama'];
  for (const id of knownProviders) {
    try {
      await clearProviderKey(userDataPath, id);
    } catch {}
  }
}
