/**
 * WishReach - Personalized AI Cold Outreach Platform
 * Copyright (C) 2026 Vishwjeet Singh Vilkhu <https://github.com/vishwjeet-vilkhu>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * @file Renderer entry point, loaded as a module from index.html. Decides
 * between the onboarding wizard and the main shell, then hands control to
 * the router.
 */

import { h, clear, mount } from './dom.js';
import { api } from './api.js';
import { getAppState, setAppState, subscribe } from './state.js';
import { route, startRouter, notFound } from './router.js';
import { buildSidebar } from '../components/sidebar.js';
import { buildHeader } from '../components/header.js';
import { buildFooter } from '../components/footer.js';
import { renderOnboarding } from '../pages/onboarding.js';
import { renderDashboard } from '../pages/dashboard.js';
import { renderGenerator } from '../pages/generator.js';
import { renderTemplates } from '../pages/templates.js';
import { renderHistory } from '../pages/history.js';
import { renderLeads } from '../pages/leads.js';
import { renderSignatureStudio } from '../pages/signature.js';
import { renderSettings } from '../pages/settings.js';
import { renderTerms } from '../pages/terms.js';
import { renderPrivacy } from '../pages/privacy.js';

const root = document.getElementById('app');

/** Boots the app: fetch persisted settings, then branch. */
async function boot() {
  const settings = await api.settings.get();
  setAppState({ settings });
  document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

  if (!settings.onboarded) {
    renderOnboarding(root, async () => {
      const fresh = await api.settings.get();
      setAppState({ settings: fresh });
      document.documentElement.setAttribute('data-theme', fresh.theme || 'dark');
      startMainShell();
    });
    return;
  }

  startMainShell();
}

/** Builds the persistent shell (sidebar/topbar/footer) and starts the router. */
function startMainShell() {
  clear(root);

  const shell = h('div.shell');
  const main = h('div.main-column');
  const sidebarSlot = h('div', { style: 'display:contents' });
  const headerSlot = h('div', { style: 'display:contents' });
  const outlet = h('div', { id: 'router-outlet', style: 'min-height:0; display:flex; flex-direction:column;' });

  mount(sidebarSlot, buildSidebar());
  mount(headerSlot, buildHeader());
  main.append(headerSlot, outlet);
  shell.append(sidebarSlot, main, buildFooter());
  root.append(shell);

  // The sidebar shows the company logo/name and the header shows the
  // user's name — both read from settings, so rebuild them whenever
  // settings changes (e.g. after the Settings page saves).
  let lastSettings = getAppState().settings;
  subscribe((state) => {
    if (state.settings !== lastSettings) {
      lastSettings = state.settings;
      mount(sidebarSlot, buildSidebar());
      mount(headerSlot, buildHeader());
    }
  });

  route('/dashboard', (container) => renderDashboard(container));
  route('/generate', (container) => renderGenerator(container));
  route('/leads', (container) => renderLeads(container));
  route('/templates', (container) => renderTemplates(container));
  route('/signature', (container) => renderSignatureStudio(container));
  route('/history', (container, query) => renderHistory(container, query));
  route('/settings', (container) => renderSettings(container));
  route('/terms', (container) => renderTerms(container));
  route('/privacy', (container) => renderPrivacy(container));
  notFound((container) => renderDashboard(container));

  startRouter(outlet);
}

boot().catch((error) => {
  clear(root);
  root.append(
    h('div', { style: 'padding:40px; color:#f7f7f6; font-family:sans-serif' }, [
      h('h2', { text: 'WishReach failed to start' }),
      h('p', { text: error.message || String(error) }),
    ])
  );
});
