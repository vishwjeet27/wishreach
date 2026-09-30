/**
 * @file Aesthetic HTML Email Signature Studio.
 * Generates bulletproof, table-based HTML signatures compatible with Gmail,
 * Outlook, Apple Mail, and mobile clients with live WYSIWYG preview.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from '../components/icons.js';
import { textField, textareaField } from '../components/textarea.js';
import { button } from '../components/button.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { api } from '../js/api.js';
import { getAppState, setAppState, updateSignatureSession } from '../js/state.js';

const TEMPLATES = [
  {
    id: 'executive',
    name: 'Executive Dual-Column',
    desc: 'Avatar/logo on the left with vertical accent border and prominent CTA button.',
  },
  {
    id: 'minimal',
    name: 'Minimalist Clean',
    desc: 'Ultra-clean vertical divider line, high-contrast typography, zero clutter.',
  },
  {
    id: 'compact',
    name: 'Compact Cold Outreach',
    desc: 'Single/two-row footprint ideal for short 3-sentence sales emails.',
  },
  {
    id: 'brand_card',
    name: 'Brand Card & Banner',
    desc: 'Top accent bar, company slogan, full contact block, and optional disclaimer.',
  },
];

const ACCENT_COLORS = [
  { id: '#4f46e5', label: 'Indigo' },
  { id: '#059669', label: 'Emerald' },
  { id: '#1d4ed8', label: 'Royal Blue' },
  { id: '#d97706', label: 'Amber Gold' },
  { id: '#e11d48', label: 'Crimson' },
  { id: '#18181b', label: 'Monochrome' },
];

/**
 * Builds table-based inline-styled HTML signature compatible with all email clients.
 * @param {Object} data
 * @param {boolean} [forDark=false]
 * @returns {string}
 */
