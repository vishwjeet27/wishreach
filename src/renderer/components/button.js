/**
 * @file Small factory functions for the button variants used throughout
 * the app, so every page produces identical markup instead of hand-rolling
 * class lists.
 */

import { h } from '../js/dom.js';
import { iconMarkup } from './icons.js';

/**
 * @param {{ label: string, icon?: string, variant?: 'primary'|'outline'|'ghost'|'danger', size?: 'md'|'sm', block?: boolean, disabled?: boolean, onClick?: (e: MouseEvent) => void, type?: string }} options
 * @returns {HTMLButtonElement}
 */
export function button({
  label,
  icon,
  variant = 'outline',
  size = 'md',
  block = false,
  disabled = false,
  onClick,
  type = 'button',
}) {
  const variantClass = { primary: 'btn-primary', outline: 'btn-outline', ghost: 'btn-ghost', danger: 'btn-danger-outline' }[variant];
  const classes = ['btn', variantClass, size === 'sm' ? 'btn-sm' : '', block ? 'btn-block' : ''].filter(Boolean).join(' ');
  const el = h(`button.${classes.split(' ').join('.')}`, {
    type,
    disabled,
    on: onClick ? { click: onClick } : {},
  });
  if (icon) el.append(h('span', { html: iconMarkup(icon, size === 'sm' ? 15 : 16) }));
  el.append(h('span', { text: label }));
  return el;
}

/**
 * An icon-only square button, used in table rows and toolbars.
 * @param {{ icon: string, label: string, onClick?: (e: MouseEvent) => void, variant?: 'outline'|'ghost' }} options
 * @returns {HTMLButtonElement}
 */
export function iconButton({ icon, label, onClick, variant = 'ghost' }) {
  const variantClass = variant === 'ghost' ? 'btn-ghost' : 'btn-outline';
  return h(`button.btn.${variantClass}.btn-icon`, {
    type: 'button',
    title: label,
    'aria-label': label,
    html: iconMarkup(icon, 17),
    on: onClick ? { click: onClick } : {},
  });
}
