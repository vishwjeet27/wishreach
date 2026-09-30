# Security Policy

WishReach is designed with high standards of data privacy and local security. The platform implements an offline-first architecture, sandboxed Electron execution, context isolation, strict Content Security Policy (CSP), and OS Data Protection API (DPAPI) hardware-backed key encryption.

We take all potential security vulnerabilities seriously and appreciate the efforts of the security research community to responsibly disclose findings.

---

## Supported Versions

Only the latest release of WishReach receives official security updates and patches.

| Version | Supported          |
| :------ | :----------------- |
| 1.0.x   | Yes                |
| < 1.0   | No                 |

---

## Reporting a Vulnerability

If you discover a security vulnerability within WishReach, please do **NOT** report it publicly through GitHub Issues, Discussions, or social media.

Instead, report vulnerabilities privately by emailing:

**`vishwjeet.vilkhu@gmail.com`**

Please include the following details in your report:

1. **Vulnerability Type**: Description of the vulnerability (e.g., IPC channel privilege escalation, CSP bypass, credential store exposure).
2. **Steps to Reproduce**: Detailed, step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
3. **Affected Environment**: Operating system version, Node.js/Electron version, and WishReach release tag.
4. **Potential Impact**: An assessment of the attack vector, severity, and potential threat to end-user data.

### Response Timeline

- **Acknowledgment**: You will receive an initial response acknowledging your report within 48 hours.
- **Triage & Assessment**: Maintainers will confirm the validity of the issue and discuss mitigation steps within 5 business days.
- **Resolution & Release**: A fix will be developed, tested, and shipped in a security patch release.
- **Public Disclosure**: Coordinated disclosure will occur only after a patched release is made available to users.

---

## Security Architecture Principles

Contributors and auditors should note our primary defense-in-depth measures:

1. **Zero Remote Telemetry**: The application never initiates outbound network connections except directly to user-configured AI inference gateways (Groq, OpenAI, Gemini, Claude, Ollama).
2. **Context Isolation & Sandbox**: Renderer processes operate under standard Electron sandboxing without direct access to Node.js APIs or file system primitives.
3. **OS DPAPI Credential Vault**: All API keys are encrypted at rest using Windows DPAPI (`CryptProtectData`), tying decryption keys strictly to the logged-in OS user profile.
