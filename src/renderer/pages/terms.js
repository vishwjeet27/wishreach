/**
 * @file Terms of Service page for WishReach.
 */

import { h } from '../js/dom.js';

/** @param {HTMLElement} container */
export function renderTerms(container) {
  const page = h('div.page', {}, [
    h('div.page-inner', {}, [
      h('div.page-header', {}, [
        h('div.page-header-text', {}, [
          h('h1', { text: 'Terms of Service' }),
          h('p', { text: 'Please read these terms carefully before using WishReach.' }),
        ]),
      ]),

      h('div.legal-page.stack', { style: 'gap: var(--space-5);' }, [
        h('p.legal-effective', { text: 'Effective Date: October 1, 2026 · Last Updated: October 1, 2026' }),

        h('div.legal-section', {}, [
          h('h2', { text: '1. Acceptance of Terms' }),
          h('p', { text: 'By accessing or using WishReach ("the Application"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Application.' }),
          h('p', { text: 'WishReach is a desktop application that helps you craft personalized outreach campaigns using AI-powered email generation. These Terms govern your use of the Application and all services provided through it.' }),

          h('h2', { text: '2. Description of Service' }),
          h('p', { text: 'WishReach provides the following services:' }),
          h('ul', {}, [
            h('li', { text: 'AI-powered email generation using third-party API providers (Groq, OpenAI, Google Gemini, Anthropic Claude, Ollama).' }),
            h('li', { text: 'Email signature studio for creating HTML-formatted email signatures.' }),
            h('li', { text: 'Outreach campaign management, template creation, and prospect tracking (CRM).' }),
            h('li', { text: 'Local data storage for all generated content, drafts, and settings.' }),
          ]),

          h('h2', { text: '3. User Responsibilities' }),
          h('p', { text: 'By using WishReach, you agree to:' }),
          h('ul', {}, [
            h('li', { text: 'Use the Application only for lawful purposes and in compliance with applicable laws, including anti-spam regulations (CAN-SPAM Act, GDPR, CASL, etc.).' }),
            h('li', { text: 'Obtain proper consent before sending outreach emails to any recipient.' }),
            h('li', { text: 'Not use the Application to send unsolicited bulk emails, phishing messages, or any deceptive communications.' }),
            h('li', { text: 'Maintain the confidentiality of your API keys and not share them with unauthorized individuals.' }),
            h('li', { text: "Ensure any content generated through the Application is reviewed before sending and complies with the recipient's expectations and applicable laws." }),
          ]),

          h('h2', { text: '4. API Keys and Third-Party Services' }),
          h('p', { text: 'WishReach requires API keys from third-party AI providers to function. These keys are stored locally on your device and are never transmitted to WishReach servers.' }),
          h('p', { text: "By using third-party AI services, you are also subject to those providers' terms of service. WishReach is not responsible for any charges, interruptions, or data usage incurred through these third-party APIs." }),

          h('h2', { text: '5. Intellectual Property' }),
          h('p', { text: 'WishReach and its original content, features, and functionality are owned by its developers and are protected by intellectual property laws. The AI-generated content produced by the Application belongs to you, the user, subject to the terms of the AI provider used.' }),
          h('p', { text: 'You retain full ownership of any company data, contact information, templates, and campaign content you create within the Application.' }),

          h('h2', { text: '6. Data Storage and Privacy' }),
          h('p', { text: 'All data generated within WishReach (including settings, drafts, templates, leads, and signatures) is stored locally on your device. WishReach does not collect, transmit, or store your personal data or business data on remote servers.' }),
          h('p', { text: 'For full details on how we handle your data, please review our Privacy Policy.' }),

          h('h2', { text: '7. Disclaimer of Warranties' }),
          h('p', { text: 'WishReach is provided "as is" without any warranties, express or implied. We do not warrant that the Application will be error-free, uninterrupted, or that the AI-generated content will be accurate, appropriate, or meet your specific requirements.' }),

          h('h2', { text: '8. Limitation of Liability' }),
          h('p', { text: 'To the maximum extent permitted by applicable law, WishReach and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Application.' }),

          h('h2', { text: '9. Modifications to Terms' }),
          h('p', { text: 'We reserve the right to modify these Terms at any time. Changes will be reflected in the Application with an updated effective date. Continued use of the Application after any changes constitutes your acceptance of the new Terms.' }),

          h('h2', { text: '10. Governing Law' }),
          h('p', { text: 'These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.' }),

          h('h2', { text: '11. Contact' }),
          h('p', { text: 'If you have any questions about these Terms, please contact us through the Settings page or reach out to the development team.' }),
        ]),
      ]),
    ]),
  ]);

  container.append(page);
}
