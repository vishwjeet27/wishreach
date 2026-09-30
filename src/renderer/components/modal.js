/**
 * @file A single reusable modal: confirmation dialogs (delete drafts,
 * reset app) and small forms (save template) all go through this.
 */

import { h } from '../js/dom.js';
import { iconMarkup } from './icons.js';

/**
 * Opens a modal and returns a function to close it.
 * @param {{ title: string, body: Node|string, actions: Node[], size?: 'sm'|'md'|'lg' }} options
 * @returns {() => void} close
 */
export function openModal({ title, body, actions = [], size = 'md' }) {
  const backdrop = h('div.modal-backdrop');
  const modalClass = size === 'lg' ? 'div.modal.modal-lg' : 'div.modal';
  const modal = h(modalClass, {}, [
    h('div.modal-header', {}, [
      h('h3.text-heading', { text: title }),
      h('button.btn-icon.modal-close-btn', {
        html: iconMarkup('x', 16),
        title: 'Close',
        on: { click: () => close() },
      }),
    ]),
    typeof body === 'string' ? h('p.text-muted', { text: body }) : body,
    actions.length > 0 ? h('div.modal-actions', {}, actions) : null,
  ]);
  backdrop.append(modal);

  function close() {
    backdrop.remove();
    document.removeEventListener('keydown', onKeydown);
  }

  function onKeydown(event) {
    if (event.key === 'Escape') close();
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  document.addEventListener('keydown', onKeydown);
  document.body.append(backdrop);

  return close;
}

/**
 * Convenience wrapper for a yes/no confirmation modal.
 * @param {{ title: string, body: string, confirmLabel?: string, onConfirm: () => void }} options
 */
export function confirmModal({ title, body, confirmLabel = 'Confirm', onConfirm }) {
  let close;
  const cancelBtn = h('button.btn.btn-outline', { text: 'Cancel', on: { click: () => close() } });
  const confirmBtn = h('button.btn.btn-primary', {
    text: confirmLabel,
    on: {
      click: () => {
        close();
        onConfirm();
      },
    },
  });
  close = openModal({ title, body, actions: [cancelBtn, confirmBtn] });
}
