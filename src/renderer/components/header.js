/**
 * @file Top bar shown above every page: a quick search that jumps into
 * History with a filter applied, company badge, theme switcher, and
 * the active sender profile switcher with dropdown and quick persona creation.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from './icons.js';
import { navigate } from '../js/router.js';
import { getAppState, setAppState, subscribe } from '../js/state.js';
import { api } from '../js/api.js';
import { avatarEl, avatarPicker } from './avatar.js';
import { openModal } from './modal.js';
import { button } from './button.js';
import { showToast } from './toast.js';
import { textField, textareaField } from './textarea.js';
import { firstError } from '../js/validators.js';

/** @returns {HTMLElement} */
export function buildHeader() {
  const { settings } = getAppState();
  const company = settings?.company || {};

  const searchInput = h('input', {
    type: 'text',
    placeholder: 'Search clients in history…',
    on: {
      keydown: (event) => {
        if (event.key === 'Enter' && searchInput.value.trim()) {
          navigate('/history', { q: searchInput.value.trim() });
        }
      },
    },
  });

  const search = h('div.topbar-search', { html: iconMarkup('search', 16) });
  search.append(searchInput);

  const THEMES = ['dark', 'light', 'midnight', 'amber'];
  let currentTheme = settings?.theme || 'dark';

  const themeBtn = h('button.topbar-theme-btn', {
    title: `Current Theme: ${currentTheme.toUpperCase()} (Click to switch)`,
    html: iconMarkup(currentTheme === 'light' ? 'sun' : 'moon', 16),
    on: {
      click: async () => {
        const nextIdx = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
        const nextTheme = THEMES[nextIdx];
        currentTheme = nextTheme;
        document.documentElement.setAttribute('data-theme', nextTheme);
        themeBtn.title = `Current Theme: ${nextTheme.toUpperCase()} (Click to switch)`;
        themeBtn.innerHTML = iconMarkup(nextTheme === 'light' ? 'sun' : 'moon', 16);
        await api.settings.save({ theme: nextTheme });
      },
    },
  });

  // Profile Switcher Container
  const profileContainer = h('div.topbar-profile-container', { style: 'position: relative;' });

  function renderProfileSwitcher() {
    clear(profileContainer);

    const appState = getAppState();
    const currentSettings = appState?.settings || {};
    const primaryUser = currentSettings?.user || {};
    const senderProfiles = currentSettings?.senderProfiles || [];
    const activeProfileId = currentSettings?.activeSenderProfileId || '';

    // Determine current active persona
    let activeName = primaryUser.fullName || 'Welcome';
    let activeAvatar = primaryUser.avatar || '';
    let activeSub = 'Primary Profile';
    let isPrimaryActive = !activeProfileId;

    if (activeProfileId) {
      const activePersona = senderProfiles.find((p) => p.id === activeProfileId);
      if (activePersona) {
        activeName = activePersona.name || activePersona.fullName || 'Persona';
        activeAvatar = activePersona.avatar || '';
        activeSub = activePersona.designation || 'Sender Persona';
        isPrimaryActive = false;
      }
    }

    const triggerBtn = h('button.topbar-profile-btn', {
      type: 'button',
      title: `${activeName} (${activeSub}) - Click to switch sender persona`,
      on: {
        click: (e) => {
          e.stopPropagation();
          toggleDropdown();
        },
      },
    }, [
      avatarEl({ src: activeAvatar, name: activeName, size: 28, className: 'topbar-avatar' }),
      h('span.topbar-profile-name', { text: activeName }),
      h('span.topbar-profile-chevron', { html: iconMarkup('chevronDown', 14) }),
    ]);

    let dropdownEl = null;

    function toggleDropdown() {
      if (dropdownEl) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }

    function closeDropdown() {
      if (dropdownEl) {
        dropdownEl.remove();
        dropdownEl = null;
        triggerBtn.classList.remove('is-open');
        document.removeEventListener('click', onDocClick);
      }
    }

    function onDocClick(e) {
      if (dropdownEl && !dropdownEl.contains(e.target) && !triggerBtn.contains(e.target)) {
        closeDropdown();
      }
    }

    function openDropdown() {
      triggerBtn.classList.add('is-open');
      dropdownEl = h('div.profile-dropdown');

      dropdownEl.append(
        h('div.profile-dropdown-header', { text: 'Switch Sender Persona' })
      );

      const listEl = h('div.profile-dropdown-list');

      // 1. Primary profile item
      const primaryItem = h('button.profile-dropdown-item', {
        type: 'button',
        class: isPrimaryActive ? 'is-active' : '',
        on: {
          click: async (e) => {
            e.stopPropagation();
            closeDropdown();
            if (!isPrimaryActive) {
              const res = await api.settings.save({ activeSenderProfileId: '' });
              if (res?.ok) {
                setAppState({ settings: res.state });
                showToast(`Switched to primary profile: ${primaryUser.fullName || 'Default'}`);
              }
            }
          },
        },
      }, [
        h('div.profile-dropdown-info', {}, [
          avatarEl({ src: primaryUser.avatar, name: primaryUser.fullName || 'Primary', size: 30 }),
          h('div.profile-dropdown-texts', {}, [
            h('span.profile-dropdown-title', { text: primaryUser.fullName || 'Primary Identity' }),
            h('span.profile-dropdown-sub', { text: primaryUser.designation || 'Primary Profile' }),
          ]),
        ]),
        isPrimaryActive
          ? h('span.profile-dropdown-check', { html: iconMarkup('check', 16) })
          : null,
      ]);
      listEl.append(primaryItem);

      // 2. Persona Profiles
      for (const profile of senderProfiles) {
        const isCurrent = activeProfileId === profile.id;
        const item = h('button.profile-dropdown-item', {
          type: 'button',
          class: isCurrent ? 'is-active' : '',
          on: {
            click: async (e) => {
              e.stopPropagation();
              closeDropdown();
              if (!isCurrent) {
                const res = await api.settings.save({ activeSenderProfileId: profile.id });
                if (res?.ok) {
                  setAppState({ settings: res.state });
                  showToast(`Switched to profile: ${profile.name || profile.fullName}`);
                }
              }
            },
          },
        }, [
          h('div.profile-dropdown-info', {}, [
            avatarEl({ src: profile.avatar, name: profile.name || profile.fullName, size: 30 }),
            h('div.profile-dropdown-texts', {}, [
              h('span.profile-dropdown-title', { text: profile.name || profile.fullName }),
              h('span.profile-dropdown-sub', {
                text: `${profile.fullName || ''}${profile.designation ? ` · ${profile.designation}` : ''}`,
              }),
            ]),
          ]),
          isCurrent
            ? h('span.profile-dropdown-check', { html: iconMarkup('check', 16) })
            : null,
        ]);
        listEl.append(item);
      }

      dropdownEl.append(listEl);
      dropdownEl.append(h('div.profile-dropdown-divider'));

      // Action: Create New Persona
      const createAction = h('button.profile-dropdown-action', {
        type: 'button',
        html: `${iconMarkup('plus', 16)}<span>Create new persona</span>`,
        on: {
          click: (e) => {
            e.stopPropagation();
            closeDropdown();
            openCreatePersonaModal();
          },
        },
      });

      // Action: Manage in Settings
      const settingsAction = h('button.profile-dropdown-action', {
        type: 'button',
        html: `${iconMarkup('settings', 16)}<span>Manage in Settings</span>`,
        on: {
          click: (e) => {
            e.stopPropagation();
            closeDropdown();
            navigate('/settings');
          },
        },
      });

      dropdownEl.append(createAction, settingsAction);
      profileContainer.append(dropdownEl);
      setTimeout(() => document.addEventListener('click', onDocClick), 0);
    }

    profileContainer.append(triggerBtn);
  }

  // Initial render
  renderProfileSwitcher();

  // Re-render when app state changes (e.g. user changes name or avatar or active profile)
  subscribe(() => {
    renderProfileSwitcher();
  });

  const meta = h('div.topbar-meta', {}, [
    themeBtn,
    company.name
      ? h('div.topbar-company', { html: `${iconMarkup('building', 14)}<span>${escapeText(company.name)}</span>` })
      : null,
    profileContainer,
  ]);

  return h('header.topbar', {}, [search, meta]);
}