export function buildSignatureHtml(data, forDark = false) {
  const accent = data.accentColor || '#4f46e5';
  const textColor = forDark ? '#f3f4f6' : '#111827';
  const mutedColor = forDark ? '#9ca3af' : '#6b7280';
  const borderColor = forDark ? '#374151' : '#e5e7eb';
  const fontFam = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const escapeHtml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const name = escapeHtml(data.fullName || 'Your Name');
  const title = escapeHtml(data.designation || 'Your Title');
  const dept = data.department ? ` · ${escapeHtml(data.department)}` : '';
  const company = escapeHtml(data.companyName || 'Company');
  const email = escapeHtml(data.email || '');
  const phone = escapeHtml(data.phone || '');
  const website = data.companyWebsite || '';
  const logo = data.logoUrl || '';
  const bookingText = escapeHtml(data.bookingText || 'Book a 15-min call');
  const bookingUrl = data.bookingUrl || '';
  const linkedin = data.linkedinUrl || '';
  const twitter = data.twitterUrl || '';
  const github = data.githubUrl || '';
  const disclaimer = escapeHtml(data.disclaimer || '');

  const cleanUrl = (u) => {
    if (!u) return '';
    const trimmed = String(u).trim();
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  };

  // Social Links Row
  const socialParts = [];
  if (linkedin) socialParts.push(`<a href="${cleanUrl(linkedin)}" style="color:${accent}; text-decoration:none; font-weight:600;">LinkedIn</a>`);
  if (twitter) socialParts.push(`<a href="${cleanUrl(twitter)}" style="color:${accent}; text-decoration:none; font-weight:600;">Twitter/X</a>`);
  if (github) socialParts.push(`<a href="${cleanUrl(github)}" style="color:${accent}; text-decoration:none; font-weight:600;">GitHub</a>`);
  const socialHtml = socialParts.length > 0 ? `<div style="margin-top:6px; font-size:12px; font-family:${fontFam};">${socialParts.join(' &nbsp;·&nbsp; ')}</div>` : '';

  // Booking CTA Button
  const ctaBtnHtml = bookingUrl
    ? `<div style="margin-top:10px;">
        <a href="${cleanUrl(bookingUrl)}" style="background-color:${accent}; color:#ffffff; font-size:12px; font-weight:600; font-family:${fontFam}; text-decoration:none; padding:7px 14px; border-radius:4px; display:inline-block;">${bookingText}</a>
       </div>`
    : '';

  // Contact Row
  const contactParts = [];
  if (email) contactParts.push(`<span><a href="mailto:${email}" style="color:${mutedColor}; text-decoration:none;">${email}</a></span>`);
  if (phone) contactParts.push(`<span><a href="tel:${phone}" style="color:${mutedColor}; text-decoration:none;">${phone}</a></span>`);
  if (website) contactParts.push(`<span><a href="${cleanUrl(website)}" style="color:${mutedColor}; text-decoration:none;">${website.replace(/^https?:\/\//i, '')}</a></span>`);
  const contactHtml = contactParts.length > 0 ? `<div style="margin-top:5px; font-size:12px; color:${mutedColor}; font-family:${fontFam}; line-height:1.5;">${contactParts.join(' &nbsp;|&nbsp; ')}</div>` : '';

  // Disclaimer HTML
  const disclaimerHtml = disclaimer
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:12px; border-top:1px dashed ${borderColor}; padding-top:8px; max-width:500px;">
        <tr>
          <td style="font-size:10px; color:${mutedColor}; font-family:${fontFam}; line-height:1.4;">${disclaimer}</td>
        </tr>
       </table>`
    : '';

  // Template 1: Executive Dual-Column
  if (data.templateId === 'executive') {
    const avatarHtml = logo
      ? `<td style="vertical-align:top; padding-right:16px;">
           <img src="${logo}" width="68" height="68" alt="${company}" style="width:68px; height:68px; object-fit:contain; border-radius:${data.avatarShape === 'round' ? '50%' : '8px'}; border:1px solid ${borderColor}; display:block;" />
         </td>`
      : '';

    return `
      <table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFam}; font-size:13px; color:${textColor}; line-height:1.4;">
        <tr>
          ${avatarHtml}
          <td style="vertical-align:top; border-left:2px solid ${accent}; padding-left:14px;">
            <div style="font-size:15px; font-weight:700; color:${textColor};">${name}</div>
            <div style="font-size:12px; color:${mutedColor}; margin-top:2px;">${title} <span style="color:${accent}; font-weight:600;">@ ${company}</span>${dept}</div>
            ${contactHtml}
            ${socialHtml}
            ${ctaBtnHtml}
          </td>
        </tr>
      </table>
      ${disclaimerHtml}
    `.trim();
  }

  // Template 2: Minimalist Clean
  if (data.templateId === 'minimal') {
    return `
      <table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFam}; font-size:13px; color:${textColor}; line-height:1.4;">
        <tr>
          <td style="border-left:3px solid ${accent}; padding-left:12px;">
            <div style="font-size:14px; font-weight:700; color:${textColor};">${name}</div>
            <div style="font-size:12px; color:${mutedColor};">${title} · ${company}</div>
            ${contactHtml}
            ${bookingUrl ? `<div style="margin-top:6px; font-size:12px;"><a href="${cleanUrl(bookingUrl)}" style="color:${accent}; font-weight:600; text-decoration:none;">> ${bookingText}</a></div>` : ''}
            ${socialHtml}
          </td>
        </tr>
      </table>
      ${disclaimerHtml}
    `.trim();
  }

  // Template 3: Compact Cold Outreach
  if (data.templateId === 'compact') {
    const contactLine = [email, phone, website ? cleanUrl(website).replace(/^https?:\/\//i, '') : ''].filter(Boolean).join(' · ');
    return `
      <div style="font-family:${fontFam}; font-size:12px; color:${mutedColor}; line-height:1.5;">
        <div style="color:${textColor}; font-weight:600;"><span style="color:${accent};">--</span> ${name} &nbsp;·&nbsp; <span style="color:${mutedColor}; font-weight:normal;">${title} @ ${company}</span></div>
        ${contactLine ? `<div>${contactLine}</div>` : ''}
        ${bookingUrl ? `<div><a href="${cleanUrl(bookingUrl)}" style="color:${accent}; text-decoration:none; font-weight:600;">${bookingText}</a></div>` : ''}
      </div>
      ${disclaimerHtml}
    `.trim();
  }

  // Template 4: Brand Card & Banner
  const brandLogo = logo
    ? `<img src="${logo}" height="32" alt="${company}" style="height:32px; object-fit:contain; margin-bottom:8px; display:block;" />`
    : '';

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="font-family:${fontFam}; max-width:440px; border-top:3px solid ${accent}; padding-top:10px; font-size:13px; color:${textColor}; line-height:1.4;">
      <tr>
        <td>
          ${brandLogo}
          <div style="font-size:15px; font-weight:700; color:${textColor};">${name}</div>
          <div style="font-size:12px; color:${mutedColor};">${title} &nbsp;|&nbsp; <strong style="color:${textColor};">${company}</strong></div>
          ${contactHtml}
          ${socialHtml}
          ${ctaBtnHtml}
        </td>
      </tr>
    </table>
    ${disclaimerHtml}
  `.trim();
}

