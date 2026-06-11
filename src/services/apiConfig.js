/**
 * @file apiConfig.js
 * @description Manages persistent storage of the user's chosen AI provider,
 * API key, and model selection. Uses AsyncStorage for on-device persistence
 * so keys are never transmitted to any server other than the selected AI provider.
 *
 * Supports three providers: Anthropic Claude, OpenAI, and Google Gemini.
 * Each provider definition includes available models, default model, signup URL,
 * and estimated per-scan pricing for user reference.
 *
 * @requires @react-native-async-storage/async-storage
 *
 * @changelog
 * - Created to replace hardcoded API key in aiService.js
 * - Added PROVIDERS object with Claude, OpenAI, and Gemini definitions
 * - Added in-memory cache (cachedConfig) to avoid repeated AsyncStorage reads
 * - Added isConfigured() convenience function
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** @constant {string} Storage key used for AsyncStorage read/write operations. */
const STORAGE_KEY = 'calc_optimizer_api_config';

/**
 * @constant {Object} PROVIDERS
 * @description Registry of supported AI providers. Each entry defines:
 * - name: Display name shown in Settings UI
 * - url: API endpoint base URL
 * - placeholder: Hint text for the API key input field
 * - models: Array of available model identifiers
 * - defaultModel: Model selected by default for new configurations
 * - signupUrl: URL where users can create an account and generate a key
 * - pricing: Human-readable cost estimate shown in Settings UI
 */
const PROVIDERS = {
  claude: {
    name: 'Claude (Anthropic)',
    url: 'https://api.anthropic.com/v1/messages',
    placeholder: 'sk-ant-api03-...',
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-20250514'],
    defaultModel: 'claude-haiku-4-5-20251001',
    signupUrl: 'https://console.anthropic.com',
    pricing: '~$0.002/scan (Haiku), ~$0.01/scan (Sonnet)',
  },
  openai: {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    placeholder: 'sk-proj-...',
    models: ['gpt-4o-mini', 'gpt-4o'],
    defaultModel: 'gpt-4o-mini',
    signupUrl: 'https://platform.openai.com/api-keys',
    pricing: '~$0.002/scan (4o-mini), ~$0.01/scan (4o)',
  },
gemini: {
    name: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models',
    placeholder: 'AIzaSy...',
    models: ['gemini-3.5-flash', 'gemini-2.5-flash'], // Updated models
    defaultModel: 'gemini-3.5-flash',                 // Updated default
    signupUrl: 'https://aistudio.google.com/apikey',
    pricing: 'Free tier available, then ~$0.001/scan (Flash)',
  },
};

/**
 * In-memory cache of the current configuration. Avoids repeated async reads
 * from AsyncStorage during a single app session. Invalidated on saveConfig().
 * @type {Object|null}
 */
let cachedConfig = null;

/**
 * Retrieves the current API configuration. Returns cached value if available,
 * otherwise reads from AsyncStorage. Falls back to empty defaults if no
 * configuration has been saved yet.
 *
 * @async
 * @returns {Promise<{provider: string, apiKey: string, model: string}>}
 */
export async function getConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedConfig = JSON.parse(raw);
      return cachedConfig;
    }
  } catch (e) { /* AsyncStorage unavailable — use defaults */ }
  return { provider: 'claude', apiKey: '', model: '' };
}

/**
 * Persists the given provider, API key, and model to AsyncStorage.
 * Also updates the in-memory cache so subsequent getConfig() calls
 * return the new values immediately.
 *
 * @async
 * @param {string} provider - Provider key ('claude', 'openai', or 'gemini').
 * @param {string} apiKey - The user's API key string.
 * @param {string} model - Model identifier, or empty to use provider default.
 */
export async function saveConfig(provider, apiKey, model) {
  const config = { provider, apiKey, model: model || PROVIDERS[provider]?.defaultModel || '' };
  cachedConfig = config;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Checks whether a valid API key has been configured (at least 6 characters).
 *
 * @async
 * @returns {Promise<boolean>}
 */
export async function isConfigured() {
  const config = await getConfig();
  return config.apiKey && config.apiKey.length > 5;
}

export { PROVIDERS };
