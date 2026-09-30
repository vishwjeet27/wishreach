# Architecture

## Process Boundaries

WishReach adheres strictly to Electron production security standards with a hardened two-process model: context isolation enabled, Node.js integration disabled in renderer, and sandbox active.

```
+------------------------------------+        +-------------------------------------+
|         Renderer Process           |        |            Main Process             |
|       (src/renderer)               |        |             (src/main)              |
|                                    |  IPC   |                                     |
|  index.html + app.js               |<======>|  main.js                            |
|  pages/, components/, css/         | invoke |  ipc/*Handlers.js                   |
|  js/api.js (window.wishreach)      |        |  store/ (electron-store)            |
|                                    |        |  ai/    (client, vault, providers)  |
|  - No Node.js access.              |        |  groq/  (prompt builder, fallback)  |
|  - No direct file/network I/O.     |        |                                     |
|  - Zero client-side framework.     |        |  - OS DPAPI secure credential vault |
|                                    |        |  - Network and File I/O             |
+------------------------------------+        +-------------------------------------+
                  ^
                  | contextBridge.exposeInMainWorld('wishreach', ...)
                  |
         src/main/preload.cjs
   (the only file that touches both worlds)
```

The renderer process never imports `electron`, never executes `require()`, and never receives raw API secrets. Every operating system interaction (reading persistent configurations, invoking generation pipelines, clipboard writes, native image file selection, PDF rendering) is exposed as a strongly-typed asynchronous method on `window.wishreach`.

---

## Data Flow: Generation & Multimodal Extraction

### 1. Full Sequence Generation (`ai:generate`)
1. The Generate view collects client parameters, target strategy angle, and chosen sender persona, invoking `api.ai.generate(client)`.
2. `preload.cjs` forwards the invocation to the main process via `ipcRenderer.invoke('ai:generate', client)`.
3. `generateHandlers.js` sanitizes and bounds the incoming parameters, reads the active provider credentials from `ai/keyVault.js`, and retrieves the active sender profile and company parameters from the persistent store.
4. `promptBuilder.js` compiles the structured system prompt and strategy guidelines.
5. `ai/client.js` dispatches an HTTP request with Server-Sent Events (`stream: true`) to the target inference gateway (Groq, OpenAI, Gemini, Claude, or Ollama).
6. As tokens arrive, `ai:stream-chunk` events are dispatched back across IPC to power live streaming feedback in the renderer.
7. The complete JSON payload is parsed, validated, and returned to the renderer.

### 2. Screenshot Intelligence (`ai:extract-image`)
1. User drops, uploads, or pastes (`Ctrl+V`) a screenshot into the drop zone.
2. The renderer converts the image file to a base64 buffer and submits it to `api.ai.extractFromImage({ imageBase64, mimeType })`.
3. `generateHandlers.js` selects an available vision provider (prioritizing the active provider or falling back to saved vision-capable keys).
4. `callAIVision` submits the image along with a structured extraction prompt.
5. The extracted JSON containing prospect name, company, title, industry, and requirements is returned and automatically populates the generation form.

---

## Persistence Architecture

- **State Tree (`electron-store`)**: Application configurations, saved draft sequences, user-defined templates, CRM prospect directory, and usage statistics are persisted in `src/main/store/index.js` with atomic writes.
- **Credential Storage (`safeStorage`)**: All provider API keys are stored in independent files encrypted via Windows Data Protection API (DPAPI) or macOS Keychain. Keys are excluded from JSON configuration exports.

---

## Security Specifications

1. **Isolation Architecture**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
2. **Content Security Policy**: Attached via `session.defaultSession.webRequest.onHeadersReceived` enforcing `default-src 'self'` and `img-src 'self' data:`.
3. **Outbound Navigation Defense**: External link requests are intercepted by `setWindowOpenHandler` and `will-navigate`, validated against a protocol whitelist (`https:`, `http:`, `mailto:`), and delegated to the native OS browser via `shell.openExternal`.
4. **Input Defense**: Every IPC listener performs server-side sanitization and bounds enforcement (`src/main/utils/validate.js`).
