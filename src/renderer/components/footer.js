/**
 * @file Persistent footer. Always visible, minimal styling, exactly the
 * two labels specified in the brief.
 */

import { h } from '../js/dom.js';
import { navigate } from '../js/router.js';
import { openAboutModal } from './aboutModal.js';

/** @returns {HTMLElement} */
export function buildFooter() {
  return h('footer.app-footer', {}, [
    h('span.text-caption', { text: 'WishReach' }),
    h('div.row', { style: 'gap: var(--space-4); align-items: center;' }, [
      h('button.text-caption', {
        text: 'About & Credits',
        style: 'background: none; border: none; color: var(--text-3); cursor: pointer; text-decoration: underline;',
        on: { click: () => openAboutModal() },
      }),
      h('button.text-caption', {
        text: 'Terms of Service',
        style: 'background: none; border: none; color: var(--text-3); cursor: pointer;',
        on: { click: () => navigate('/terms') },
      }),
      h('button.text-caption', {
        text: 'Privacy Policy',
        style: 'background: none; border: none; color: var(--text-3); cursor: pointer;',
        on: { click: () => navigate('/privacy') },
      }),
      h('span.text-caption', { text: '© 2026 Vishwjeet Singh Vilkhu. GNU AGPL-3.0.' }),
    ]),
  ]);
}

