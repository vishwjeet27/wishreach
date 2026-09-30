/**
 * @file Templates page: manual, reusable outreach snippets grouped by
 * industry category, with dynamic {{variable}} chips and live substitution preview.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from '../components/icons.js';
import { button, iconButton } from '../components/button.js';
import { textField, textareaField, selectField } from '../components/textarea.js';
import { api } from '../js/api.js';
import { getAppState, setAppState, updateGeneratorSession } from '../js/state.js';
import { openModal, confirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { navigate } from '../js/router.js';

const CATEGORIES = ['All', 'SaaS', 'Healthcare', 'E-commerce', 'Agencies', 'Startups', 'Other'];

const TEMPLATE_VARIABLES = [
  { tag: '{{clientName}}', label: 'Client Name', sample: 'Jordan Lee' },
  { tag: '{{clientCompany}}', label: 'Client Company', sample: 'Northwind Robotics' },
  { tag: '{{clientDesignation}}', label: 'Client Role', sample: 'VP of Engineering' },
  { tag: '{{targetCountry}}', label: 'Country', sample: 'United States' },
  { tag: '{{industry}}', label: 'Industry', sample: 'Industrial Automation' },
  { tag: '{{companyName}}', label: 'Your Company', sample: 'WishReach' },
  { tag: '{{userName}}', label: 'Your Name', sample: 'Vishwjeet' },
];

/** @param {HTMLElement} container */
export async function renderTemplates(container) {
  let templates = await api.templates.list();
  setAppState({ templates });
  let activeCategory = 'All';

  const header = h('div.page-header', {}, [
    h('div.page-header-text', {}, [
      h('h1', { text: 'Templates' }),
      h('p', { text: 'Reusable outreach frameworks with dynamic {{variable}} tags and instant Generator loading.' }),
    ]),
    button({ label: 'New template', icon: 'plus', variant: 'primary', onClick: () => openEditor() }),
  ]);

  const tabsRow = h('div.tabs');
  const tabEls = new Map();
  for (const category of CATEGORIES) {
    const tabEl = h('button.tab', { text: category, on: { click: () => { activeCategory = category; syncTabs(); renderGrid(); } } });
    tabEls.set(category, tabEl);
    tabsRow.append(tabEl);
  }
  function syncTabs() {
    for (const [cat, el] of tabEls) el.classList.toggle('is-active', cat === activeCategory);
  }
  syncTabs();

  const gridWrap = h('div');
  const page = h('div.page', {}, [h('div.page-inner', {}, [header, tabsRow, gridWrap])]);
  container.append(page);

  function renderGrid() {
    clear(gridWrap);
    const filtered = activeCategory === 'All' ? templates : templates.filter((t) => t.category === activeCategory);

    if (!filtered.length) {
      gridWrap.append(
        h('div.empty-state', {}, [
          h('div.icon', { html: iconMarkup('template', 28) }),
          h('p.text-muted', { text: 'No templates in this category yet.' }),
          button({ label: 'Create one', variant: 'primary', onClick: () => openEditor() }),
        ])
      );
      return;
    }

    const grid = h('div.grid-2');
    for (const t of filtered) {
      const useBtn = button({
        label: 'Use in Generator',
        icon: 'send',
        size: 'sm',
        onClick: () => {
          const currentClient = getAppState().generatorSession?.client || {};
          updateGeneratorSession({
            client: {
              ...currentClient,
              requirements: t.content,
            },
          });
          navigate('/generate');
          showToast(`Loaded "${t.name}" into Generator!`);
        },
      });

      grid.append(
        h('div.card.card-pad.stack', {}, [
          h('div.row-between', {}, [
            h('div', {}, [
              h('h3.text-title', { text: t.name }),
              h('span.category-pill', { text: t.category }),
            ]),
            h('div.row', {}, [
              iconButton({ icon: 'copy', label: 'Copy', onClick: async () => {
                await api.system.copyToClipboard(t.content);
                showToast('Copied to clipboard.');
              } }),
              iconButton({ icon: 'save', label: 'Edit', onClick: () => openEditor(t) }),
              iconButton({ icon: 'trash', label: 'Delete', onClick: () => confirmModal({
                title: 'Delete this template?',
                body: `"${t.name}" will be removed permanently.`,
                confirmLabel: 'Delete',
                onConfirm: async () => {
                  templates = await api.templates.delete(t.id);
                  setAppState({ templates });
                  renderGrid();
                  showToast('Template deleted.');
                },
              }) }),
            ]),
          ]),
          h('p.text-muted', { text: t.content.length > 220 ? `${t.content.slice(0, 220)}…` : t.content }),
          h('div', { style: 'display: flex; justify-content: flex-end;' }, [useBtn]),
        ])
      );
    }
    gridWrap.append(grid);
  }

  function openEditor(existing) {
    const { settings } = getAppState();
    const name = textField({ label: 'Template name', value: existing?.name || '', placeholder: 'SaaS cold intro' });
    const category = selectField({
      label: 'Category',
      value: existing?.category || 'SaaS',
      options: CATEGORIES.filter((c) => c !== 'All').map((c) => ({ value: c, label: c })),
    });
    const content = textareaField({ label: 'Template content', value: existing?.content || '', rows: 7 });

    // Live preview box that replaces variables with sample data
    const previewEl = h('div.template-preview-box', { text: renderPreview(content.textarea.value) });

    function updatePreview() {
      previewEl.textContent = renderPreview(content.textarea.value);
    }
    content.textarea.addEventListener('input', updatePreview);

    function renderPreview(text) {
      if (!text || !text.trim()) return 'Live preview will appear here as you type...';
      let res = text;
      for (const v of TEMPLATE_VARIABLES) {
        const sampleVal = v.tag === '{{companyName}}'
          ? (settings?.company?.name || v.sample)
          : v.tag === '{{userName}}'
          ? (settings?.user?.fullName || v.sample)
          : v.sample;
        res = res.replaceAll(v.tag, sampleVal);
      }
      return res;
    }

    // Dynamic Variable Chips
    const chipsWrap = h('div.stack', {}, [
      h('div.row-between', {}, [
        h('label.field-label', { text: 'Insert Dynamic Variables (click to add):' }),
      ]),
      h('div.chip-list', {}, TEMPLATE_VARIABLES.map((v) => {
        const chip = h('span.chip-interactive', {
          text: `+ ${v.label} ${v.tag}`,
          on: {
            click: () => {
              const textarea = content.textarea;
              const start = textarea.selectionStart ?? textarea.value.length;
              const end = textarea.selectionEnd ?? start;
              const val = textarea.value;
              textarea.value = val.slice(0, start) + v.tag + val.slice(end);
              textarea.selectionStart = textarea.selectionEnd = start + v.tag.length;
              textarea.focus();
              updatePreview();
            },
          },
        });
        return chip;
      })),
    ]);

    const previewSection = h('div.stack', {}, [
      h('label.field-label', { text: 'Rendered Sample Preview:' }),
      previewEl,
    ]);

    const cancelBtn = h('button.btn.btn-outline', { text: 'Cancel' });
    const saveBtn = h('button.btn.btn-primary', {
      text: existing ? 'Save changes' : 'Create template',
      on: {
        click: async () => {
          try {
            const result = await api.templates.save({
              id: existing?.id,
              name: name.input.value,
              category: category.select.value,
              content: content.textarea.value,
            });
            templates = result.templates;
            setAppState({ templates });
            renderGrid();
            close();
            showToast(existing ? 'Template updated.' : 'Template created.');
          } catch (err) {
            showToast(err.message, { tone: 'error' });
          }
        },
      },
    });

    const close = openModal({
      title: existing ? 'Edit template' : 'New template',
      body: h('div.stack', { style: 'gap: var(--space-4);' }, [name.el, category.el, chipsWrap, content.el, previewSection]),
      actions: [cancelBtn, saveBtn],
      size: 'lg',
    });
    cancelBtn.addEventListener('click', close);
  }

  renderGrid();
}
