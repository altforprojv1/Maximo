/**
 * @file aiService.js
 * @description Unified AI service layer that routes requests to one of three
 * supported LLM providers: Anthropic Claude, OpenAI, or Google Gemini.
 *
 * Provides two public functions:
 * - solveFromImage(): sends a base64-encoded image to the configured AI for
 *   step-by-step math problem solving (used by the Scanner screen).
 * - solveFromText(): sends a text description to the AI (used by the Solver
 *   screen's "AI Solve" mode).
 *
 * Each provider has its own private helper function that handles the specific
 * API format (headers, body structure, response parsing). The public functions
 * read the current provider/key/model from apiConfig.js and delegate accordingly.
 *
 * @requires ./apiConfig
 *
 * @changelog
 * - Originally used a single hardcoded Anthropic API key
 * - Refactored to read config from apiConfig.js (AsyncStorage-backed)
 * - Added callOpenAI() and callGemini() for multi-provider support
 * - isApiKeySet() changed from sync to async (reads from AsyncStorage)
 * - System prompt standardized across all providers for consistent output format
 */

import { getConfig, PROVIDERS } from './apiConfig';

/**
 * @constant {string} MATH_SYSTEM
 * System prompt sent to all AI providers. Instructs the model to respond
 * in a structured PROBLEM → SOLUTION → ANSWER format for consistent
 * parsing and display in the MathRenderer component.
 */
const MATH_SYSTEM = `You are a calculus tutor. Solve problems step by step.
Format your response as:
PROBLEM: [the problem]
SOLUTION:
Step 1: [first step]
Step 2: [second step]
...
ANSWER: [final answer]
Use clear mathematical notation. Be thorough but concise.`;

/**
 * @constant {string} IMAGE_PROMPT
 * Prompt appended to image-based requests. Instructs the AI to first
 * transcribe the problem from the image, then solve it step-by-step.
 */
const IMAGE_PROMPT = `You are a calculus tutor. Look at this image of a math problem.
1. Identify and transcribe the mathematical expression or problem shown.
2. Solve it step by step.
3. Show each rule applied (differentiation, integration, etc).
Format as: PROBLEM: ... SOLUTION: Step 1: ... ANSWER: ...`;

/**
 * Sends a request to the Anthropic Claude Messages API.
 *
 * @async
 * @param {string} apiKey - Anthropic API key (sk-ant-...).
 * @param {string} model - Model identifier (e.g., 'claude-haiku-4-5-20251001').
 * @param {Array} messages - Array of message objects in Anthropic format.
 * @returns {Promise<string>} The text content of Claude's response.
 * @throws {Error} If the API returns an error object.
 */
async function callClaude(apiKey, model, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: 2048, system: MATH_SYSTEM, messages }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}

/**
 * Sends a request to the OpenAI Chat Completions API.
 *
 * @async
 * @param {string} apiKey - OpenAI API key (sk-proj-...).
 * @param {string} model - Model identifier (e.g., 'gpt-4o-mini').
 * @param {Array} messages - Array of message objects in OpenAI format.
 * @returns {Promise<string>} The assistant's response text.
 * @throws {Error} If the API returns an error object.
 */
async function callOpenAI(apiKey, model, messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, max_tokens: 2048, messages: [{ role: 'system', content: MATH_SYSTEM }, ...messages] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message?.message || data.error.message || 'OpenAI error');
  return data.choices[0].message.content;
}

/**
 * Sends a request to the Google Gemini generateContent API.
 *
 * @async
 * @param {string} apiKey - Google AI Studio API key (AIzaSy...).
 * @param {string} model - Model identifier (e.g., 'gemini-2.0-flash').
 * @param {Array} parts - Array of content parts (text and/or inline_data).
 * @returns {Promise<string>} The generated text response.
 * @throws {Error} If the API returns an error object.
 */
async function callGemini(apiKey, model, parts) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: MATH_SYSTEM }] },
      contents: [{ parts }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || 'No response';
}

/**
 * Sends a base64-encoded image to the configured AI provider for solving.
 * Used by the Scanner screen after capturing or selecting a photo.
 *
 * @async
 * @param {string} base64Image - Base64-encoded image data (no data URI prefix).
 * @param {string} [mimeType='image/jpeg'] - MIME type of the image.
 * @returns {Promise<{success: boolean, solution?: string, error?: string}>}
 */
export async function solveFromImage(base64Image, mimeType = 'image/jpeg') {
  try {
    const config = await getConfig();
    if (!config.apiKey) throw new Error('API key not set. Go to Settings tab.');
    const model = config.model || PROVIDERS[config.provider]?.defaultModel;
    let text;

    if (config.provider === 'claude') {
      text = await callClaude(config.apiKey, model, [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Image } },
          { type: 'text', text: IMAGE_PROMPT },
        ],
      }]);
    } else if (config.provider === 'openai') {
      text = await callOpenAI(config.apiKey, model, [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          { type: 'text', text: IMAGE_PROMPT },
        ],
      }]);
    } else if (config.provider === 'gemini') {
      text = await callGemini(config.apiKey, model, [
        { inline_data: { mime_type: mimeType, data: base64Image } },
        { text: IMAGE_PROMPT },
      ]);
    }

    return { success: true, solution: text };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to process image' };
  }
}

/**
 * Sends a text-based math problem to the configured AI provider.
 * Used by the Solver screen's "AI Solve" mode.
 *
 * @async
 * @param {string} problemText - Natural language or mathematical description.
 * @returns {Promise<{success: boolean, solution?: string, error?: string}>}
 */
export async function solveFromText(problemText) {
  try {
    const config = await getConfig();
    if (!config.apiKey) throw new Error('API key not set. Go to Settings tab.');
    const model = config.model || PROVIDERS[config.provider]?.defaultModel;
    let text;

    if (config.provider === 'claude') {
      text = await callClaude(config.apiKey, model, [{ role: 'user', content: problemText }]);
    } else if (config.provider === 'openai') {
      text = await callOpenAI(config.apiKey, model, [{ role: 'user', content: problemText }]);
    } else if (config.provider === 'gemini') {
      text = await callGemini(config.apiKey, model, [{ text: problemText }]);
    }

    return { success: true, solution: text };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to solve problem' };
  }
}

/**
 * Checks whether the user has configured an API key (at least 6 characters).
 * Used by Scanner and Solver screens to show/hide the API key warning.
 *
 * @async
 * @returns {Promise<boolean>}
 */
export async function isApiKeySet() {
  const config = await getConfig();
  return config.apiKey && config.apiKey.length > 5;
}
