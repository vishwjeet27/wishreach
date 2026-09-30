/**
 * @file IPC handlers for AI Providers configuration and API keys management.
 */

import { ipcMain, app } from 'electron';
import { CHANNELS } from '../../shared/channels.js';
import { PROVIDERS, LANGUAGES, STRATEGY_VARIANTS, POLISH_ACTIONS } from '../ai/providers.js';
import { saveProviderKey, readProviderKey, clearProviderKey, getSavedKeysMap } from '../ai/keyVault.js';
import { testProviderConnection } from '../ai/client.js';
import { getState, updateState } from '../store/index.js';

export function registerAIProviderHandlers() {
  const userData = app.getPath('userData');

  ipcMain.handle(CHANNELS.AI_PROVIDERS_GET, async () => {
    const state = getState();
    const providerIds = Object.keys(PROVIDERS);
    const keysMap = await getSavedKeysMap(userData, providerIds);

    // If Groq has legacy key in groq.hasKey, ensure keysMap.groq reflects it
    if (state.groq?.hasKey && !keysMap.groq) {
      keysMap.groq = true;
    }

    return {
      ok: true,
      providers: PROVIDERS,
      languages: LANGUAGES,
      variants: STRATEGY_VARIANTS,
      polishActions: POLISH_ACTIONS,
      activeProvider: state.ai?.provider || 'groq',
      activeModel: state.ai?.model || state.groq?.model || 'openai/gpt-oss-120b',
      customBaseUrl: state.ai?.customBaseUrl || '',
      temperature: state.ai?.temperature ?? 0.7,
      defaultLanguage: state.ai?.defaultLanguage || 'English (US)',
      keys: keysMap,
    };
  });

  ipcMain.handle(CHANNELS.AI_PROVIDER_SAVE_KEY, async (_event, { providerId, key } = {}) => {
    if (!providerId || !PROVIDERS[providerId]) {
      return { ok: false, error: 'Invalid provider selected.' };
    }
    if (!key || !key.trim()) {
      return { ok: false, error: 'Key cannot be empty.' };
    }

    try {
      await saveProviderKey(userData, providerId, key.trim());

      const state = getState();
      const keys = { ...(state.ai?.keys || {}), [providerId]: true };
      const updatePayload = {
        ai: {
          ...(state.ai || {}),
          keys,
        },
      };

      if (providerId === 'groq') {
        updatePayload.groq = { ...(state.groq || {}), hasKey: true };
      }

      updateState(updatePayload);
      return { ok: true, providerId };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle(CHANNELS.AI_PROVIDER_CLEAR_KEY, async (_event, { providerId } = {}) => {
    if (!providerId) return { ok: false, error: 'No provider specified.' };

    try {
      await clearProviderKey(userData, providerId);
      const state = getState();
      const keys = { ...(state.ai?.keys || {}), [providerId]: false };
      const updatePayload = {
        ai: {
          ...(state.ai || {}),
          keys,
        },
      };

      if (providerId === 'groq') {
        updatePayload.groq = { ...(state.groq || {}), hasKey: false };
      }

      updateState(updatePayload);
      return { ok: true, providerId };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle(CHANNELS.AI_PROVIDER_TEST_KEY, async (_event, { providerId, apiKey, model, customBaseUrl } = {}) => {
    const provider = PROVIDERS[providerId];
    if (!provider) return { ok: false, error: 'Unknown provider.' };

    let keyToTest = apiKey;
    if (!keyToTest && provider.requiresKey) {
      keyToTest = await readProviderKey(userData, providerId);
    }

    if (provider.requiresKey && !keyToTest) {
      return { ok: false, error: `No API key saved for ${provider.name}. Enter one first.` };
    }

    try {
      await testProviderConnection({
        providerId,
        apiKey: keyToTest || '',
        model: model || provider.defaultModel,
        customBaseUrl,
      });
      return { ok: true, message: `Connected successfully to ${provider.name}!` };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}
