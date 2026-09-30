/**
 * @file Minimal DOM-building helper. The brief forbids React/Vue/Angular,
 * so this small `h()` function stands in for JSX: it creates an element,
 * assigns attributes/props, and appends children, without a virtual DOM.
 */

/**
 * Creates a DOM element.
 * @param {string} tag  e.g. "div", "button.btn.btn-primary"
 * @param {Record<string, any>} [attrs]  Attributes, or special keys:
 *   `text` (textContent), `html` (innerHTML), `on` ({event: handler}).
 * @param {(Node|string|null|undefined)[]} [children]
 * @returns {HTMLElement}
 */
export function h(tag, attrs = {}, children = []) {
  const [tagName, ...classes] = tag.split('.');
  const el = document.createElement(tagName || 'div');
  if (classes.length) el.className = classes.join(' ');

  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'text') {
      el.textContent = value;
    } else if (key === 'html') {
      el.innerHTML = value;
    } else if (key === 'on') {
      for (const [evt, handler] of Object.entries(value)) {
        el.addEventListener(evt, handler);
      }
    } else if (key === 'class') {
      el.className = [el.className, value].filter(Boolean).join(' ');
    } else if (key in el && key !== 'list') {
      try {
        el[key] = value;
      } catch {
        el.setAttribute(key, value);
      }
    } else {
      el.setAttribute(key, value);
    }
  }

  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return el;
}

/** Removes all children of a node. @param {Node} node */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/**
 * Mounts a page-builder function's output into `container`, clearing it
 * first. Used by the router on every navigation.
 * @param {HTMLElement} container
 * @param {HTMLElement} content
 */
export function mount(container, content) {
  clear(container);
  container.append(content);
}
