/**
 * @file Interactive "About WishReach" modal displaying platform metadata,
 * original author attribution (Vishwjeet Singh Vilkhu), and GNU AGPL-3.0 licensing.
 */

import { h } from '../js/dom.js';
import { iconMarkup } from './icons.js';
import { openModal } from './modal.js';
import { button } from './button.js';

/**
 * Opens the About WishReach dialog.
 */
export function openAboutModal() {
  const content = h('div.stack', { style: 'gap: var(--space-4); text-align: center; align-items: center; padding: 12px 8px;' }, [
    h('img.brand-mark-img', {
      src: '../../assets/logo/wishreach-mark.png',
      alt: 'WishReach Logo',
      style: 'width: 56px; height: 56px; object-fit: contain; margin-bottom: 4px;',
    }),
    h('div.stack', { style: 'gap: 2px; align-items: center;' }, [
      h('h2.text-title', { text: 'WishReach', style: 'font-size: 20px; font-weight: 700; letter-spacing: -0.02em;' }),
      h('p.text-caption.text-dim', { text: 'Version 1.0.0 · Open-Source Desktop Platform' }),
    ]),
    h('div.card.card-pad', { style: 'width: 100%; text-align: left; background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px;' }, [
      h('div.stack', { style: 'gap: 8px;' }, [
        h('div.row-between', {}, [
          h('span.text-caption.text-dim', { text: 'Created & Architected by:' }),
          h('span.text-body-strong', { text: 'Vishwjeet Singh Vilkhu' }),
        ]),
        h('hr.divider'),
        h('div.row-between', {}, [
          h('span.text-caption.text-dim', { text: 'License Model:' }),
          h('span.badge', { text: 'GNU AGPL-3.0 (Copyleft)' }),
        ]),
        h('hr.divider'),
        h('div.row-between', {}, [
          h('span.text-caption.text-dim', { text: 'Architecture:' }),
          h('span.text-caption', { text: 'Offline-First · OS DPAPI Encrypted · Zero Telemetry' }),
        ]),
      ]),
    ]),
    h('p.text-caption', {
      style: 'color: var(--text-2); font-size: 11.5px; line-height: 1.5; max-width: 440px;',
      text: 'WishReach is free and open-source software. All redistribution, forks, and derived works must preserve the original author credit and NOTICE file as required by Section 7 of the GNU Affero General Public License.',
    }),
  ]);

  let closeModal;
  const githubBtn = button({
    label: 'GitHub Repository',
    icon: 'globe',
    size: 'sm',
    onClick: () => {
      window.open('https://github.com/vishwjeet27/wishreach', '_blank');
    },
  });

  const closeBtn = button({
    label: 'Close',
    variant: 'primary',
    size: 'sm',
    onClick: () => closeModal(),
  });

  closeModal = openModal({
    title: 'About WishReach',
    body: content,
    actions: [githubBtn, closeBtn],
    size: 'md',
  });
}
