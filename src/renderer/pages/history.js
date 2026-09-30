/**
 * @file History page: every draft the user has explicitly saved from the
 * Generate page. Searchable by client/company/type, deletable, exportable.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from '../components/icons.js';
import { button, iconButton } from '../components/button.js';
import { api } from '../js/api.js';
import { setAppState, getAppState, updateGeneratorSession } from '../js/state.js';
import { navigate } from '../js/router.js';
import { confirmModal, openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { CONTENT_FIELDS } from '../../shared/contentFields.js';

/** @param {number} timestamp @returns {string} */
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/**
 * @param {HTMLElement} container
 * @param {URLSearchParams} query
 */
export async function renderHistory(container, query) {
  let drafts = await api.drafts.list();
  setAppState({ drafts });
  let filter = query.get('q') || '';

  const header = h('div.page-header', {}, [
    h('div.page-header-text', {}, [
      h('h1', { text: 'History' }),
      h('p', { text: 'Every draft you have saved, in one searchable place.' }),
    ]),
    h('div.row', { style: 'gap: 8px;' }, [
      button({
        label: 'Export CSV',
        icon: 'download',
        onClick: async () => {
          try {
            const result = await api.drafts.exportCsv();
            if (result) showToast(`Exported to ${result.filePath}`);
          } catch (err) {
            showToast(err.message, { tone: 'error' });
          }
        },
      }),
      button({
        label: 'Export JSON',
        icon: 'download',
        onClick: async () => {
          try {
            const result = await api.drafts.export();
            if (result) showToast(`Exported to ${result.filePath}`);
          } catch (err) {
            showToast(err.message, { tone: 'error' });
          }
        },
      }),
    ]),
  ]);

  const searchInput = h('input.input', { placeholder: 'Search by client, company, or type…', value: filter });
  const searchField = h('div.field', {}, [searchInput]);
  const listWrap = h('div');

  searchInput.addEventListener('input', () => {
    filter = searchInput.value;
    renderList();
  });

  const page = h('div.page', {}, [h('div.page-inner', {}, [header, searchField, listWrap])]);
  container.append(page);

  function renderList() {
    clear(listWrap);
    const needle = filter.trim().toLowerCase();
    const filtered = drafts.filter((d) =>
      !needle ||
      d.clientName.toLowerCase().includes(needle) ||
      d.clientCompany.toLowerCase().includes(needle) ||
      d.type.toLowerCase().includes(needle)
    );

    if (!filtered.length) {
      listWrap.append(
        h('div.empty-state', {}, [
          h('div.icon', { html: iconMarkup('history', 28) }),
          h('p.text-muted', { text: drafts.length ? 'No drafts match your search.' : 'Nothing saved yet. Generate and save a draft to see it here.' }),
        ])
      );
      return;
    }

    const table = h('table.table', {}, [
      h('thead', {}, [
        h('tr', {}, [
          h('th', { text: 'Client' }),
          h('th', { text: 'Company' }),
          h('th', { text: 'Type' }),
          h('th', { text: 'Saved' }),
          h('th', { text: '' }),
        ]),
      ]),
    ]);
    const tbody = h('tbody');
    for (const draft of filtered) {
      tbody.append(
        h('tr.table-row-clickable', { on: { click: () => openDraft(draft) } }, [
          h('td', { text: draft.clientName }),
          h('td', { text: draft.clientCompany }),
          h('td', {}, [h('span.badge', { text: draft.type })]),
          h('td.text-dim', { text: formatDate(draft.timestamp) }),
          h('td', {}, [
            iconButton({
              icon: 'trash',
              label: 'Delete draft',
              onClick: (event) => {
                event.stopPropagation();
                confirmModal({
                  title: 'Delete this draft?',
                  body: `"${draft.type}" for ${draft.clientName} will be removed permanently.`,
                  confirmLabel: 'Delete',
                  onConfirm: async () => {
                    drafts = await api.drafts.delete(draft.id);
                    setAppState({ drafts });
                    renderList();
                    showToast('Draft deleted.');
                  },
                });
              },
            }),
          ]),
        ])
      );
    }
    table.append(tbody);
    listWrap.append(h('div.card', {}, [table]));
  }

  function openDraft(draft) {
    const hasAll = draft.allContent && typeof draft.allContent === 'object' && Object.keys(draft.allContent).length > 0;

    let modalBody;
    let getActiveContent = () => draft.content;

    if (hasAll) {
      const keys = Object.keys(draft.allContent);
      let activeKey = keys[0];
      const tabsWrap = h('div.tabs', { style: 'margin-bottom: var(--space-2);' });
      const previewTextarea = h('textarea.textarea', {
        value: draft.allContent[activeKey] || '',
        rows: 12,
        readOnly: true,
        style: 'width: 100%; min-height: 260px; font-family: inherit; line-height: 1.7; padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-2); resize: vertical;',
      });

      getActiveContent = () => draft.allContent[activeKey] || '';

      const tabButtons = [];
      for (const k of keys) {
        const fieldMeta = CONTENT_FIELDS.find((f) => f.key === k);
        const label = fieldMeta ? fieldMeta.label : k;
        const tb = h('button.tab', {
          text: label,
          class: k === activeKey ? 'is-active' : '',
          on: {
            click: () => {
              activeKey = k;
              for (const b of tabButtons) b.classList.toggle('is-active', b._key === k);
              previewTextarea.value = draft.allContent[k] || '';
            },
          },
        });
        tb._key = k;
        tabButtons.push(tb);
        tabsWrap.append(tb);
      }

      modalBody = h('div.stack', { style: 'gap: var(--space-3);' }, [
        h('p.text-caption.text-dim', { text: `${draft.clientCompany} · ${formatDate(draft.timestamp)} · Full Campaign (${keys.length} pieces)` }),
        tabsWrap,
        previewTextarea,
      ]);
    } else {
      const textarea = h('textarea.textarea', {
        value: draft.content,
        rows: 12,
        readOnly: true,
        style: 'width: 100%; min-height: 260px; font-family: inherit; line-height: 1.7; padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg-2); resize: vertical;',
      });
      modalBody = h('div.stack', { style: 'gap: var(--space-3);' }, [
        h('p.text-caption.text-dim', { text: `${draft.clientCompany} · ${formatDate(draft.timestamp)}` }),
        textarea,
      ]);
    }

    const closeBtn = h('button.btn.btn-outline', { text: 'Close' });
    const copyBtn = h('button.btn.btn-primary', {
      text: 'Copy Active Piece',
      on: {
        click: async () => {
          await api.system.copyToClipboard(getActiveContent());
          showToast('Copied to clipboard.');
        },
      },
    });

    let close;
    const openInGenBtn = button({
      label: 'Open in Generator',
      icon: 'send',
      size: 'sm',
      onClick: () => {
        close();
        const { client: curClient } = getAppState().generatorSession;
        updateGeneratorSession({
          client: {
            ...curClient,
            clientName: draft.clientName || '',
            clientCompany: draft.clientCompany || '',
            tone: draft.tone || curClient.tone,
            goal: draft.goal || curClient.goal,
          },
          variantsContent: hasAll ? { A: draft.allContent } : { A: { email: draft.content } },
          currentVariantId: 'A',
        });
        navigate('/generator');
      },
    });

    const exportPdfBtn = button({
      label: 'Export PDF',
      icon: 'fileText',
      size: 'sm',
      onClick: async () => {
        try {
          const items = hasAll
            ? Object.entries(draft.allContent).map(([k, v]) => {
                const meta = CONTENT_FIELDS.find((f) => f.key === k);
                return { label: meta ? meta.label : k, content: v };
              })
            : [{ label: draft.type, content: draft.content }];

          const res = await api.drafts.exportPdf({
            title: draft.type,
            clientName: draft.clientName,
            clientCompany: draft.clientCompany,
            goal: draft.goal,
            tone: draft.tone,
            items,
          });
          if (res?.filePath) {
            showToast(`Exported to ${res.filePath}`);
          }
        } catch (err) {
          showToast(err.message, { tone: 'error' });
        }
      },
    });

    let copyAllBtn = null;
    if (hasAll) {
      copyAllBtn = button({
        label: 'Copy Full Campaign',
        icon: 'copy',
        size: 'sm',
        onClick: async () => {
          let fullStr = `OUTREACH SEQUENCE FOR ${draft.clientName} (${draft.clientCompany})\n`;
          fullStr += `========================================================\n\n`;
          for (const [k, v] of Object.entries(draft.allContent)) {
            const fieldMeta = CONTENT_FIELDS.find((f) => f.key === k);
            const label = fieldMeta ? fieldMeta.label : k;
            fullStr += `### ${label.toUpperCase()} ###\n${v}\n\n--------------------------------------------------------\n\n`;
          }
          await api.system.copyToClipboard(fullStr.trim());
          showToast('Full campaign copied to clipboard!');
        },
      });
    }

    const actions = [
      copyAllBtn,
      exportPdfBtn,
      openInGenBtn,
      closeBtn,
      copyBtn,
    ].filter(Boolean);

    close = openModal({
      title: `${draft.type} — ${draft.clientName}`,
      body: modalBody,
      actions,
      size: hasAll ? 'lg' : 'md',
    });
    closeBtn.addEventListener('click', close);
  }

  renderList();
}
