# IPC API Reference

Every method below is available in the renderer at `window.wishreach.<namespace>.<method>`, wrapped for convenience in `src/renderer/js/api.js` as `api.<namespace>.<method>`. Write-style calls (`save`, `import`, etc.) resolve to `{ ok: true, ...data }` on success or `{ ok: false, error: string }` on failure; `api.js` unwraps this into a thrown `Error` on failure so callers can use plain `try/catch`.

## `app`

| Method | Description |
|---|---|
| `getVersion()` | Returns the app's version string from `package.json`. |

## `settings`

| Method | Description |
|---|---|
| `get()` | Returns the full persisted state (company, user, services, multi-sender personas, groq settings, ai settings, drafts, templates, stats, onboarded flag). Never includes raw API keys. |
| `save(partial)` | Deep-merges a partial update (e.g. `{ company: {...} }` or `{ senderProfiles: [...] }`). Validates every field server-side. |
| `reset()` | Wipes settings, drafts, and templates back to defaults, and clears all encrypted key vaults. |
| `export()` | Opens a native save dialog and writes company, user, services, personas, and model settings to a JSON file. |
| `import()` | Opens a native file dialog, validates the selected JSON schema, and applies it. |

## `groq`

| Method | Description |
|---|---|
| `listModels()` | Returns the curated list of Groq model IDs and display labels. |
| `saveKey(apiKey)` | Encrypts and persists the Groq API key via `safeStorage`. |
| `clearKey()` | Removes the stored Groq key. |
| `testKey()` | Sends a minimal request to Groq to confirm the saved key works. |

## `ai`

| Method | Description |
|---|---|
| `generate(client)` | Full generation: builds system + user prompt from active persona and client details, triggers token streaming via SSE, and returns structured content for all outreach channels. |
| `regenerate(client, fieldKey)` | Regenerates a single field (e.g., `coldEmail`, `followUp1`, `linkedinConnection`). |
| `polish({ text, instruction, language })` | Contextual rewriting and tone adjustment for any outreach text snippet. |
| `getProviders()` | Returns the dictionary of available AI provider configurations and key statuses. |
| `saveProviderKey(providerId, key)` | Encrypts and stores an API key for any supported provider (OpenAI, Gemini, Anthropic, Groq). |
| `clearProviderKey(providerId)` | Removes a specific provider's encrypted key. |
| `testProviderKey(payload)` | Dispatches a lightweight verification ping to confirm API key validity. |
| `extractFromImage({ imageBase64, mimeType })` | Submits a screenshot buffer to vision models to parse prospect name, company, title, industry, and requirements. |
| `onStreamChunk(callback)` | Registers listener for real-time streaming tokens. |
| `onStreamDone(callback)` | Registers listener for stream completion events. |

## `drafts`

| Method | Description |
|---|---|
| `list()` | Returns saved drafts, newest first. |
| `save(draft)` | Saves a draft: `{ clientName, clientCompany, type, content, goal, tone, allContent? }`. |
| `delete(id)` | Deletes a draft by id, returns the updated list. |
| `export()` | Opens a native save dialog and writes all drafts to a JSON file. |
| `exportCsv()` | Exports draft records to a standard UTF-8 BOM CSV spreadsheet. |
| `exportPdf(payload)` | Renders and writes an executive PDF dossier of the outreach sequence. |

## `leads`

| Method | Description |
|---|---|
| `list()` | Returns all saved prospects in the CRM directory. |
| `save(lead)` | Creates or updates a prospect record: `{ name, company, role, email, website, country, industry, status, requirements, notes }`. |
| `delete(id)` | Deletes a prospect from the CRM directory. |

## `templates`

| Method | Description |
|---|---|
| `list()` | Returns saved templates. |
| `save(template)` | Creates or updates a template: `{ id?, name, category, content }`. |
| `delete(id)` | Deletes a template by id, returns the updated list. |

## `system`

| Method | Description |
|---|---|
| `copyToClipboard(text)` | Writes text to the OS clipboard. |
| `pickLogoImage()` | Opens a native file picker restricted to PNG/JPG/SVG under 2MB, returns a base64 data URI. |
