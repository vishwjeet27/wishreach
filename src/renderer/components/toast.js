/**
 * @file Toast notifications. A single stack lives at the end of <body>;
 * pages call `showToast()` and never manage the DOM themselves.
 */

import { h } from '../js/dom.js';
import { iconMarkup } from './icons.js';

let stack;

function ensureStack() {
  if (!stack) {
    stack = h('div.toast-stack');
    document.body.append(stack);
  }
  return stack;
}

/**
 * Shows a toast for a few seconds.
 * @param {string} message
 * @param {{ tone?: 'default'|'error', duration?: number }} [options]
 */
export function showToast(message, options = {}) {
  const { duration = 3200, tone = 'default' } = options;
  const container = ensureStack();
  const icon = h('span', { html: iconMarkup(tone === 'error' ? 'x' : 'check', 16) });
  const toast = h('div.toast', {}, [icon, h('span', { text: message })]);
  container.append(toast);
  setTimeout(() => {
    toast.style.transition = `opacity ${180}ms ease, transform ${180}ms ease`;
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}
