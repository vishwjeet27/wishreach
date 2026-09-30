/**
 * @file Labeled form-field builders. Named textarea.js to match the
 * requested component layout, but also covers text inputs and selects
 * since all three share the same label/hint/error chrome.
 */

import { h } from '../js/dom.js';

/**
 * @param {{ label: string, value?: string, placeholder?: string, hint?: string, optional?: boolean, type?: string, maxLength?: number, onInput?: (value: string) => void }} options
 * @returns {{ el: HTMLElement, input: HTMLInputElement }}
 */
export function textField({ label, value = '', placeholder = '', hint, optional = false, type = 'text', maxLength, onInput }) {
  const input = h('input.input', { type, value, placeholder, maxLength });
  if (onInput) input.addEventListener('input', () => onInput(input.value));
  const el = h('div.field', {}, [
    h('label.field-label', {}, [label, optional ? h('span.optional', { text: '(optional)' }) : null]),
    input,
    hint ? h('span.field-hint', { text: hint }) : null,
  ]);
  return { el, input };
}

/**
 * @param {{ label: string, value?: string, placeholder?: string, hint?: string, rows?: number, showCount?: boolean, maxLength?: number, onInput?: (value: string) => void }} options
 * @returns {{ el: HTMLElement, textarea: HTMLTextAreaElement }}
 */
export function textareaField({ label, value = '', placeholder = '', hint, rows = 5, showCount = false, maxLength, onInput }) {
  const textarea = h('textarea.textarea', { placeholder, rows, maxLength, value });
  const countEl = showCount ? h('span.char-count', { text: `${value.length}${maxLength ? ` / ${maxLength}` : ''}` }) : null;

  textarea.addEventListener('input', () => {
    if (countEl) countEl.textContent = `${textarea.value.length}${maxLength ? ` / ${maxLength}` : ''}`;
    if (onInput) onInput(textarea.value);
  });

  const el = h('div.field', {}, [
    h('div.row-between', {}, [h('label.field-label', { text: label }), countEl]),
    textarea,
    hint ? h('span.field-hint', { text: hint }) : null,
  ]);
  return { el, textarea };
}

/**
 * @param {{ label: string, value?: string, options: {value: string, label: string}[], onChange?: (value: string) => void }} options
 * @returns {{ el: HTMLElement, select: HTMLSelectElement }}
 */
export function selectField({ label, value = '', options, onChange }) {
  const select = h('select.select', {});
  for (const opt of options) {
    select.append(h('option', { value: opt.value, text: opt.label, selected: opt.value === value }));
  }
  if (onChange) select.addEventListener('change', () => onChange(select.value));
  const el = h('div.field', {}, [h('label.field-label', { text: label }), select]);
  return { el, select };
}
