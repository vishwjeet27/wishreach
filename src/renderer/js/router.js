/**
 * @file Tiny hash router. No history API weirdness inside file:// (which
 * Electron loads the renderer from), no dependency — just
 * `location.hash` plus a route table.
 */

const routes = new Map();
let notFoundHandler = () => document.createTextNode('Not found.');
let currentPath = '';
const changeListeners = new Set();

/**
 * Registers a route.
 * @param {string} path  e.g. "/dashboard"
 * @param {(container: HTMLElement, query: URLSearchParams) => void} render
 */
export function route(path, render) {
  routes.set(path, render);
}

/** @param {(container: HTMLElement, query: URLSearchParams) => void} render */
export function notFound(render) {
  notFoundHandler = render;
}

/**
 * Parses `location.hash` into a { path, query } pair.
 * @returns {{ path: string, query: URLSearchParams }}
 */
function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/dashboard';
  const [path, queryString = ''] = raw.split('?');
  return { path: path || '/dashboard', query: new URLSearchParams(queryString) };
}

/**
 * Navigates to a path, optionally with query params.
 * @param {string} path
 * @param {Record<string,string>} [query]
 */
export function navigate(path, query) {
  const qs = query && Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : '';
  location.hash = `${path}${qs}`;
}

/** @returns {string} The current route path, without query string. */
export function currentRoute() {
  return currentPath;
}

/** @param {(path: string) => void} listener */
export function onRouteChange(listener) {
  changeListeners.add(listener);
}

let renderEpoch = 0;

/**
 * Starts the router: renders the current hash and listens for changes.
 *
 * Several page render functions are `async` (they await an IPC call
 * before appending anything). If the user navigates again before that
 * await resolves, the stale render must never reach the DOM — otherwise
 * two pages' content stack on top of each other. To guarantee that, each
 * render builds into a detached, off-DOM container first; only once the
 * handler has fully settled — and only if no newer navigation has started
 * since — are its nodes moved into the real outlet.
 * @param {HTMLElement} container
 */
export function startRouter(container) {
  async function render() {
    const { path, query } = parseHash();
    currentPath = path;
    const myEpoch = ++renderEpoch;
    const handler = routes.get(path) || notFoundHandler;

    const staging = document.createElement('div');
    staging.style.display = 'contents';
    try {
      await handler(staging, query);
    } catch (error) {
      console.error('Route render failed:', error);
    }

    if (myEpoch !== renderEpoch) return; // superseded by a later navigation

    container.innerHTML = '';
    container.append(...staging.childNodes);
    for (const listener of changeListeners) listener(path);
  }

  window.addEventListener('hashchange', () => { render(); });
  render();
}