/**
 * Opens a modal to instantly create a new sender persona.
 */
function openCreatePersonaModal() {
  const currentSettings = getAppState()?.settings || {};
  const existingProfiles = [...(currentSettings?.senderProfiles || [])];

  const data = {
    id: `prof_${Date.now()}`,
    name: '',
    fullName: '',
    designation: '',
    department: '',
    signature: '',
    avatar: '',
  };

  const nameField = textField({
    label: 'Persona label / role',
    value: '',
    placeholder: 'e.g. Technical Founder, Enterprise SDR, Partnerships Lead',
    onInput: (v) => (data.name = v),
  });

  const fullNameField = textField({
    label: 'Sender full name',
    value: '',
    placeholder: 'e.g. Jordan Miller',
    onInput: (v) => (data.fullName = v),
  });

  const designationField = textField({
    label: 'Designation / Title',
    value: '',
    placeholder: 'e.g. VP of Growth',
    onInput: (v) => (data.designation = v),
  });

  const deptField = textField({
    label: 'Department',
    value: '',
    optional: true,
    placeholder: 'e.g. Business Development',
    onInput: (v) => (data.department = v),
  });

  const avatarWidget = avatarPicker({
    initialAvatar: '',
    name: '',
    onChange: (url) => {
      data.avatar = url;
    },
  });

  const sigField = textareaField({
    label: 'Custom signature (optional)',
    value: '',
    rows: 3,
    placeholder: 'Best,\nJordan Miller\nVP of Growth\nCompany Name',
    onInput: (v) => (data.signature = v),
  });

  const formWrap = h('div.stack', { style: 'gap: 14px; max-height: 70vh; overflow-y: auto; padding-right: 4px;' }, [
    nameField.el,
    h('div.grid-2', {}, [fullNameField.el, designationField.el]),
    deptField.el,
    avatarWidget,
    sigField.el,
  ]);

  let closeModal;
  const cancelBtn = h('button.btn.btn-outline', {
    type: 'button',
    text: 'Cancel',
    on: { click: () => closeModal() },
  });

  const submitBtn = button({
    label: 'Create & Activate Persona',
    variant: 'primary',
    size: 'sm',
    onClick: async () => {
      const err = firstError([
        { value: data.name, label: 'Persona label', required: true },
        { value: data.fullName, label: 'Full name', required: true },
      ]);
      if (err) return showToast(err, { tone: 'error' });

      existingProfiles.push(data);
      const res = await api.settings.save({
        senderProfiles: existingProfiles,
        activeSenderProfileId: data.id,
      });

      if (res?.ok) {
        setAppState({ settings: res.state });
        closeModal();
        showToast(`Created & activated persona: "${data.name}"`);
      } else {
        showToast(res?.error || 'Could not save profile.', { tone: 'error' });
      }
    },
  });

  closeModal = openModal({
    title: 'Create New Sender Persona',
    body: formWrap,
    actions: [cancelBtn, submitBtn],
    size: 'lg',
  });
}

/**
 * Escapes text before it is placed inside an innerHTML template string.
 * @param {string} value
 * @returns {string}
 */
function escapeText(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