/**
 * Builds clean plain-text fallback signature.
 * @param {Object} data
 * @returns {string}
 */
export function buildSignaturePlainText(data) {
  const lines = [
    `--`,
    `${data.fullName || 'Name'} | ${data.designation || 'Title'} @ ${data.companyName || 'Company'}`,
  ];
  if (data.email) lines.push(`Email: ${data.email}`);
  if (data.phone) lines.push(`Phone: ${data.phone}`);
  if (data.companyWebsite) lines.push(`Web: ${data.companyWebsite}`);
  if (data.bookingUrl) lines.push(`${data.bookingText || 'Book call'}: ${data.bookingUrl}`);
  if (data.disclaimer) lines.push(`\n${data.disclaimer}`);
  return lines.join('\n');
}

/** @param {HTMLElement} container */
export async function renderSignatureStudio(container) {
  const { settings, signatureSession } = getAppState();

  // Initialize session: prefer in-memory session, then persisted settings.signatureSession, then profile defaults
  const saved = settings?.signatureSession || {};
  const data = {
    fullName: signatureSession.fullName || saved.fullName || settings?.user?.fullName || '',
    designation: signatureSession.designation || saved.designation || settings?.user?.designation || '',
    department: signatureSession.department || saved.department || settings?.user?.department || '',
    companyName: signatureSession.companyName || saved.companyName || settings?.company?.name || '',
    companyWebsite: signatureSession.companyWebsite || saved.companyWebsite || settings?.company?.website || '',
    email: signatureSession.email || saved.email || settings?.company?.email || '',
    phone: signatureSession.phone || saved.phone || settings?.company?.phone || '',
    address: signatureSession.address || saved.address || settings?.company?.address || '',
    logoUrl: signatureSession.logoUrl || saved.logoUrl || settings?.company?.logo || '',
    avatarShape: signatureSession.avatarShape || saved.avatarShape || 'round',
    bookingText: signatureSession.bookingText || saved.bookingText || 'Book a 15-min call',
    bookingUrl: signatureSession.bookingUrl || saved.bookingUrl || '',
    linkedinUrl: signatureSession.linkedinUrl || saved.linkedinUrl || settings?.company?.linkedin || '',
    twitterUrl: signatureSession.twitterUrl || saved.twitterUrl || '',
    githubUrl: signatureSession.githubUrl || saved.githubUrl || '',
    disclaimer: signatureSession.disclaimer || saved.disclaimer || '',
    templateId: signatureSession.templateId || saved.templateId || 'executive',
    accentColor: signatureSession.accentColor || saved.accentColor || '#4f46e5',
    themeBg: signatureSession.themeBg || saved.themeBg || 'light',
  };

  // Sync in-memory session immediately so generator picks it up
  updateSignatureSession(data);

  const header = h('div.page-header', {}, [
    h('div.page-header-text', {}, [
      h('h1', { text: 'Email Signature Studio' }),
      h('p', { text: 'Create aesthetic, bulletproof HTML email signatures tailored for Gmail, Outlook, and Apple Mail.' }),
    ]),
    h('div.row', { style: 'gap: 8px;' }, [
      button({
        label: 'Import from Profile',
        icon: 'refresh',
        size: 'sm',
        onClick: () => {
          data.fullName = settings?.user?.fullName || '';
          data.designation = settings?.user?.designation || '';
          data.department = settings?.user?.department || '';
          data.companyName = settings?.company?.name || '';
          data.companyWebsite = settings?.company?.website || '';
          data.email = settings?.company?.email || '';
          data.phone = settings?.company?.phone || '';
          data.logoUrl = settings?.company?.logo || '';
          data.linkedinUrl = settings?.company?.linkedin || '';
          updateSignatureSession(data);
          clear(container);
          renderSignatureStudio(container);
          showToast('Imported company profile and identity data.');
        },
      }),
    ]),
  ]);

  const leftControlsCol = h('div.stack', { style: 'gap: var(--space-4);' });
  const rightPreviewCol = h('div.sig-preview-pane');

  const studioGrid = h('div.signature-studio-grid', {}, [leftControlsCol, rightPreviewCol]);
  const page = h('div.page', {}, [h('div.page-inner', {}, [header, studioGrid])]);
  container.append(page);

  // Debounced disk-save so signatureSession survives app restarts
  let _savePending = null;
  function scheduleSave() {
    if (_savePending) clearTimeout(_savePending);
    _savePending = setTimeout(async () => {
      try { await api.settings.save({ signatureSession: { ...data } }); } catch { /* ignore */ }
    }, 800);
  }

  // Helper to re-render preview
  function updatePreview() {
    updateSignatureSession(data);
    scheduleSave();
    renderPreviewPane();
  }

  // --- SECTION 1: Template Selection ---
  function buildTemplateSection() {
    const grid = h('div.sig-template-grid');
    const cards = [];

    for (const t of TEMPLATES) {
      const isCur = t.id === data.templateId;
      const card = h('div.sig-template-card', {
        class: isCur ? 'is-active' : '',
        on: {
          click: () => {
            data.templateId = t.id;
            for (const c of cards) c.classList.toggle('is-active', c._id === t.id);
            updatePreview();
          },
        },
      }, [
        h('div.text-body-strong', { text: t.name }),
        h('div.text-caption.text-dim', { text: t.desc }),
      ]);
      card._id = t.id;
      cards.push(card);
      grid.append(card);
    }

    return h('div.card.card-pad.stack', {}, [
      h('h3.text-title', { text: '1. Choose Signature Layout' }),
      grid,
    ]);
  }

  // --- SECTION 2: Accent Color & Styling ---
  function buildStylingSection() {
    const swatches = h('div.sig-accent-picker');
    const dotEls = [];

    for (const c of ACCENT_COLORS) {
      const isCur = c.id === data.accentColor;
      const dot = h('button.sig-accent-dot', {
        class: isCur ? 'is-active' : '',
        style: `background-color: ${c.id};`,
        title: c.label,
        on: {
          click: () => {
            data.accentColor = c.id;
            for (const d of dotEls) d.classList.toggle('is-active', d._color === c.id);
            updatePreview();
          },
        },
      });
      dot._color = c.id;
      dotEls.push(dot);
      swatches.append(dot);
    }

    const shapeToggle = h('div.row', { style: 'gap: 8px;' }, [
      button({
        label: 'Circular Logo',
        size: 'sm',
        variant: data.avatarShape === 'round' ? 'primary' : 'subtle',
        onClick: () => {
          data.avatarShape = 'round';
          updatePreview();
        },
      }),
      button({
        label: 'Square / Logo',
        size: 'sm',
        variant: data.avatarShape === 'square' ? 'primary' : 'subtle',
        onClick: () => {
          data.avatarShape = 'square';
          updatePreview();
        },
      }),
    ]);

    return h('div.card.card-pad.stack', {}, [
      h('h3.text-title', { text: '2. Accent Color & Image Shape' }),
      h('div.row-between', {}, [
        h('span.text-caption', { text: 'Accent color:' }),
        swatches,
      ]),
      h('div.row-between', {}, [
        h('span.text-caption', { text: 'Avatar/Logo shape:' }),
        shapeToggle,
      ]),
    ]);
  }

  // --- SECTION 3: Identity & Contact Fields ---
  function buildFieldsSection() {
    const nameF = textField({ label: 'Full name', value: data.fullName, placeholder: 'Jordan Rivera', onInput: (v) => { data.fullName = v; updatePreview(); } });
    const titleF = textField({ label: 'Designation / Title', value: data.designation, placeholder: 'VP of Growth', onInput: (v) => { data.designation = v; updatePreview(); } });
    const compF = textField({ label: 'Company name', value: data.companyName, placeholder: 'Acme Corp', onInput: (v) => { data.companyName = v; updatePreview(); } });
    const deptF = textField({ label: 'Department', optional: true, value: data.department, placeholder: 'Sales & BD', onInput: (v) => { data.department = v; updatePreview(); } });

    const emailF = textField({ label: 'Email address', optional: true, value: data.email, placeholder: 'jordan@acme.com', onInput: (v) => { data.email = v; updatePreview(); } });
    const phoneF = textField({ label: 'Phone number', optional: true, value: data.phone, placeholder: '+1 (555) 019-2834', onInput: (v) => { data.phone = v; updatePreview(); } });
    const webF = textField({ label: 'Website URL', optional: true, value: data.companyWebsite, placeholder: 'acme.com', onInput: (v) => { data.companyWebsite = v; updatePreview(); } });
    const logoF = textField({ label: 'Logo / Headshot Image URL', optional: true, value: data.logoUrl, placeholder: 'https://example.com/photo.jpg or data:image', onInput: (v) => { data.logoUrl = v; updatePreview(); } });

    return h('div.card.card-pad.stack', {}, [
      h('h3.text-title', { text: '3. Identity & Contact Details' }),
      h('div.grid-2', {}, [nameF.el, titleF.el]),
      h('div.grid-2', {}, [compF.el, deptF.el]),
      h('div.grid-2', {}, [emailF.el, phoneF.el]),
      h('div.grid-2', {}, [webF.el, logoF.el]),
    ]);
  }

  // --- SECTION 4: Booking Link & Socials ---
  function buildCtaSocialSection() {
    const bookTextF = textField({ label: 'CTA Button Label', value: data.bookingText, placeholder: 'Book a 15-min call', onInput: (v) => { data.bookingText = v; updatePreview(); } });
    const bookUrlF = textField({ label: 'Booking URL (Calendly/Cal.com)', optional: true, value: data.bookingUrl, placeholder: 'https://calendly.com/your-name/15min', onInput: (v) => { data.bookingUrl = v; updatePreview(); } });
    const linkedinF = textField({ label: 'LinkedIn Profile URL', optional: true, value: data.linkedinUrl, placeholder: 'https://linkedin.com/in/jordan', onInput: (v) => { data.linkedinUrl = v; updatePreview(); } });
    const twitterF = textField({ label: 'Twitter/X Profile URL', optional: true, value: data.twitterUrl, placeholder: 'https://x.com/jordan', onInput: (v) => { data.twitterUrl = v; updatePreview(); } });
    const disclaimerF = textareaField({
      label: 'Optional Disclaimer / Environmental Note',
      optional: true,
      value: data.disclaimer,
      rows: 2,
      placeholder: 'This email is confidential and intended solely for the addressee.',
      onInput: (v) => { data.disclaimer = v; updatePreview(); },
    });

    return h('div.card.card-pad.stack', {}, [
      h('h3.text-title', { text: '4. Call to Action & Socials' }),
      h('div.grid-2', {}, [bookTextF.el, bookUrlF.el]),
      h('div.grid-2', {}, [linkedinF.el, twitterF.el]),
      disclaimerF.el,
    ]);
  }

  leftControlsCol.append(
    buildTemplateSection(),
    buildStylingSection(),
    buildFieldsSection(),
    buildCtaSocialSection()
  );

  // --- RIGHT COLUMN: Live WYSIWYG Preview & Copy Actions ---
  function renderPreviewPane() {
    clear(rightPreviewCol);

    const isDarkBg = data.themeBg === 'dark';
    const rawHtml = buildSignatureHtml(data, isDarkBg);
    const plainText = buildSignaturePlainText(data);

    // Background toggle (Light vs Dark email client preview)
    const bgSwitch = h('div.view-mode-bar', {}, [
      h('button.view-mode-btn', {
        class: data.themeBg === 'light' ? 'is-active' : '',
        text: 'Light Email',
        on: {
          click: () => {
            data.themeBg = 'light';
            renderPreviewPane();
          },
        },
      }),
      h('button.view-mode-btn', {
        class: data.themeBg === 'dark' ? 'is-active' : '',
        text: 'Dark Email',
        on: {
          click: () => {
            data.themeBg = 'dark';
            renderPreviewPane();
          },
        },
      }),
    ]);

    // Simulated email message
    const mockWindow = h('div.sig-mock-window', {}, [
      h('div.sig-mock-header', {}, [
        h('div.sig-mock-dots', {}, [
          h('div.sig-mock-dot'),
          h('div.sig-mock-dot'),
          h('div.sig-mock-dot'),
        ]),
        h('span.text-mono-caption.text-dim', { text: 'Recipient Inbox Mockup' }),
        bgSwitch,
      ]),
      h('div.sig-mock-subject', {}, [
        h('div', { text: `To: Alex Rivera <alex@prospect.com>` }),
        h('div', { text: `Subject: Quick question on automation` }),
      ]),
      h('div.sig-mock-content', { class: isDarkBg ? 'sig-bg-dark' : 'sig-bg-light' }, [
        h('div.sig-mock-sample-text', {
          text: `Hi Alex,\n\nThought this case study on reducing fulfillment bottlenecks might be relevant for your team. Would love to share the framework if you're open to it.\n\nBest regards,`,
        }),
        h('div.rendered-signature', { html: rawHtml }),
      ]),
    ]);

    // Action 1: Copy Formatted for Gmail/Outlook
    const copyFormattedBtn = button({
      label: 'Copy for Gmail / Outlook (Rich)',
      icon: 'copy',
      variant: 'primary',
      onClick: async () => {
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({
              'text/html': new Blob([rawHtml], { type: 'text/html' }),
              'text/plain': new Blob([plainText], { type: 'text/plain' }),
            });
            await navigator.clipboard.write([item]);
          } else {
            await api.system.copyToClipboard(rawHtml);
          }
          showToast('Formatted signature copied! Paste directly into Gmail/Outlook Settings.');
        } catch {
          await api.system.copyToClipboard(rawHtml);
          showToast('Copied to clipboard.');
        }
      },
    });

    // Action 2: Copy Raw HTML
    const copyHtmlBtn = button({
      label: 'Copy HTML Source',
      icon: 'fileText',
      size: 'sm',
      onClick: async () => {
        await api.system.copyToClipboard(rawHtml);
        showToast('Raw HTML code copied to clipboard.');
      },
    });

    // Action 3: Save to Primary User Identity in Settings
    const applyToProfileBtn = button({
      label: 'Apply to Primary Profile',
      icon: 'user',
      size: 'sm',
      onClick: async () => {
        const currentUser = settings?.user || {};
        currentUser.signature = plainText;
        const res = await api.settings.save({ user: currentUser });
        if (res?.ok) {
          setAppState({ settings: res.state });
          showToast('Updated Primary Identity signature in Settings!');
        } else {
          showToast(res?.error || 'Could not save signature.', { tone: 'error' });
        }
      },
    });

    // Action 4: Save to Sender Profile (if profiles exist)
    const profiles = settings?.senderProfiles || [];
    let saveToPersonaBtn = null;
    if (profiles.length > 0) {
      saveToPersonaBtn = button({
        label: 'Save to Persona…',
        size: 'sm',
        onClick: () => {
          const list = h('div.stack', { style: 'gap: 8px;' });
          let closeModal;

          for (const p of profiles) {
            list.append(
              button({
                label: `Save into: ${p.name} (${p.fullName})`,
                size: 'sm',
                onClick: async () => {
                  p.signature = plainText;
                  const res = await api.settings.save({ senderProfiles: profiles });
                  if (res?.ok) {
                    setAppState({ settings: res.state });
                    closeModal();
                    showToast(`Saved signature to "${p.name}".`);
                  }
                },
              })
            );
          }

          const cancel = h('button.btn.btn-outline', { text: 'Cancel', on: { click: () => closeModal() } });
          closeModal = openModal({
            title: 'Choose Persona to update signature',
            body: list,
            actions: [cancel],
          });
        },
      });
    }

    const actionCard = h('div.card.card-pad.stack', {}, [
      h('div.row-between', {}, [
        h('h3.text-title', { text: 'Export & Integration' }),
        h('span.badge', { text: 'Email Client Ready' }),
      ]),
      h('p.text-caption.text-dim', {
        text: 'Paste directly into Gmail (Settings > Signature), Outlook, Apple Mail, or save to your WishReach profile.',
      }),
      copyFormattedBtn,
      h('div.row', { style: 'gap: 8px; flex-wrap: wrap;' }, [
        copyHtmlBtn,
        applyToProfileBtn,
        saveToPersonaBtn,
      ].filter(Boolean)),
    ]);

    rightPreviewCol.append(mockWindow, actionCard);
  }

  renderPreviewPane();
}
