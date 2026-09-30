/**
 * @file Privacy Policy page for WishReach.
 */

import { h } from '../js/dom.js';

/** @param {HTMLElement} container */
export function renderPrivacy(container) {
  const page = h('div.page', {}, [
    h('div.page-inner', {}, [
      h('div.page-header', {}, [
        h('div.page-header-text', {}, [
          h('h1', { text: 'Privacy Policy' }),
          h('p', { text: 'How WishReach handles your data — locally and transparently.' }),
        ]),
      ]),

      h('div.legal-page.stack', { style: 'gap: var(--space-5);' }, [
        h('p.legal-effective', { text: 'Effective Date: October 1, 2026 · Last Updated: October 1, 2026' }),

        h('div.legal-section', {}, [
          h('h2', { text: '1. Overview' }),
          h('p', { text: 'WishReach is a privacy-first desktop application. All data you create and manage within the Application is stored locally on your device. We do not operate any servers that collect, store, or process your personal or business data.' }),
          h('p', { text: 'This Privacy Policy explains what information WishReach processes, how it is used, and your rights as a user.' }),

          h('h2', { text: '2. Information We Process' }),
          h('p', { text: 'WishReach processes the following types of data solely on your local machine:' }),
          h('ul', {}, [
            h('li', { text: 'Identity & Company Information: Your name, designation, company name, email address, phone number, and website URL — entered by you in Settings.' }),
            h('li', { text: 'Prospect / Lead Data: Names, companies, roles, email addresses, and notes you enter in the Leads CRM.' }),
            h('li', { text: 'Generated Content: AI-generated emails, subject lines, follow-ups, hooks, and campaign sequences stored in History.' }),
            h('li', { text: 'Signature Data: Information entered in the Email Signature Studio (name, title, contact details, social URLs).' }),
            h('li', { text: 'Templates: Custom outreach templates you create or save.' }),
            h('li', { text: 'AI Provider Configuration: Your AI provider preferences and model selections. API keys are stored in encrypted local storage.' }),
          ]),

          h('h2', { text: '3. How Your Data Is Used' }),
          h('p', { text: 'All data is used exclusively to:' }),
          h('ul', {}, [
            h('li', { text: 'Pre-fill AI prompts to generate personalized outreach content.' }),
            h('li', { text: 'Display in the WishReach dashboard, generator, history, and CRM views.' }),
            h('li', { text: 'Generate email signatures in the Signature Studio.' }),
            h('li', { text: 'Export data to PDF, CSV, or JSON files as requested by you.' }),
          ]),
          h('p', { text: 'Your data is never sold, rented, or shared with any third party by WishReach.' }),

          h('h2', { text: '4. Third-Party AI Providers' }),
          h('p', { text: 'To generate email content, WishReach sends portions of your input data (such as your company name, target industry, prospect details, and tone preferences) to the AI provider you select. This data is sent directly from your device to the provider\'s API endpoint.' }),
          h('p', { text: 'WishReach does not act as an intermediary and does not store these API requests on any server. However, you should review each provider\'s privacy policy to understand how they handle your data:' }),
          h('ul', {}, [
            h('li', { text: 'Groq: https://groq.com/privacy' }),
            h('li', { text: 'OpenAI: https://openai.com/privacy' }),
            h('li', { text: 'Google Gemini: https://policies.google.com/privacy' }),
            h('li', { text: 'Anthropic: https://www.anthropic.com/privacy' }),
            h('li', { text: 'Ollama: Local model, no data leaves your device.' }),
          ]),

          h('h2', { text: '5. API Key Storage' }),
          h('p', { text: 'Your API keys for third-party providers are stored locally using the operating system\'s secure storage mechanism (electron-store with encryption). Keys are never transmitted to WishReach or any server other than the corresponding AI provider\'s API endpoint.' }),

          h('h2', { text: '6. Data Security' }),
          h('p', { text: 'Since all data is stored locally on your device, the security of your data depends on the security of your operating system and device. We recommend:' }),
          h('ul', {}, [
            h('li', { text: 'Using a password-protected user account on your device.' }),
            h('li', { text: 'Keeping your operating system and WishReach updated.' }),
            h('li', { text: 'Not sharing your device or API keys with unauthorized users.' }),
          ]),

          h('h2', { text: '7. Data Deletion' }),
          h('p', { text: 'You can delete your data at any time through the WishReach interface or by uninstalling the Application. Uninstalling WishReach will remove all locally stored Application data.' }),
          h('p', { text: 'To delete specific items (leads, history, templates), use the delete controls available in each section of the Application.' }),

          h('h2', { text: '8. Children\'s Privacy' }),
          h('p', { text: 'WishReach is not intended for use by individuals under the age of 18. We do not knowingly process data from minors.' }),

          h('h2', { text: '9. Changes to This Policy' }),
          h('p', { text: 'We may update this Privacy Policy from time to time. Any changes will be indicated by an updated effective date within the Application. Continued use of WishReach after changes constitutes acceptance of the revised policy.' }),

          h('h2', { text: '10. Contact' }),
          h('p', { text: 'If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us through the Settings page or reach out to the WishReach development team.' }),
        ]),
      ]),
    ]),
  ]);

  container.append(page);
}
