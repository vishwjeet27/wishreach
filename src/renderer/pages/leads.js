/**
 * @file Leads CRM page: manage prospects, company intelligence, and one-click
 * transfer directly into the sequence Generator.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from '../components/icons.js';
import { button, iconButton } from '../components/button.js';
import { textField, textareaField, selectField } from '../components/textarea.js';
import { openModal, confirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { api } from '../js/api.js';
import { navigate } from '../js/router.js';
import { getAppState, updateGeneratorSession } from '../js/state.js';
import { firstError } from '../js/validators.js';

const STATUS_OPTIONS = [
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Meeting Booked', label: 'Meeting Booked' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Converted', label: 'Converted' },
  { value: 'Lost', label: 'Lost' },
];

/** @param {HTMLElement} container */
export async function renderLeads(container) {
  let leads = [];
  try {
    leads = await api.leads.list();
  } catch {
    leads = [];
  }

  let filterText = '';
  let filterStatus = 'All';

  const header = h('div.page-header', {}, [
    h('div.page-header-text', {}, [
      h('h1', { text: 'Leads CRM' }),
      h('p', { text: 'Track prospect companies, customize their pain points, and launch personalized sequences in 1 click.' }),
    ]),
    button({
      label: 'Add lead',
      icon: 'plus',
      variant: 'primary',
      onClick: () => openLeadModal(null),
    }),
  ]);

  const searchInput = h('input.input', {
    placeholder: 'Search leads by name, company, email, or industry…',
    value: filterText,
    on: {
      input: (e) => {
        filterText = e.target.value;
        renderList();
      },
    },
  });

  const statusFilter = selectField({
    label: '',
    value: filterStatus,
    options: [{ value: 'All', label: 'All statuses' }, ...STATUS_OPTIONS],
    onChange: (v) => {
      filterStatus = v;
      renderList();
    },
  });

  const filterBar = h('div.row', { style: 'gap: 12px; margin-bottom: var(--space-4);' }, [
    h('div', { style: 'flex: 1;' }, [searchInput]),
    h('div', { style: 'width: 180px;' }, [statusFilter.el]),
  ]);

  const listWrap = h('div');
  const page = h('div.page', {}, [h('div.page-inner', {}, [header, filterBar, listWrap])]);
  container.append(page);

  function renderList() {
    clear(listWrap);
    const needle = filterText.trim().toLowerCase();

    const filtered = leads.filter((l) => {
      const matchText =
        !needle ||
        (l.name && l.name.toLowerCase().includes(needle)) ||
        (l.company && l.company.toLowerCase().includes(needle)) ||
        (l.email && l.email.toLowerCase().includes(needle)) ||
        (l.industry && l.industry.toLowerCase().includes(needle));

      const matchStatus = filterStatus === 'All' || l.status === filterStatus;
      return matchText && matchStatus;
    });

    if (!filtered.length) {
      listWrap.append(
        h('div.empty-state', {}, [
          h('div.icon', { html: iconMarkup('users', 32) }),
          h('p.text-muted', {
            text: leads.length
              ? 'No leads match your filter criteria.'
              : 'No prospects saved yet. Click "Add lead" above to start building your outreach pipeline.',
          }),
        ])
      );
      return;
    }

    const table = h('table.table', {}, [
      h('thead', {}, [
        h('tr', {}, [
          h('th', { text: 'Prospect' }),
          h('th', { text: 'Company' }),
          h('th', { text: 'Role & Location' }),
          h('th', { text: 'Status' }),
          h('th', { style: 'text-align: right;', text: 'Actions' }),
        ]),
      ]),
    ]);

    const tbody = h('tbody');
    for (const lead of filtered) {
      const statusClass =
        lead.status === 'Contacted'
          ? 'status-contacted'
          : lead.status === 'Meeting Booked'
          ? 'status-meeting'
          : lead.status === 'Converted'
          ? 'status-closed'
          : 'status-new';

      const generateBtn = button({
        label: 'Generate',
        icon: 'send',
        size: 'sm',
        variant: 'primary',
        onClick: () => {
          const { client: curClient } = getAppState().generatorSession;
          updateGeneratorSession({
            client: {
              ...curClient,
              clientName: lead.name,
              clientCompany: lead.company,
              clientDesignation: lead.role || '',
              clientWebsite: lead.website || '',
              targetCountry: lead.country || curClient.targetCountry || '',
              industry: lead.industry || '',
              requirements: lead.requirements || curClient.requirements || '',
            },
          });
          navigate('/generate');
          showToast(`Loaded ${lead.name} (${lead.company}) into Generator.`);
        },
      });

      const editBtn = iconButton({
        icon: 'edit',
        label: 'Edit lead',
        onClick: () => openLeadModal(lead),
      });

      const deleteBtn = iconButton({
        icon: 'trash',
        label: 'Delete lead',
        onClick: () => {
          confirmModal({
            title: `Delete lead "${lead.name}"?`,
            body: `Are you sure you want to delete ${lead.name} from ${lead.company}?`,
            confirmLabel: 'Delete',
            onConfirm: async () => {
              leads = await api.leads.delete(lead.id);
              renderList();
              showToast('Lead removed.');
            },
          });
        },
      });

      tbody.append(
        h('tr.table-row-clickable', {}, [
          h('td', {}, [
            h('div.text-body-strong', { text: lead.name }),
            lead.email ? h('div.text-caption.text-dim', { text: lead.email }) : null,
          ]),
          h('td', {}, [
            h('div.text-body-strong', { text: lead.company }),
            lead.website ? h('div.text-caption.text-dim', { text: lead.website }) : null,
          ]),
          h('td', {}, [
            h('div', { text: lead.role || '—' }),
            h('div.text-caption.text-dim', {
              text: [lead.industry, lead.country].filter(Boolean).join(' · ') || '—',
            }),
          ]),
          h('td', {}, [
            h('span.status-badge', { class: statusClass, text: lead.status || 'New' }),
          ]),
          h('td', { style: 'text-align: right;' }, [
            h('div.row', { style: 'justify-content: flex-end; gap: 6px;' }, [generateBtn, editBtn, deleteBtn]),
          ]),
        ])
      );
    }

    table.append(tbody);
    listWrap.append(h('div.card', {}, [table]));
  }

  function openLeadModal(existingLead = null) {
    const isEdit = Boolean(existingLead);
    const data = existingLead ? { ...existingLead } : {
      name: '',
      company: '',
      role: '',
      email: '',
      website: '',
      country: '',
      industry: '',
      status: 'New',
      requirements: '',
      notes: '',
    };

    const nameField = textField({
      label: 'Prospect full name',
      value: data.name,
      placeholder: 'Jordan Rivera',
      onInput: (v) => (data.name = v),
    });

    const companyField = textField({
      label: 'Company name',
      value: data.company,
      placeholder: 'Stark Logistics',
      onInput: (v) => (data.company = v),
    });

    const roleField = textField({
      label: 'Designation / Title',
      value: data.role,
      optional: true,
      placeholder: 'VP of Operations',
      onInput: (v) => (data.role = v),
    });

    const emailField = textField({
      label: 'Email address',
      value: data.email,
      optional: true,
      type: 'email',
      placeholder: 'jordan@starklogistics.com',
      onInput: (v) => (data.email = v),
    });

    const websiteField = textField({
      label: 'Website URL',
      value: data.website,
      optional: true,
      placeholder: 'starklogistics.com',
      onInput: (v) => (data.website = v),
    });

    const countryField = textField({
      label: 'Target country',
      value: data.country,
      optional: true,
      placeholder: 'United States',
      onInput: (v) => (data.country = v),
    });

    const industryField = textField({
      label: 'Industry',
      value: data.industry,
      optional: true,
      placeholder: 'Supply Chain & Logistics',
      onInput: (v) => (data.industry = v),
    });

    const statusSel = selectField({
      label: 'Outreach status',
      value: data.status,
      options: STATUS_OPTIONS,
      onChange: (v) => (data.status = v),
    });

    const reqField = textareaField({
      label: 'Requirements / pain points',
      value: data.requirements,
      optional: true,
      rows: 3,
      placeholder: 'Needs help scaling automated warehouse workflows and reducing fulfillment bottlenecks.',
      onInput: (v) => (data.requirements = v),
    });

    const notesField = textareaField({
      label: 'Internal notes',
      value: data.notes,
      optional: true,
      rows: 2,
      placeholder: 'Met at SaaStr conference. Expressed interest in Q4 trial.',
      onInput: (v) => (data.notes = v),
    });

    const form = h('div.stack', { style: 'gap: 12px; max-height: 70vh; overflow-y: auto; padding-right: 4px;' }, [
      h('div.grid-2', {}, [nameField.el, companyField.el]),
      h('div.grid-2', {}, [roleField.el, emailField.el]),
      h('div.grid-2', {}, [websiteField.el, statusSel.el]),
      h('div.grid-2', {}, [countryField.el, industryField.el]),
      reqField.el,
      notesField.el,
    ]);

    let closeModal;
    const cancelBtn = h('button.btn.btn-outline', { text: 'Cancel', on: { click: () => closeModal() } });
    const saveBtn = button({
      label: isEdit ? 'Update lead' : 'Save lead',
      variant: 'primary',
      size: 'sm',
      onClick: async () => {
        const err = firstError([
          { value: data.name, label: 'Prospect name', required: true },
          { value: data.company, label: 'Company name', required: true },
          { value: data.email, label: 'Email', email: true },
          { value: data.website, label: 'Website', url: true },
        ]);
        if (err) return showToast(err, { tone: 'error' });

        try {
          const res = await api.leads.save(data);
          leads = res.leads;
          closeModal();
          renderList();
          showToast(isEdit ? 'Lead updated.' : 'Lead saved to CRM.');
        } catch (error) {
          showToast(error.message, { tone: 'error' });
        }
      },
    });

    closeModal = openModal({
      title: isEdit ? `Edit lead: ${existingLead.name}` : 'Add prospect to CRM',
      body: form,
      actions: [cancelBtn, saveBtn],
      size: 'lg',
    });
  }

  renderList();
}
