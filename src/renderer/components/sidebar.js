/**
 * @file Left sidebar: brand mark, primary navigation, and the current
 * user's identity pulled from the company profile.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from './icons.js';
import { navigate, currentRoute, onRouteChange } from '../js/router.js';
import { getAppState, subscribe } from '../js/state.js';
import { avatarEl } from './avatar.js';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/generate', label: 'Generate', icon: 'mail' },
  { path: '/leads', label: 'Leads CRM', icon: 'users' },
  { path: '/templates', label: 'Templates', icon: 'template' },
  { path: '/signature', label: 'Signatures', icon: 'pen' },
  { path: '/history', label: 'History', icon: 'history' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

/**
 * Builds the sidebar element and keeps its active state in sync with the
 * router.
 * @returns {HTMLElement}
 */
export function buildSidebar() {
  const nav = h('nav.nav');
  const itemEls = new Map();

  for (const item of NAV_ITEMS) {
    const el = h(`a.nav-item`, {
      href: `#${item.path}`,
      html: `${iconMarkup(item.icon, 18)}<span>${item.label}</span>`,
      on: {
        click: (event) => {
          event.preventDefault();
          navigate(item.path);
        },
      },
    });
    itemEls.set(item.path, el);
    nav.append(el);
  }

  function syncActive(path) {
    for (const [itemPath, el] of itemEls) {
      el.classList.toggle('is-active', itemPath === path);
    }
  }
  onRouteChange(syncActive);
  syncActive(currentRoute());

  const sidebarFooter = h('div.sidebar-footer');

  function renderSidebarUser() {
    clear(sidebarFooter);
    const { settings } = getAppState();
    const company = settings?.company || {};
    const user = settings?.user || {};
    const senderProfiles = settings?.senderProfiles || [];
    const activeProfileId = settings?.activeSenderProfileId;

    let activeName = user.fullName || 'Your name';
    let activeRole = user.designation || company.name || 'Set up your profile';
    let activeAvatar = user.avatar || '';

    if (activeProfileId) {
      const activePersona = senderProfiles.find((p) => p.id === activeProfileId);
      if (activePersona) {
        activeName = activePersona.name || activePersona.fullName || activeName;
        activeRole = activePersona.designation || activePersona.fullName || activeRole;
        activeAvatar = activePersona.avatar || activeAvatar;
      }
    }

    const avatarNode = activeAvatar
      ? avatarEl({ src: activeAvatar, name: activeName, size: 36 })
      : (company.logo
          ? h('div.avatar', {}, [h('img', { src: company.logo, alt: '' })])
          : avatarEl({ src: '', name: activeName, size: 36 }));

    const userRow = h('div.sidebar-user', {}, [
      avatarNode,
      h('div.sidebar-user-text', {}, [
        h('div.name', { text: activeName }),
        h('div.role', { text: activeRole }),
      ]),
    ]);

    sidebarFooter.append(userRow);
  }

  renderSidebarUser();
  subscribe(() => renderSidebarUser());

  return h('aside.sidebar', {}, [
    h('div.brand', {}, [
      h('img.brand-mark-img', { src: '../../assets/logo/wishreach-mark.png', alt: '' }),
      h('div.brand-divider'),
      h('div.brand-name', { text: 'WishReach' }),
    ]),
    nav,
    sidebarFooter,
  ]);
}
