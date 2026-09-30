# Contributing to WishReach

Thank you for your interest in contributing to WishReach. WishReach is an enterprise-grade, offline-first B2B cold outreach platform built with Electron, Node.js, and vanilla web standards.

All contributions are subject to the **GNU Affero General Public License v3.0 (AGPL-3.0)** and must strictly adhere to the guidelines set forth in this document.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Original Authorship & Licensing](#original-authorship--licensing)
3. [Development Environment Setup](#development-environment-setup)
4. [Architecture & Coding Conventions](#architecture--coding-conventions)
5. [Testing & Quality Verification](#testing--quality-verification)
6. [Submitting Pull Requests](#submitting-pull-requests)
7. [Reporting Bugs & Feature Requests](#reporting-bugs--feature-requests)

---

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a professional, welcoming, and harassment-free community environment.

---

## Original Authorship & Licensing

WishReach was conceived and architected by **Vishwjeet Singh Vilkhu**.

1. **Licensing**: All contributions submitted to this repository will be licensed under the GNU Affero General Public License v3.0 (or at your option, any later version).
2. **Attribution Integrity**: Contributors must not remove or obscure existing copyright notices, the `NOTICE` file, or the built-in attribution interfaces. Any modifications must preserve credit to the original author pursuant to Section 7 of the AGPL-3.0.
3. **Developer Certificate of Origin (DCO)**: By submitting a pull request, you certify that you wrote the code or have the right to submit it under the AGPL-3.0.

---

## Development Environment Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Operating System**: Windows 10/11 (x64)

### Local Setup

1. Fork the repository on GitHub:
   ```
   https://github.com/vishwjeet-vilkhu/wishreach/fork
   ```

2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/wishreach.git
   cd wishreach
   ```

3. Install development dependencies:
   ```bash
   npm install
   ```

4. Launch the application in local development mode:
   ```bash
   npm run dev
   ```

---

## Architecture & Coding Conventions

WishReach is designed with strict performance, zero framework overhead, and enterprise security in mind. Please respect the following architectural decisions:

### Core Rules

1. **Vanilla ES Modules**: Do not introduce heavy frontend frameworks (React, Vue, Angular) or utility CSS frameworks (Tailwind) into the renderer. The UI relies entirely on vanilla ECMAScript modules and the lightweight DOM hyperscript helper (`src/renderer/js/dom.js`).
2. **Strict Security Model**:
   - `nodeIntegration: false` and `contextIsolation: true` must remain enforced in the main process.
   - All communication between Renderer and Main processes must flow exclusively through the audited `contextBridge` whitelist defined in `src/main/preload.cjs` and `src/shared/channels.js`.
   - Never expose raw Node.js APIs, file system handles, or `ipcRenderer` directly to renderer execution.
3. **Offline-First & Native Security**:
   - Never transmit user data, prompt history, or analytics to remote telemetry endpoints.
   - Sensitive credentials (such as AI API keys) must be protected using native OS DPAPI mechanisms (`src/main/security/keyVault.js`).
4. **Style Guidelines**:
   - Follow standard modern JavaScript practices (camelCase for variables and functions, PascalCase for classes and components).
   - Maintain comprehensive JSDoc comments for all exported functions and modules.
   - Do not include emojis or informal slang in source code comments, documentation, or commit messages.

---

## Testing & Quality Verification

Before submitting changes, ensure that your code passes all syntax checks:

```powershell
# Run the automated npm test script
npm test

# Verify all source modules recursively
Get-ChildItem -Path src -Recurse -Include *.js, *.cjs | ForEach-Object { node --check $_.FullName }
```

Ensure the Electron desktop window boots without console warnings or runtime uncaught exceptions.

---

## Submitting Pull Requests

1. **Branch Naming**: Use descriptive branch names:
   - `feature/prospect-enrichment`
   - `fix/signature-alignment`
   - `docs/setup-instructions`
2. **Atomic Commits**: Keep commits focused and well-documented. Use standard conventional commit formats:
   - `feat: add export to markdown option`
   - `fix: resolve race condition in token streaming`
   - `docs: clarify DPAPI storage requirements`
3. **Pull Request Template**: Complete all sections of the [Pull Request Template](.github/pull_request_template.md).
4. **Code Review**: Pull requests require review and approval from repository maintainers before merging.

---

## Reporting Bugs & Feature Requests

- **Bugs**: Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) and provide clear reproduction steps, environment details, and expected behavior.
- **Feature Requests**: Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) to outline the motivation, proposed solution, and alternative approaches.
- **Security Vulnerabilities**: Do **not** report security vulnerabilities via public issues. Refer to [SECURITY.md](SECURITY.md) for confidential disclosure instructions.
