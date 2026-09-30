/**
 * @file Dashboard page: at-a-glance stats and recent activity.
 */

import { h } from '../js/dom.js';
import { iconMarkup } from '../components/icons.js';
import { api } from '../js/api.js';
import { getAppState, setAppState } from '../js/state.js';
import { navigate } from '../js/router.js';
import { button } from '../components/button.js';

/** @param {number|null} timestamp @returns {string} */
function relativeTime(timestamp) {
  if (!timestamp) return 'Not yet';
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statCard(icon, label, value) {
  return h('div.stat-card', {}, [
    h('div.icon-tile', { html: iconMarkup(icon, 16) }),
    h('div', {}, [
      h('div.stat-value', { text: String(value) }),
      h('div.stat-label', { text: label }),
    ]),
  ]);
}

/** @param {HTMLElement} container */
export async function renderDashboard(container) {
  const { settings } = getAppState();
  const stats = settings?.stats || {};
  const drafts = await api.drafts.list();
  setAppState({ drafts });

  const header = h('div.page-header', {}, [
    h('div.page-header-text', {}, [
      h('h1', { text: `Welcome back, ${settings?.user?.fullName?.split(' ')[0] || 'there'}` }),
      h('p', { text: 'Here is what your outreach pipeline looks like today.' }),
    ]),
    button({ label: 'New generation', icon: 'plus', variant: 'primary', onClick: () => navigate('/generate') }),
  ]);

  const cards = h('div.grid-cards', {}, [
    statCard('mail', 'Total Drafts', stats.totalDrafts || 0),
    statCard('inbox', 'Emails Generated', stats.emailsGenerated || 0),
    statCard('linkedin', 'LinkedIn Messages', stats.linkedinGenerated || 0),
    statCard('history', 'Last Generated', relativeTime(stats.lastGeneratedAt)),
  ]);

  const recent = drafts.slice(0, 8);
  const activityCard = h('div.card', {}, [
    h('div.card-pad.row-between', {}, [
      h('h3.text-title', { text: 'Recent activity' }),
      button({ label: 'View all', size: 'sm', onClick: () => navigate('/history') }),
    ]),
    h('hr.divider'),
    recent.length
      ? h('div.card-pad', { style: 'padding-top:0' }, [buildActivityTable(recent)])
      : h('div.card-pad', {}, [
          h('div.empty-state', {}, [
            h('div.icon', { html: iconMarkup('inbox', 28) }),
            h('p.text-muted', { text: 'Nothing generated yet. Start your first outreach set.' }),
            button({ label: 'Generate content', variant: 'primary', onClick: () => navigate('/generate') }),
          ]),
        ]),
  ]);

  container.append(h('div.page', {}, [h('div.page-inner', {}, [header, cards, activityCard])]));
}

function buildActivityTable(drafts) {
  const table = h('table.table', {}, [
    h('thead', {}, [
      h('tr', {}, [
        h('th', { text: 'Client' }),
        h('th', { text: 'Company' }),
        h('th', { text: 'Type' }),
        h('th', { text: 'Generated' }),
      ]),
    ]),
  ]);
  const tbody = h('tbody');
  for (const draft of drafts) {
    tbody.append(
      h('tr.table-row-clickable', { on: { click: () => navigate('/history') } }, [
        h('td', { text: draft.clientName }),
        h('td', { text: draft.clientCompany }),
        h('td', {}, [h('span.badge', { text: draft.type })]),
        h('td.text-dim', { text: relativeTime(draft.timestamp) }),
      ])
    );
  }
  table.append(tbody);
  return table;
}
