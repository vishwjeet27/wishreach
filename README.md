# WishReach

### Enterprise B2B Cold Outreach Automation & Intelligence Desktop Platform

[![Platform](https://img.shields.io/badge/Platform-Windows%20x64-0078D6?style=flat-square&logo=windows)](https://github.com)
[![Runtime](https://img.shields.io/badge/Runtime-Electron%2033.2.0-47848F?style=flat-square&logo=electron)](https://www.electronjs.org)
[![Language](https://img.shields.io/badge/Language-Vanilla%20JavaScript%20(ES%20Modules)-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org)
[![Inference Gateway](https://img.shields.io/badge/AI%20Gateway-Groq%20%7C%20OpenAI%20%7C%20Gemini%20%7C%20Claude%20%7C%20Ollama-black?style=flat-square)](https://groq.com)
[![Security](https://img.shields.io/badge/Security-OS%20DPAPI%20%7C%20Strict%20CSP%20%7C%20Sandboxed-success?style=flat-square)](https://www.electronjs.org/docs/latest/tutorial/security)
[![License: AGPL v3](https://img.shields.io/badge/License-GNU%20AGPLv3-blue.svg?style=flat-square)](LICENSE)
[![CI](https://github.com/vishwjeet27/wishreach/actions/workflows/ci.yml/badge.svg)](https://github.com/vishwjeet27/wishreach/actions/workflows/ci.yml)
[![CodeQL](https://github.com/vishwjeet27/wishreach/actions/workflows/codeql.yml/badge.svg)](https://github.com/vishwjeet27/wishreach/actions/workflows/codeql.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=flat-square)](CODE_OF_CONDUCT.md)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture & Process Model](#system-architecture--process-model)
3. [Core Feature Modules](#core-feature-modules)
   - [Multi-Provider AI Gateway & Engine](#1-multi-provider-ai-gateway--engine)
   - [Multimodal Screenshot Intelligence & OCR](#2-multimodal-screenshot-intelligence--ocr)
   - [Multi-Sender Personas & Profile Switcher](#3-multi-sender-personas--profile-switcher)
   - [Outreach Strategy Angles & Variant Matrix](#4-outreach-strategy-angles--variant-matrix)
   - [Enterprise Signature Studio](#5-enterprise-signature-studio)
   - [Prospect CRM & Pipeline Directory](#6-prospect-crm--pipeline-directory)
   - [Campaign History, Analytics & Multi-Format Export](#7-campaign-history-analytics--multi-format-export)
   - [In-App Attribution & Open Source Governance](#8-in-app-attribution--open-source-governance)
4. [Enterprise Security & Data Privacy](#enterprise-security--data-privacy)
5. [Technical Specifications](#technical-specifications)
6. [Prerequisites & Local Installation](#prerequisites--local-installation)
7. [Production Build & Packaging](#production-build--packaging)
8. [Directory Structure](#directory-structure)
9. [IPC Protocol Reference](#ipc-protocol-reference)
10. [Configuration Management](#configuration-management)
11. [Quality Assurance & Verification](#quality-assurance--verification)
12. [Original Author & Legal Attribution](#original-author--legal-attribution)
    - [Attribution Preservation Policy](#attribution-preservation-policy)
    - [Why GNU AGPL-3.0 Was Chosen (Anti-Theft Protection)](#why-gnu-agpl-30-was-chosen-anti-theft-protection)
    - [Downstream Distribution & Fork Requirements](#downstream-distribution--fork-requirements)
    - [In-App Interactive Legal Notices & Branding](#in-app-interactive-legal-notices--branding)
    - [Citation & Academic Reference](#citation--academic-reference)
13. [License & Copyleft Terms](#license--copyleft-terms)
14. [Contributing & Community Guidelines](#contributing--community-guidelines)

---

## Executive Summary

WishReach is an enterprise-grade desktop application engineered for business development representatives (BDRs), sales development teams (SDRs), enterprise founders, and digital agencies. The platform streamlines the creation of multi-touch, high-converting cold outreach campaigns across email and LinkedIn while maintaining consistent corporate voice, accurate value propositions, and personalized prospect context.

Operating on an offline-first architecture with native OS-level credential encryption, WishReach ensures that all proprietary sales playbooks, client records, and API credentials remain strictly confined to the host workstation. There are no external tracking servers, analytics engines, or third-party databases involved in the core workflow.

### Open-Source Architecture & Authorship Protection

WishReach is published as a free and open-source software project conceived, architected, and engineered by **Vishwjeet Singh Vilkhu**. To safeguard the original author's intellectual credit and prevent unauthorized closed-source commercial exploitation or attribution erasure, WishReach is distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** with legally binding author preservation requirements under Section 7.

- **Strict Copyleft Protection (GNU AGPL-3.0)**: Any downstream entity modifying, distributing, or running WishReach as a networked service must release all source code modifications under the same license. Closed-source SaaS wrapping and proprietary redistribution are strictly prohibited by law.
- **Section 7 Attribution Enforcement**: Pursuant to Section 7 of the AGPL-3.0, all forks, binary distributions, and source packages are legally mandated to retain original author credits pointing to Vishwjeet Singh Vilkhu.
- **In-App Interactive Legal Notices**: The platform embeds persistent attribution dialogs ("About WishReach" modal, Settings credit card, and application footer) ensuring that original authorship cannot be severed from runtime distributions.
- **Immutable Legal NOTICE File**: The repository includes a formal `NOTICE` file specifying redistribution rules that must accompany all future releases.


---

## System Architecture & Process Model

WishReach implements Electron's production process separation model with strict security defaults: context isolation enabled, Node.js integration disabled in renderer scripts, and sandbox enforcement.

### Process Boundaries & Communication Flow

```
+----------------------------------------------------------------------------------------------------+
|                                      RENDERER PROCESS (UI Layer)                                   |
|  Vanilla ES Modules + DOM Hyperscript Factory (Zero Framework Overhead)                            |
|                                                                                                    |
|  +--------------------+   +-----------------------+   +-------------------+   +-----------------+  |
|  | Generator & Vision |   | Leads CRM Directory   |   | Signature Studio  |   | Multi-Sender UI |  |
|  +--------------------+   +-----------------------+   +-------------------+   +-----------------+  |
|            |                         |                          |                      |           |
|            +-------------------------+--------------------------+----------------------+           |
|                                      |                                                             |
|                         [ src/renderer/js/api.js ]                                                 |
+--------------------------------------|-------------------------------------------------------------+
                                       | window.wishreach (ContextBridge Boundary)
                                       v
+----------------------------------------------------------------------------------------------------+
|                                    MAIN PROCESS (Node.js Runtime)                                  |
|                                                                                                    |
|   +--------------------------------------------------------------------------------------------+   |
|   | IPC Gateway (Input Validation, Text Sanitization, Bounds Enforcement)                      |   |
|   +--------------------------------------------------------------------------------------------+   |
|        |                          |                            |                      |            |
|        v                          v                            v                      v            |
|   +---------------+      +-------------------+        +----------------+     +-----------------+   |
|   | Secure Vault  |      | Unified AI Engine |        | System Export  |     | State Store     |   |
|   | (OS DPAPI)    |      | (Streaming & SSE) |        | (PDF / CSV)    |     | (electron-store)|   |
|   +---------------+      +-------------------+        +----------------+     +-----------------+   |
|                                   |                                                                |
|                                   v                                                                |
|             +----------------------------------------------+                                       |
|             | Multi-Model Inference Providers              |                                       |
|             | - Groq LPU (GPT-OSS 120B Recommended Default)|                                       |
|             | - OpenAI (GPT-4o, GPT-4o Mini, o3-mini)      |                                       |
|             | - Google Gemini (Gemini 2.0 Flash)           |                                       |
|             | - Anthropic Claude (Claude 3.5 Sonnet/Haiku) |                                       |
|             | - Ollama (Local Air-Gapped Daemon)           |                                       |
|             +----------------------------------------------+                                       |
+----------------------------------------------------------------------------------------------------+
```

### Architectural Principles

- **Zero-Framework Frontend**: Developed entirely in vanilla JavaScript (ES Modules), HTML5, and CSS variables. Eliminates runtime virtual DOM overhead, build-step lock-in, and frontend dependency vulnerabilities.
- **Isomorphic Shared Contracts**: Channel identifiers, schema validations, and content field definitions are centrally maintained in `src/shared/`, guaranteeing synchronization across process boundaries.
- **Strict Boundary Decoupling**: The renderer process possesses no capability to read the filesystem, access raw network sockets, or inspect decrypted API keys. All privileged operations require explicit verification through the IPC gateway.

---

## Core Feature Modules

### 1. Multi-Provider AI Gateway & Engine

WishReach incorporates an abstraction layer capable of routing requests across cloud providers and local air-gapped runtimes with real-time token streaming via Server-Sent Events (SSE):

- **Groq LPU Hardware Acceleration (Default Provider)**: Out-of-the-box support for `openai/gpt-oss-120b` (curated recommended default), offering near-instant token generation speeds for rapid sequence drafting. Additional models include `openai/gpt-oss-20b`, `openai/gpt-oss-safeguard-20b`, `moonshotai/kimi-k2-instruct`, and `qwen/qwen3.8-27b`.
- **Commercial Cloud Connectors**: Direct integrations with OpenAI (`gpt-4o`, `gpt-4o-mini`, `o3-mini`), Google Gemini (`gemini-2.0-flash`), and Anthropic Claude (`claude-3-5-haiku-20241022`, `claude-3-5-sonnet-20241022`).
- **Local & Air-Gapped Inference**: Seamless connection to local Ollama endpoints (e.g., `http://127.0.0.1:11434`), enabling zero-data-leakage generation for corporate environments subject to strict privacy compliance.
- **Reasoning Block Stripping**: Automatic extraction and cleansing of internal `<think>...</think>` reasoning tokens produced by advanced reasoning models before text is committed to the interface.
- **Localization & Tone Matrix**: Global outreach support across English (US), English (UK), German, French, Spanish, Hindi, and regional dialects, paired with calibrated tone profiles (Professional, Consultative, Direct, Friendly, Urgent, Challenger).

---

### 2. Multimodal Screenshot Intelligence & OCR

Manual copying and formatting of prospect information from web platforms is completely eliminated through multimodal image analysis:

```
[ Screenshot Drop / Paste ] ──> [ Base64 Buffer ] ──> [ Multimodal Vision Gateway ] ──> [ Structured Entity Extraction ]
       (Ctrl+V, Drag & Drop)                                (Qwen 3.8 / GPT-4o)             ├── Name & Title
                                                                                           ├── Company & Domain
                                                                                           ├── Vertical & Geography
                                                                                           └── Operational Context
```

- **Universal Input Capture**: Supports file browse selection, drag-and-drop, and global clipboard paste (`Ctrl+V`) anywhere within the workspace.
- **Automated Entity Recognition**: Vision models evaluate LinkedIn profile headers, LinkedIn post discussions, company updates, and job description (JD) postings.
- **Targeted JSON Extraction**: Accurately isolates recipient full name, organization entity, job title, corporate domain, industry classification, location, and operational pain points.
- **One-Click Form Ingestion**: Extracted data can be inspected, selectively adjusted, and instantly injected into the generation pipeline with a single action.

---

### 3. Multi-Sender Personas & Profile Switcher

Sales campaigns frequently require alternating between distinct sender profiles (e.g., Technical Founder for executive outreach, Enterprise BDR for initial prospecting, Strategic Partnerships Lead for channel development):

- **Header Profile Switcher**: Interactive control located in the top navigation bar displaying the active persona name, avatar, and title. Allows instant global persona switching across all pages.
- **Granular Persona Configuration**: Each persona maintains independent sender names, job titles, department assignments, custom email signatures, and assigned visual avatars.
- **Built-in 3D Platform Avatars**: Six pre-generated, high-resolution professional 3D platform avatars available for one-click selection, alongside custom image upload options and letter-initial fallbacks.
- **Dynamic Signature Association**: Campaigns automatically inherit the active persona's professional credentials, contact data, and custom signatures during generation.

---

### 4. Outreach Strategy Angles & Variant Matrix

Rather than producing generic, repetitive messages, WishReach compiles outreach campaigns across three distinct behavioral angles:

```
OUTREACH STRATEGY ANGLES
├── Variant A: Direct & Solution-Focused
│   └── Straightforward value proposition, immediate utility, concise call-to-action.
├── Variant B: Problem-Centric & ROI Demonstration
│   └── Highlights operational bottlenecks, revenue leakage, quantified return on investment.
└── Variant C: Industry Proof & Social Credibility
    └── Case studies, industry recognition, peer reference validation.
```

Each generated sequence encompasses eight coordinated communication touchpoints:
1. **Primary Cold Email**: Customized message structured for rapid executive scanning.
2. **Subject Line Matrix**: Four strategic variations (Benefit-Driven, Question-Based, Curiosity, Direct Reference).
3. **LinkedIn Connection Request**: Strictly constrained under 300 characters to comply with platform limitations.
4. **LinkedIn InMail / DM**: Conversational short-form message formatted for social engagement.
5. **Follow-up Email 1**: Contextual reminder introducing an additional perspective or asset.
6. **Follow-up Email 2**: Alternative angle addressing common operational objections.
7. **Break-up Email**: Graceful closing inquiry designed to prompt a final binary response.
8. **Meeting Invitation**: Calendar booking communication with concise scheduling links.

#### Real-Time Polishing & Regeneration
- **Single-Field Regeneration**: Reruns inference on individual sequence elements without modifying the remainder of the campaign.
- **One-Click Polish Strip**: Contextual refinement actions including *Make it more conversational*, *Shorten by 30%*, *Strengthen CTA*, *Add urgency*, *More professional*, and *Fix grammar*.

---

### 5. Enterprise Signature Studio

WishReach incorporates an email signature builder that compiles table-based, client-safe HTML compatible with Microsoft Outlook, Google Workspace (Gmail), Apple Mail, and mobile clients:

- **Four Structural Layouts**:
  - *Executive Dual-Column*: Left-aligned circular/square avatar or logo paired with a vertical accent divider and contact details.
  - *Minimalist Left-Border*: Clean typographical layout with a solid vertical colored rule.
  - *Compact Linear*: Horizontal, space-efficient single-cell block for high-volume follow-up communications.
  - *Brand Card*: Prominent corporate identity display with shaded contact details and social media anchors.
- **Live Recipient Mockup**: Real-time rendering inside a simulated inbox interface with instant Light Mode and Dark Mode preview toggles.
- **Dual Export Protocol**:
  - *Rich-Text Clipboard Transfer*: Injects formatted HTML tables via the `ClipboardItem` API directly into system memory, allowing users to paste into Gmail or Outlook settings with styling preserved.
  - *Raw HTML Export*: Generates verified source code for deployment in corporate email automation platforms.
- **HTML Sanitization**: All user-defined names, job titles, domains, and disclaimers are sanitized through HTML character escaping to prevent layout corruption or markup injection.

---

### 6. Prospect CRM & Pipeline Directory

A local prospect repository designed for organizing outreach targets without external CRM subscription overhead:

- **Pipeline Stages**: Tracks targets through structured lifecycle statuses (`New`, `Contacted`, `Meeting Scheduled`, `Disqualified`).
- **Comprehensive Prospect Profiles**: Maintains records of contact names, corporate entities, direct email addresses, websites, geographic locations, market sectors, and client requirements.
- **Direct Workbench Transfer**: Select any saved prospect from the CRM directory to automatically populate all parameters in the Generator view.

---

### 7. Campaign History, Analytics & Multi-Format Export

- **Persistent Searchable Archive**: Every generated campaign piece can be saved to history, featuring instant text filtering across client names, companies, and content keywords.
- **CSV Data Pipeline**: Exports saved campaign records to standard comma-separated values formatted with a UTF-8 Byte Order Mark (BOM) for proper column detection in Microsoft Excel.
- **Executive PDF Generation**: Headless printing engine creates formatted executive PDF dossiers detailing prospect metadata, strategy angles, and all outreach components.

---

### 8. In-App Attribution & Open Source Governance

To safeguard the intellectual credit of the original author (**Vishwjeet Singh Vilkhu**) across all runtime environments, WishReach incorporates a persistent legal attribution layer built directly into the client application:

- **Interactive "About WishReach" Modal**: Accessible via the persistent footer, this modal displays official application metadata, version information, author credentials ("Created & Architected by Vishwjeet Singh Vilkhu"), copyleft licensing terms (GNU AGPL-3.0), and direct links to the canonical GitHub repository.
- **Settings Legal Attribution Card**: An enterprise information card embedded within the primary settings workbench outlining the open-source governance model and licensing conditions.
- **Persistent Application Footer**: Displays copyright notices and legal navigation links across every screen of the application interface.
- **AGPL Section 7 Compliance**: These interactive attribution elements satisfy the "Appropriate Legal Notices" requirement under Section 7(c) of the GNU Affero General Public License, preventing downstream distributors from stripping the author's identity during white-labeling or redistribution attempts.

---

## Enterprise Security & Data Privacy

WishReach is designed to comply with corporate security policies:

| Security Vector | Implementation Specification |
|---|---|
| **Process Isolation** | `BrowserWindow` runs with `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`. |
| **Credential Encryption** | Provider API keys are encrypted at rest using Electron's `safeStorage` API, leveraging Windows Data Protection API (DPAPI) or macOS Keychain. Keys are never stored in plaintext JSON. |
| **Content Security Policy** | Enforces a strict HTTP response header: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'`. |
| **External Navigation Defense** | Outbound link requests are intercepted by `setWindowOpenHandler` and `will-navigate`, validated against a strict protocol whitelist (`https:`, `http:`, `mailto:`), and delegated to the native OS browser. Dangerous schemes (e.g., `file://`, `javascript:`, shell URI handlers) are rejected. |
| **Server-Side IPC Validation** | All arguments passed from renderer to main are re-validated and sanitized (`src/main/utils/validate.js`) against bounds and type constraints. |
| **Zero Telemetry** | No usage tracking, diagnostic beacons, analytics scripts, or crash report pings are embedded. All data remains local. |

---

## Technical Specifications

- **Runtime Shell**: Electron 33.2.0
- **JavaScript Engine**: Node.js 18+ (Pure ES Modules / CommonJS Preload Boundary)
- **UI Architecture**: Vanilla HTML5, CSS3 Custom Properties, Hyperscript DOM Factory
- **Persistence Engine**: `electron-store` (Atomic JSON writes on local disk)
- **Encryption Interface**: Windows DPAPI via Electron `safeStorage`
- **Typography**: Locally bundled Inter variable font family
- **Graphics**: Hand-crafted SVG path symbols (zero external icon webfonts)

---

## Prerequisites & Local Installation

### System Requirements
- Operating System: Windows 10 / 11 (64-bit)
- Runtime: Node.js 18.0.0 or higher
- Package Manager: npm 9.0.0 or higher

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vishwjeet27/wishreach.git
   cd wishreach/wishreach
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional)**:
   ```bash
   cp .env.example .env
   ```
   *Note: Environment variables serve as optional development defaults. All credentials can be securely configured directly within the application Settings view.*

4. **Launch Application in Development Mode**:
   ```bash
   npm run dev
   ```

---

## Production Build & Packaging

### 1. Unpacked Directory Build
Compiles application binaries and bundles all resources into the `dist/win-unpacked/` directory for local testing:
```bash
npm run build
```

### 2. Standalone Windows Installer (NSIS)
Produces an optimized, standalone NSIS installation package (`.exe`) within `dist/`:
```bash
npm run dist
```
The resulting installer supports custom directory selection, automated desktop shortcut generation, and clean uninstallation routines.

---

## Directory Structure

```
wishreach/
├── assets/                          Static visual resources
│   ├── avatars/                     Pre-generated 3D platform persona avatars
│   ├── fonts/                       Locally bundled Inter typeface assets
│   ├── icons/                       Application branding icons
│   └── logo/                        WishReach vector marks
├── docs/                            Technical architecture and API specifications
│   ├── api.md                       Comprehensive IPC interface documentation
│   └── architecture.md              Process boundaries and security specifications
├── prompts/                         Engine prompt templates loaded at runtime
│   ├── cold_email.txt               Full sequence compilation template
│   ├── followup.txt                 Follow-up sequence instruction template
│   ├── linkedin.txt                 LinkedIn short-form outreach template
│   ├── polish.txt                   Copy rewriting and tone adjustment instructions
│   └── system_prompt.txt            Core enterprise persona and guardrails
├── src/
│   ├── main/                        Main process orchestration (Node.js)
│   │   ├── ai/                      Multi-provider AI gateway and DPAPI vault
│   │   ├── groq/                    Groq API integration and prompt compiler
│   │   ├── ipc/                     Domain-specific IPC listeners
│   │   ├── store/                   State management schema and storage wrapper
│   │   ├── utils/                   Validation, sanitization, and helpers
│   │   ├── main.js                  Application lifecycle and security policies
│   │   └── preload.cjs              ContextBridge interface definition
│   ├── renderer/                    Renderer process (UI layer)
│   │   ├── components/              Reusable DOM components (header, avatar, modal, etc.)
│   │   ├── css/                     CSS architecture (base, layout, components, tokens)
│   │   ├── js/                      Router, global state store, DOM helpers, API client
│   │   ├── pages/                   Application views (generator, signature, CRM, settings)
│   │   └── index.html               Single entry HTML shell
│   └── shared/                      Isomorphic shared constants and channel schemas
├── .env.example                     Sample environment variable configuration
├── .gitignore                       Git repository exclusion rules
├── package.json                     Application manifest and dependencies
└── README.md                        System documentation
```

---

## IPC Protocol Reference

All renderer operations route through `window.wishreach.<namespace>.<method>`. Key operational channels include:

| Domain | Method | Operational Description |
|---|---|---|
| `app` | `getVersion()` | Returns current application version from package manifest. |
| `settings` | `get()` | Retrieves application state (excluding encrypted secret keys). |
| `settings` | `save(partial)` | Validates and deep-merges partial updates to settings. |
| `settings` | `reset()` | Wipes state tree and purges all encrypted credential vaults. |
| `settings` | `export()` | Saves portable JSON configuration file. |
| `settings` | `import()` | Validates and restores configuration from JSON file. |
| `ai` | `generate(client)` | Compiles full sequence and initiates token streaming. |
| `ai` | `regenerate(client, fieldKey)` | Generates replacement content for a single outreach field. |
| `ai` | `polish(payload)` | Rewrites target text snippet according to specified instruction. |
| `ai` | `extractFromImage(payload)` | Analyzes screenshot buffer and extracts prospect intelligence. |
| `ai` | `getProviders()` | Retrieves active status and model lists for all AI providers. |
| `ai` | `saveProviderKey(providerId, key)` | Encrypts and persists credentials in OS DPAPI vault. |
| `drafts` | `list()` | Returns chronologically ordered outreach history. |
| `drafts` | `save(draft)` | Commits outreach sequence to persistent archive. |
| `drafts` | `delete(id)` | Removes specific draft from archive. |
| `drafts` | `exportCsv()` | Generates UTF-8 BOM CSV spreadsheet file. |
| `drafts` | `exportPdf(payload)` | Renders and saves executive PDF campaign dossier. |
| `leads` | `list()` | Returns all prospect records in CRM directory. |
| `leads` | `save(lead)` | Creates or updates prospect entity in CRM directory. |
| `leads` | `delete(id)` | Removes prospect entity from CRM directory. |
| `templates`| `list()` | Retrieves saved reusable outreach templates. |
| `templates`| `save(template)` | Creates or updates template grouped by vertical category. |
| `system` | `copyToClipboard(text)` | Writes plain text or formatted data to system clipboard. |
| `system` | `pickLogoImage()` | Opens native dialog for PNG/JPG/SVG selection under 2MB. |

---

## Configuration Management

WishReach persists its configuration within the standard user data directory:
`%APPDATA%\WishReach` (on Windows systems).

- **`config.json`**: Primary state tree containing company parameters, user identity, sender personas, template libraries, lead CRM records, and campaign history.
- **`ai_*.key` / `groq.key`**: Encrypted binary payloads protected by DPAPI. These files cannot be decrypted on another machine or user account.

---

## Quality Assurance & Verification

The codebase maintains strict syntactic correctness and type discipline. Syntax verification across all JavaScript and CommonJS modules can be executed using the Node.js compilation check:

```powershell
Get-ChildItem -Path src -Recurse -Include *.js, *.cjs | ForEach-Object { node --check $_.FullName }
```

---

## Original Author & Legal Attribution

WishReach was conceived, architected, and engineered by **Vishwjeet Singh Vilkhu**.

- **Author**: Vishwjeet Singh Vilkhu
- **GitHub Profile**: [github.com/vishwjeet-vilkhu](https://github.com/vishwjeet-vilkhu)
- **Repository**: [github.com/vishwjeet27/wishreach](https://github.com/vishwjeet27/wishreach)

### Attribution Preservation Policy

WishReach is published as free and open-source software under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. 

To safeguard the author's moral rights, reputational credit, and engineering efforts against unauthorized attribution erasure, WishReach enforces the additional terms permitted under **Section 7(b) and Section 7(c)** of the GNU Affero General Public License.

### Why GNU AGPL-3.0 Was Chosen (Anti-Theft Protection)

Unlike permissive licenses (such as MIT, BSD, or Apache 2.0) that permit third parties to package open-source software into proprietary closed-source applications or hosted cloud SaaS services without sharing improvements or maintaining visible author attribution:

1. **Closure of the Network / SaaS Loophole**: Section 13 of the AGPL-3.0 explicitly mandates that anyone running a modified version of WishReach over a network or exposing its functionality to remote users must make the complete corresponding source code available under the same AGPL-3.0 terms.
2. **Strict Copyleft Reciprocity**: No third party may re-license or incorporate WishReach into proprietary closed-source commercial offerings. Any derived work must remain 100% open-source under AGPL-3.0.
3. **Protection Against Credit Severance**: Section 7 legally shields the author against unauthorized rebranding, white-labeling, or omission of original authorship notices.

### Downstream Distribution & Fork Requirements

Pursuant to Section 7 of the GNU Affero General Public License, the following requirements are legally binding upon all individuals, corporations, and organizations redistributing, modifying, or creating derivative works based on WishReach:

1. **Preservation of Copyright Headers**: Every source code file (`.js`, `.cjs`, `.html`, `.css`) must retain the original copyright notice explicitly naming Vishwjeet Singh Vilkhu and pointing to the official repository.
2. **Preservation of the NOTICE Document**: The accompanying `NOTICE` file must be included in all source trees and binary distributions without modification or omission.
3. **Preservation of Interactive Legal Notices**: Any modified version containing a graphical or terminal user interface must prominently display the original author attribution and license details via an accessible "About" modal or command.
4. **Transparent Change Documentation**: All modifications, additions, and deletions made to the codebase must carry prominent notices stating that the files have been changed, alongside the date and description of each change.

### In-App Interactive Legal Notices & Branding

The built-in interactive attribution interface (including the "About WishReach" modal, the Settings page attribution card, and the persistent footer notice) constitutes an "Appropriate Legal Notice" as defined under the AGPL-3.0:

- Downstream forks and redistributed binaries **must not suppress, hide, or alter** the author attribution text: `"Created & Architected by Vishwjeet Singh Vilkhu"`.
- If an entity creates a customized or extended fork, they may append their own contributor credit, but they **must retain** the original creator notice in a clearly visible, non-obscured position.

### Citation & Academic Reference

If you reference or use WishReach in academic studies, industry whitepapers, or software architecture analyses, please cite the project using the metadata specified in [CITATION.cff](CITATION.cff):

```bibtex
@software{Vilkhu_WishReach_2026,
  author = {Vilkhu, Vishwjeet Singh},
  title = {{WishReach: Enterprise AI Cold Outreach Desktop Platform}},
  year = {2026},
  url = {https://github.com/vishwjeet27/wishreach},
  license = {AGPL-3.0-or-later}
}
```

---


## License & Copyleft Terms

WishReach is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

```
WishReach - Personalized AI Cold Outreach Platform
Copyright (C) 2026 Vishwjeet Singh Vilkhu <https://github.com/vishwjeet-vilkhu>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
```

For complete license terms, refer to the [LICENSE](LICENSE) and [NOTICE](NOTICE) files.

---

## Contributing & Community Guidelines

Contributions to WishReach are welcomed. Please review the following community documents before submitting pull requests or issues:

- [Contributing Guide](CONTRIBUTING.md) — Coding conventions, testing protocols, and PR lifecycle.
- [Code of Conduct](CODE_OF_CONDUCT.md) — Contributor standards and enforcement guidelines.
- [Security Policy](SECURITY.md) — Vulnerability reporting and responsible disclosure.

