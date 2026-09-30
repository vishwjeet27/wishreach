/**
 * @file Avatar rendering and interactive picker component for WishReach profiles.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from './icons.js';
import { DEFAULT_AVATARS, AVATAR_CATEGORIES } from '../../shared/avatars.js';
import { button } from './button.js';
import { showToast } from './toast.js';

/**
 * Renders an avatar element (image or letter initials fallback).
 * @param {{ src?: string, name?: string, size?: number, className?: string }} options
 * @returns {HTMLElement}
 */
export function avatarEl({ src = '', name = '', size = 32, className = '' }) {
  const el = h(`div.avatar${className ? `.${className}` : ''}`, {
    style: `width: ${size}px; height: ${size}px; min-width: ${size}px; border-radius: 50%;`,
  });

  if (src && src.trim()) {
    const img = h('img', {
      src: src.trim(),
      alt: name || 'Avatar',
      style: 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;',
      on: {
        error: () => {
          // If image fails to load, gracefully fallback to letter initial
          el.innerHTML = '';
          el.textContent = (name || 'U').charAt(0).toUpperCase();
        },
      },
    });
    el.append(img);
  } else {
    el.textContent = (name || 'U').charAt(0).toUpperCase();
  }

  return el;
}

/**
 * Builds an interactive avatar selection widget:
 * 1. Choose from categorized platform avatars (Realistic or Artistic)
 * 2. Upload custom photo (JPG, PNG)
 * 3. Reset / remove avatar
 *
 * @param {{
 *   initialAvatar?: string,
 *   name?: string,
 *   onChange: (avatarUrl: string) => void
 * }} options
 * @returns {HTMLElement}
 */
export function avatarPicker({ initialAvatar = '', name = '', onChange }) {
  let selected = initialAvatar || '';
  const previewHolder = h('div.avatar-picker-preview-holder');
  const avatarItems = [];

  // Determine initial active category based on current selected path
  let currentCategoryId = 'realistic';
  if (selected) {
    const isArtistic = AVATAR_CATEGORIES.find((c) => c.id === 'artistic')?.avatars.some((a) => a.path === selected);
    if (isArtistic) currentCategoryId = 'artistic';
  }

  function updatePreview() {
    previewHolder.innerHTML = '';
    previewHolder.append(avatarEl({ src: selected, name, size: 64, className: 'avatar-picker-preview' }));

    for (const b of avatarItems) {
      b.classList.toggle('is-selected', b._path === selected);
    }
  }

  const container = h('div.avatar-picker-wrap.stack', { style: 'gap: var(--space-3);' });

  // Category switch tabs
  const categoryTabs = h('div.avatar-category-tabs');
  const tabButtons = new Map();

  // Grid of platform avatars for the active category
  const grid = h('div.avatar-picker-grid');

  function renderGrid() {
    clear(grid);
    avatarItems.length = 0;
    const cat = AVATAR_CATEGORIES.find((c) => c.id === currentCategoryId) || AVATAR_CATEGORIES[0];

    for (const [id, btn] of tabButtons.entries()) {
      btn.classList.toggle('is-active', id === currentCategoryId);
    }

    for (const item of cat.avatars) {
      const isCur = selected === item.path;
      const itemEl = h('button.avatar-picker-option', {
        type: 'button',
        class: isCur ? 'is-selected' : '',
        title: item.label,
        on: {
          click: (e) => {
            e.preventDefault();
            selected = item.path;
            updatePreview();
            onChange(selected);
          },
        },
      }, [
        h('img', { src: item.path, alt: item.label }),
      ]);
      itemEl._path = item.path;
      avatarItems.push(itemEl);
      grid.append(itemEl);
    }
  }

  for (const cat of AVATAR_CATEGORIES) {
    const tabBtn = h('button.avatar-category-tab', {
      type: 'button',
      class: currentCategoryId === cat.id ? 'is-active' : '',
      text: cat.name,
      on: {
        click: (e) => {
          e.preventDefault();
          currentCategoryId = cat.id;
          renderGrid();
        },
      },
    });
    tabButtons.set(cat.id, tabBtn);
    categoryTabs.append(tabBtn);
  }

  renderGrid();
  updatePreview();


  const uploadInput = document.createElement('input');
  uploadInput.type = 'file';
  uploadInput.accept = 'image/*';
  uploadInput.style.display = 'none';
  uploadInput.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB.', { tone: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      selected = reader.result;
      updatePreview();
      onChange(selected);
      showToast('Custom avatar uploaded.');
    };
    reader.readAsDataURL(file);
  };

  const uploadBtn = button({
    label: 'Upload photo',
    icon: 'upload',
    size: 'sm',
    onClick: () => uploadInput.click(),
  });

  const clearBtn = button({
    label: 'Use initials',
    icon: 'refresh',
    size: 'sm',
    onClick: () => {
      selected = '';
      updatePreview();
      onChange('');
    },
  });

  const topRow = h('div.row', { style: 'gap: 16px; align-items: center;' }, [
    previewHolder,
    h('div.stack', { style: 'gap: 6px;' }, [
      h('span.text-body-strong', { text: 'Profile Avatar' }),
      h('span.text-caption.text-dim', { text: 'Select a professional corporate avatar or upload your own headshot.' }),
      h('div.row', { style: 'gap: 8px; flex-wrap: wrap; margin-top: 4px;' }, [uploadBtn, clearBtn]),
    ]),
  ]);

  container.append(topRow, categoryTabs, grid, uploadInput);
  return container;
}

