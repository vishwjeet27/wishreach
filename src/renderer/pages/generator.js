/**
 * @file Generator page: multi-language, multi-angle A/B variants,
 * real-time streaming visualizer, one-click copy polish actions, icebreakers,
 * persistent session state across tab switches, full sequence saving, and direct email client opening.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from '../components/icons.js';
import { textField, textareaField, selectField } from '../components/textarea.js';
import { button } from '../components/button.js';
import { api } from '../js/api.js';
import { firstError } from '../js/validators.js';
import { showToast } from '../components/toast.js';
import { getAppState, updateGeneratorSession, resetGeneratorSession } from '../js/state.js';
import { navigate } from '../js/router.js';
import { openModal } from '../components/modal.js';
import { CONTENT_FIELDS } from '../../shared/contentFields.js';
import { LANGUAGES, STRATEGY_VARIANTS, POLISH_ACTIONS } from '../../main/ai/providers.js';

const TONE_OPTIONS = ['Professional', 'Executive', 'Friendly', 'Consultative', 'Premium'].map((t) => ({ value: t, label: t }));
const GOAL_OPTIONS = ['Cold Outreach', 'Follow-up', 'Partnership', 'Discovery Call', 'Proposal'].map((g) => ({ value: g, label: g }));
const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l.id, label: l.label }));

/**
 * Extracts a sensible email subject line from the generated subjectLines or fallback.
 * @param {string} rawSubjectLines
 * @param {string} companyName
 * @param {string} clientCompany
 * @returns {string}
 */
function extractSubject(rawSubjectLines, companyName, clientCompany) {
  if (rawSubjectLines) {
    const firstLine = rawSubjectLines.split('\n').map((s) => s.trim().replace(/^["'\d\.\-\s]+/, '').replace(/["']+$/, '')).filter(Boolean)[0];
    if (firstLine) return firstLine;
  }
  return clientCompany ? `${clientCompany} x ${companyName || 'Partnership'}` : 'Quick question';
}

/** @param {HTMLElement} container */
export function renderGenerator(container) {
  const { settings, generatorSession } = getAppState();
  const notReady = !settings?.company?.name || !settings?.user?.fullName;
  const activeProvider = settings?.ai?.provider || 'groq';
  const hasKey = activeProvider === 'ollama' || Boolean(settings?.ai?.keys?.[activeProvider] || (activeProvider === 'groq' && settings?.groq?.hasKey));
  const noKey = !hasKey;

  // Use persistent session state so tab switches never lose input or generated content
  const client = generatorSession.client;
  const variantsContent = generatorSession.variantsContent;
  let currentVariantId = generatorSession.currentVariantId || 'A';
  let activeTab = generatorSession.activeTab || CONTENT_FIELDS[0].key;
  let emailViewMode = 'edit'; // 'edit' or 'preview'

  // Set default sender profile if not set
  if (!client.senderProfileId && settings?.activeSenderProfileId) {
    client.senderProfileId = settings.activeSenderProfileId;
  }

  let renderOutput;
  let submit;

  const loadLeadBtn = button({
    label: 'Load from CRM',
    icon: 'users',
    size: 'sm',
    onClick: async () => {
      let leads = [];
      try {
        leads = await api.leads.list();
      } catch {
        leads = [];
      }
      if (!leads.length) {
        return showToast('No saved leads in CRM yet. Save a lead first or add one in Leads CRM.', { tone: 'error' });
      }

      const listContainer = h('div.stack', { style: 'max-height: 400px; overflow-y: auto; gap: 8px;' });
      let close;

      for (const lead of leads) {
        const card = h('div.profile-card', {
          style: 'cursor: pointer;',
          on: {
            click: () => {
              client.clientName = lead.name;
              client.clientCompany = lead.company;
              client.clientDesignation = lead.role || '';
              client.clientWebsite = lead.website || '';
              client.targetCountry = lead.country || client.targetCountry;
              client.industry = lead.industry || client.industry;
              client.requirements = lead.requirements || client.requirements;
              updateGeneratorSession({ client });
              close();
              clear(container);
              renderGenerator(container);
              showToast(`Loaded ${lead.name} (${lead.company}).`);
            },
          },
        }, [
          h('div.stack', { style: 'gap: 2px;' }, [
            h('span.text-body-strong', { text: `${lead.name} · ${lead.company}` }),
            h('span.text-caption.text-dim', { text: [lead.role, lead.industry, lead.country].filter(Boolean).join(' • ') || 'No details' }),
          ]),
          h('span.badge', { text: lead.status || 'New' }),
        ]);
        listContainer.append(card);
      }

      const cancelBtn = h('button.btn.btn-outline', { text: 'Cancel', on: { click: () => close() } });
      close = openModal({
        title: 'Select a Lead to generate sequence',
        body: listContainer,
        actions: [cancelBtn],
        size: 'lg',
      });
    },
  });

  const saveLeadBtn = button({
    label: 'Save as Lead',
    icon: 'user',
    size: 'sm',
    onClick: async () => {
      const err = firstError([
        { value: client.clientName, label: 'Client name', required: true },
        { value: client.clientCompany, label: 'Client company', required: true },
      ]);
      if (err) return showToast(err, { tone: 'error' });

      try {
        await api.leads.save({
          name: client.clientName,
          company: client.clientCompany,
          role: client.clientDesignation,
          website: client.clientWebsite,
          country: client.targetCountry,
          industry: client.industry,
          requirements: client.requirements,
          status: 'New',
        });
        showToast(`Saved "${client.clientName} (${client.clientCompany})" to Leads CRM!`);
      } catch (e) {
        showToast(e.message, { tone: 'error' });
      }
    },
  });

  const header = h('div.page-header', {}, [
    h('div.page-header-text', {}, [
      h('h1', { text: 'Generate outreach' }),
      h('p', { text: 'Create high-converting, personalized cold sequences with live streaming, A/B angles, and email integrations.' }),
    ]),
    h('div.row', {}, [
      button({
        label: 'Attach Screenshot',
        icon: 'image',
        size: 'sm',
        onClick: () => triggerImageExtract(),
      }),
      loadLeadBtn,
      saveLeadBtn,
      button({
        label: 'Clear form',
        icon: 'refresh',
        size: 'sm',
        onClick: () => {
          resetGeneratorSession();
          clear(container);
          renderGenerator(container);
          showToast('Form cleared.');
        },
      }),
    ]),
  ]);

  // ---- Image Intelligence Drop Zone & Clipboard Paste ----
  const imageZone = h('div.image-intel-zone', {
    on: {
      click: (e) => {
        if (e.target.closest('button')) return;
        triggerImageExtract();
      },
      dragover: (e) => {
        e.preventDefault();
        imageZone.classList.add('is-drag-over');
      },
      dragleave: () => imageZone.classList.remove('is-drag-over'),
      drop: (e) => {
        e.preventDefault();
        imageZone.classList.remove('is-drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
          processImageFile(file);
        } else {
          showToast('Please drop an image file (PNG, JPG, WebP).', { tone: 'error' });
        }
      },
    },
  }, [
    h('div.image-intel-inner', {}, [
      h('div.image-intel-icon-box', {}, [
        h('span', { html: iconMarkup('image', 22) }),
      ]),
      h('p.text-body-strong', { text: 'Upload or drop a lead screenshot' }),
      h('p.text-caption.text-dim', {
        text: 'Attach a LinkedIn post, profile, or Job Description screenshot (or press Ctrl+V to paste). AI will auto-extract lead details.',
      }),
      h('div.row', { style: 'margin-top: 4px; gap: 8px;' }, [
        button({
          label: 'Browse screenshot',
          icon: 'image',
          size: 'sm',
          onClick: () => triggerImageExtract(),
        }),
      ]),
    ]),
  ]);

  // Global paste listener for Ctrl+V image screenshots
  const onGlobalPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processImageFile(file);
          break;
        }
      }
    }
  };
  if (window.__wishreach_image_paste_handler) {
    window.removeEventListener('paste', window.__wishreach_image_paste_handler);
  }
  window.__wishreach_image_paste_handler = onGlobalPaste;
  window.addEventListener('paste', onGlobalPaste);

  async function prepareImagePayload(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => {
          const dataUrl = reader.result;
          const [header, base64] = dataUrl.split(',');
          const mime = header.match(/:(.*?);/)?.[1] || file.type || 'image/png';
          resolve({ imageBase64: base64, mimeType: mime });
        };
        img.onload = () => {
          const maxDim = 1600;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mime, 0.9);
          const base64 = dataUrl.split(',')[1];
          resolve({ imageBase64: base64, mimeType: mime });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function processImageFile(file) {
    const loadingCard = h('div.card.card-pad.row', {
      style: 'gap: 12px; align-items: center; margin-bottom: var(--space-4); border: 1px solid var(--border-strong);',
    }, [
      h('span', { html: iconMarkup('loader', 18) }),
      h('div.stack', { style: 'gap: 2px;' }, [
        h('span.text-body-strong', { text: 'Analyzing screenshot with AI...' }),
        h('span.text-caption.text-dim', { text: 'Extracting lead name, company, role, requirements & context...' }),
      ]),
    ]);
    formCard.before(loadingCard);

    try {
      const { imageBase64, mimeType } = await prepareImagePayload(file);
      const res = await api.ai.extractFromImage({ imageBase64, mimeType });

      loadingCard.remove();

      if (!res?.ok) {
        showToast(res?.error || 'Image extraction failed.', { tone: 'error' });
        return;
      }

      // Show extracted data preview card with confirm/edit
      const d = res.data;
      const detectedFields = [
        d.name && { label: 'Name', val: d.name },
        d.company && { label: 'Company', val: d.company },
        d.designation && { label: 'Designation / Role', val: d.designation },
        d.industry && { label: 'Industry', val: d.industry },
        d.country && { label: 'Location / Country', val: d.country },
        d.website && { label: 'Website', val: d.website },
      ].filter(Boolean);

      const fieldElements = detectedFields.map((f) =>
        h('div.image-intel-field-item', {}, [
          h('span.image-intel-field-label', { text: f.label }),
          h('span.image-intel-field-val', { text: f.val }),
        ])
      );

      const previewCard = h('div.image-intel-preview.stack', { style: 'gap: var(--space-4);' }, [
        h('div.row-between', {}, [
          h('div.row', { style: 'gap: 8px;' }, [
            h('span', { html: iconMarkup('sparkles', 18) }),
            h('h3.text-title', { text: 'Extracted Lead Intelligence' }),
          ]),
          h('div.row', { style: 'gap: 6px;' }, [
            h('span.badge', { text: `${detectedFields.length} fields detected` }),
            res.providerUsed ? h('span.badge', { text: res.providerUsed.toUpperCase() }) : null,
          ]),
        ]),

        fieldElements.length > 0
          ? h('div.image-intel-field-grid', {}, fieldElements)
          : h('p.text-caption.text-dim', { text: 'No primary profile fields detected. Check the context below.' }),

        d.requirements
          ? h('div.stack', { style: 'gap: 4px;' }, [
              h('span.text-caption.text-dim', { text: 'Context & Job Requirements:' }),
              h('div.image-intel-context-box', { text: d.requirements }),
            ])
          : null,

        h('div.row', { style: 'gap: 8px; flex-wrap: wrap;' }, [
          button({
            label: 'Fill form with this data',
            variant: 'primary',
            icon: 'check',
            size: 'sm',
            onClick: () => {
              applyExtractedData(d);
              previewCard.remove();
              showToast('Form auto-filled from screenshot!');
            },
          }),
          button({
            label: 'Fill & Generate now',
            icon: 'send',
            size: 'sm',
            onClick: () => {
              applyExtractedData(d);
              previewCard.remove();
              showToast('Form filled! Starting generation...');
              if (typeof submit === 'function') {
                submit('A');
              }
            },
          }),
          button({
            label: 'Dismiss',
            icon: 'x',
            size: 'sm',
            onClick: () => previewCard.remove(),
          }),
        ]),
      ]);

      formCard.before(previewCard);
      previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      loadingCard.remove();
      showToast(`Error: ${err.message}`, { tone: 'error' });
    }
  }

  function applyExtractedData(d) {
    if (d.name) client.clientName = d.name;
    if (d.company) client.clientCompany = d.company;
    if (d.designation) client.clientDesignation = d.designation;
    if (d.website) client.clientWebsite = d.website;
    if (d.industry) client.industry = d.industry;
    if (d.country) client.targetCountry = d.country;
    if (d.requirements) {
      client.requirements = client.requirements ? `${client.requirements}\n\n${d.requirements}` : d.requirements;
    }
    updateGeneratorSession({ client });
    clear(formCard);
    buildForm();
  }

  function triggerImageExtract() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) processImageFile(file);
    };
    input.click();
  }

  const formCard = h('div.card.card-pad');
  const outputArea = h('div');
  const page = h('div.page', {}, [h('div.page-inner', {}, [header, notReady || noKey ? setupNotice() : null, imageZone, formCard, outputArea])]);
  container.append(page);

  if (notReady) return;

  buildForm();

  // If content was already generated in this session, render it immediately
  if (variantsContent[currentVariantId]) {
    renderOutput();
  }

  function setupNotice() {
    const message = notReady
      ? 'Finish your company profile in Settings before generating content.'
      : `Add an API key for ${activeProvider.toUpperCase()} in Settings to enable generation.`;
    return h('div.card.card-pad.row-between', {}, [
      h('div.row', {}, [h('span', { html: iconMarkup('key', 18) }), h('span.text-body-strong', { text: message })]),
      button({ label: 'Open Settings', variant: 'primary', onClick: () => navigate('/settings') }),
    ]);
  }

  function buildForm() {
    const name = textField({
      label: 'Client name',
      value: client.clientName,
      placeholder: 'Jordan Lee',
      onInput: (v) => {
        client.clientName = v;
        updateGeneratorSession({ client });
      },
    });

    const company = textField({
      label: 'Client company',
      value: client.clientCompany,
      placeholder: 'Northwind Robotics',
      onInput: (v) => {
        client.clientCompany = v;
        updateGeneratorSession({ client });
      },
    });

    const designation = textField({
      label: 'Client designation',
      optional: true,
      value: client.clientDesignation,
      placeholder: 'VP of Engineering',
      onInput: (v) => {
        client.clientDesignation = v;
        updateGeneratorSession({ client });
      },
    });

    const website = textField({
      label: 'Client website',
      optional: true,
      value: client.clientWebsite,
      placeholder: 'northwindrobotics.com',
      onInput: (v) => {
        client.clientWebsite = v;
        updateGeneratorSession({ client });
      },
    });

    const country = textField({
      label: 'Target country',
      value: client.targetCountry,
      placeholder: 'United States',
      onInput: (v) => {
        client.targetCountry = v;
        updateGeneratorSession({ client });
      },
    });

    const industry = textField({
      label: 'Industry',
      optional: true,
      value: client.industry,
      placeholder: 'Industrial automation',
      onInput: (v) => {
        client.industry = v;
        updateGeneratorSession({ client });
      },
    });

    const requirements = textareaField({
      label: 'Client requirements / notes',
      value: client.requirements,
      placeholder: 'Looking for an MVP in Next.js with AI chatbot integration. Interested in cutting development time.',
      rows: 4,
      showCount: true,
      maxLength: 4000,
      onInput: (v) => {
        client.requirements = v;
        updateGeneratorSession({ client });
      },
    });

    const tone = selectField({
      label: 'Tone',
      value: client.tone,
      options: TONE_OPTIONS,
      onChange: (v) => {
        client.tone = v;
        updateGeneratorSession({ client });
      },
    });

    const goal = selectField({
      label: 'Goal',
      value: client.goal,
      options: GOAL_OPTIONS,
      onChange: (v) => {
        client.goal = v;
        updateGeneratorSession({ client });
      },
    });

    const language = selectField({
      label: 'Language',
      value: client.language || 'English (US)',
      options: LANGUAGE_OPTIONS,
      onChange: (v) => {
        client.language = v;
        updateGeneratorSession({ client });
      },
    });

    // Sender profile selector if senderProfiles exist
    const profiles = settings?.senderProfiles || [];
    let senderProfileEl = null;
    if (profiles.length > 0) {
      const profileOpts = [
        { value: '', label: `Primary: ${settings?.user?.fullName || 'Default'} (${settings?.user?.designation || ''})` },
        ...profiles.map((p) => ({ value: p.id, label: `${p.name}: ${p.fullName} (${p.designation})` })),
      ];
      senderProfileEl = selectField({
        label: 'Sender Identity / Profile',
        value: client.senderProfileId || '',
        options: profileOpts,
        onChange: (v) => {
          client.senderProfileId = v;
          updateGeneratorSession({ client });
        },
      }).el;
    }

    const generateBtn = button({ label: 'Generate sequence', icon: 'send', variant: 'primary', onClick: () => submit() });

    formCard.append(
      h('div.stack', {}, [
        h('div.grid-2', {}, [name.el, company.el]),
        h('div.grid-2', {}, [designation.el, website.el]),
        h('div.grid-2', {}, [country.el, industry.el]),
        requirements.el,
        h('div.grid-2', {}, [tone.el, goal.el]),
        h('div.grid-2', {}, [language.el, senderProfileEl || h('div')]),
        h('div', { style: 'display:flex; justify-content:flex-end; gap: 8px;' }, [generateBtn]),
      ])
    );

    submit = async function submit(targetVariant = 'A') {
      if (notReady || noKey) return navigate('/settings');
      const error = firstError([
        { value: client.clientName, label: 'Client name', required: true },
        { value: client.clientCompany, label: 'Client company', required: true },
        { value: client.targetCountry, label: 'Target country', required: true },
        { value: client.requirements, label: 'Requirements', required: true },
        { value: client.clientWebsite, label: 'Client website', url: true },
      ]);
      if (error) return showToast(error, { tone: 'error' });

      currentVariantId = targetVariant;
      updateGeneratorSession({ currentVariantId });

      const matchedVariant = STRATEGY_VARIANTS.find((v) => v.id === targetVariant) || STRATEGY_VARIANTS[0];
      client.strategy = `${matchedVariant.name}: ${matchedVariant.label} - ${matchedVariant.description}`;

      generateBtn.disabled = true;
      generateBtn.textContent = '';
      generateBtn.append(h('span', { html: iconMarkup('loader', 16) }), h('span', { text: `Generating ${matchedVariant.name}…` }));

      clear(outputArea);

      // Streaming Visualizer Box
      const streamText = h('span', { text: '' });
      const streamBox = h('div.stream-box', {}, [
        streamText,
        h('span.stream-cursor'),
      ]);

      const streamCard = h('div.card.card-pad', {}, [
        h('div.row-between', { style: 'margin-bottom: 12px;' }, [
          h('div.row', {}, [
            h('span.badge', { text: `Live Streaming: ${matchedVariant.name} (${matchedVariant.label})` }),
          ]),
          h('span.text-caption.text-dim', { text: `Target Language: ${client.language}` }),
        ]),
        h('div.progress-line', { style: 'margin-bottom: 16px;' }),
        streamBox,
      ]);

      outputArea.append(streamCard);

      const cleanupChunk = api.ai.onStreamChunk((data) => {
        if (data?.token) {
          streamText.textContent += data.token;
          streamBox.scrollTop = streamBox.scrollHeight;
        }
      });

      try {
        const result = await api.ai.generate(client);
        variantsContent[targetVariant] = result.content;
        updateGeneratorSession({ variantsContent, currentVariantId: targetVariant });
        activeTab = CONTENT_FIELDS[0].key;
        renderOutput();
        showToast(`${matchedVariant.name} generated successfully.`);
      } catch (err) {
        clear(outputArea);
        showToast(err.message, { tone: 'error' });
      } finally {
        cleanupChunk();
        generateBtn.disabled = false;
        clear(generateBtn);
        generateBtn.append(h('span', { html: iconMarkup('send', 16) }), h('span', { text: 'Generate sequence' }));
      }
    }

    renderOutput = function renderOutput() {
      clear(outputArea);
      const activeContent = variantsContent[currentVariantId];
      if (!activeContent) return;

      // 1. Variant Strategy Selector Bar (A/B testing)
      const variantBar = h('div.variant-bar');
      for (const variant of STRATEGY_VARIANTS) {
        const isCurrent = variant.id === currentVariantId;
        const isGenerated = Boolean(variantsContent[variant.id]);

        const btn = h('button.variant-btn', {
          class: isCurrent ? 'is-active' : '',
          on: {
            click: () => {
              if (variantsContent[variant.id]) {
                currentVariantId = variant.id;
                updateGeneratorSession({ currentVariantId: variant.id });
                renderOutput();
              } else {
                submit(variant.id);
              }
            },
          },
        }, [
          h('span.v-title', { text: `${variant.name}: ${variant.label}${isGenerated ? ' (done)' : ''}` }),
          h('span.v-desc', { text: isGenerated ? variant.description : 'Click to generate this angle' }),
        ]);
        variantBar.append(btn);
      }

      // 2. Tabs Row
      const tabsRow = h('div.tabs');
      const tabEls = new Map();
      for (const field of CONTENT_FIELDS) {
        const tabEl = h(`button.tab`, {
          text: field.label,
          on: {
            click: () => {
              activeTab = field.key;
              updateGeneratorSession({ activeTab: field.key });
              syncTabs();
              renderBody();
            },
          },
        });
        tabEls.set(field.key, tabEl);
        tabsRow.append(tabEl);
      }
      function syncTabs() {
        for (const [key, el] of tabEls) el.classList.toggle('is-active', key === activeTab);
      }
      syncTabs();

      // 3. Body Content Area
      const bodyWrap = h('div.card.card-pad');

      function renderBody() {
        clear(bodyWrap);
        const field = CONTENT_FIELDS.find((f) => f.key === activeTab);
        const value = activeContent[activeTab] || '';

        // If field is icebreakers, render specialized hook cards
        if (activeTab === 'icebreakers') {
          renderIcebreakersView(bodyWrap, field, value);
          return;
        }

        const textarea = h('textarea.textarea.output-textarea', { value });
        textarea.addEventListener('input', () => {
          activeContent[activeTab] = textarea.value;
          updateGeneratorSession({ variantsContent });
        });

        // Determine active sender identity
        let activeSenderName = settings?.user?.fullName || 'Outreach Specialist';
        let activeSenderTitle = settings?.user?.designation || '';
        let activeSenderSig = settings?.user?.signature || '';
        if (client.senderProfileId && Array.isArray(settings?.senderProfiles)) {
          const prof = settings.senderProfiles.find((p) => p.id === client.senderProfileId);
          if (prof) {
            activeSenderName = prof.fullName || activeSenderName;
            activeSenderTitle = prof.designation || activeSenderTitle;
            activeSenderSig = prof.signature || activeSenderSig;
          }
        }

        const copyBtn = button({
          label: 'Copy text',
          icon: 'copy',
          size: 'sm',
          onClick: async () => {
            await api.system.copyToClipboard(textarea.value);
            showToast('Copied text to clipboard.');
          },
        });

        const copyHtmlBtn = button({
          label: 'Copy formatted HTML',
          icon: 'copy',
          size: 'sm',
          onClick: async () => {
            try {
              const paragraphs = textarea.value
                .split('\n\n')
                .map((p) => `<p style="margin:0 0 14px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; line-height:1.6; color:#111;">${p.replace(/\n/g, '<br/>')}</p>`)
                .join('');
              const fullHtml = `<div>${paragraphs}</div>`;
              if (navigator.clipboard && window.ClipboardItem) {
                const item = new ClipboardItem({
                  'text/html': new Blob([fullHtml], { type: 'text/html' }),
                  'text/plain': new Blob([textarea.value], { type: 'text/plain' }),
                });
                await navigator.clipboard.write([item]);
              } else {
                await api.system.copyToClipboard(textarea.value);
              }
              showToast('Formatted HTML copied! Paste directly into Gmail or Outlook.');
            } catch {
              await api.system.copyToClipboard(textarea.value);
              showToast('Copied to clipboard.');
            }
          },
        });

        const regenBtn = button({
          label: 'Regenerate',
          icon: 'refresh',
          size: 'sm',
          onClick: () => regenerate(field.key, regenBtn, textarea),
        });

        // Save Full Campaign Button (Saves all 9 pieces together!)
        const saveAllBtn = button({
          label: 'Save campaign',
          icon: 'save',
          size: 'sm',
          variant: 'primary',
          onClick: async () => {
            try {
              const matchedVar = STRATEGY_VARIANTS.find((v) => v.id === currentVariantId);
              await api.drafts.save({
                clientName: client.clientName,
                clientCompany: client.clientCompany,
                type: `Full Sequence (${matchedVar ? matchedVar.name : 'All 9 Pieces'})`,
                content: textarea.value,
                allContent: { ...activeContent },
                goal: client.goal,
                tone: client.tone,
              });
              showToast('All 9 campaign pieces saved to History!');
            } catch (err) {
              showToast(err.message, { tone: 'error' });
            }
          },
        });

        // Export PDF Button
        const exportPdfBtn = button({
          label: 'Export PDF',
          icon: 'fileText',
          size: 'sm',
          onClick: async () => {
            try {
              const items = CONTENT_FIELDS.map((f) => ({
                label: f.label,
                content: activeContent[f.key] || '',
              })).filter((i) => Boolean(i.content && i.content.trim()));

              const matchedVar = STRATEGY_VARIANTS.find((v) => v.id === currentVariantId);
              const res = await api.drafts.exportPdf({
                title: `Outreach Sequence (${matchedVar ? matchedVar.name : 'Full Sequence'})`,
                clientName: client.clientName,
                clientCompany: client.clientCompany,
                goal: client.goal,
                tone: client.tone,
                items,
              });
              if (res?.filePath) {
                showToast(`Campaign PDF saved: ${res.filePath}`);
              }
            } catch (err) {
              showToast(err.message, { tone: 'error' });
            }
          },
        });

        // Direct Email Client Action Buttons (for email kinds)
        let emailClientActions = null;
        let viewModeBar = null;
        const subject = extractSubject(activeContent.subjectLines, settings?.company?.name, client.clientCompany);

        if (field.kind === 'email') {
          const gmailBtn = button({
            label: 'Gmail',
            size: 'sm',
            onClick: () => {
              const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(textarea.value)}`;
              window.open(url, '_blank');
              showToast('Gmail compose opened.');
            },
          });

          const outlookBtn = button({
            label: 'Outlook',
            size: 'sm',
            onClick: () => {
              const url = `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textarea.value)}`;
              window.open(url, '_blank');
              showToast('Outlook compose opened.');
            },
          });

          const mailtoBtn = button({
            label: 'Mailto',
            size: 'sm',
            onClick: () => {
              const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textarea.value)}`;
              window.open(url);
            },
          });

          emailClientActions = h('div.email-actions-menu', {}, [
            h('span.text-caption.text-dim', { text: 'Send:' }),
            gmailBtn,
            outlookBtn,
            mailtoBtn,
          ]);

          viewModeBar = h('div.view-mode-bar', {}, [
            h('button.view-mode-btn', {
              class: emailViewMode === 'edit' ? 'is-active' : '',
              html: `${iconMarkup('edit', 14)}<span>Editor</span>`,
              on: {
                click: () => {
                  emailViewMode = 'edit';
                  renderBody();
                },
              },
            }),
            h('button.view-mode-btn', {
              class: emailViewMode === 'preview' ? 'is-active' : '',
              html: `${iconMarkup('eye', 14)}<span>Recipient Mockup</span>`,
              on: {
                click: () => {
                  emailViewMode = 'preview';
                  renderBody();
                },
              },
            }),
          ]);
        }

        // One-Click Polish Strip
        const polishStrip = h('div.polish-strip', {}, [
          h('span.polish-strip-label', { text: 'Polish:' }),
        ]);

        for (const action of POLISH_ACTIONS) {
          const pBtn = h('button.polish-btn', {
            text: action.label,
            on: {
              click: async () => {
                pBtn.disabled = true;
                const originalLabel = pBtn.textContent;
                pBtn.textContent = 'Polishing…';
                try {
                  const res = await api.ai.polish({
                    text: textarea.value,
                    instruction: action.instruction,
                    language: client.language,
                  });
                  if (res?.value) {
                    textarea.value = res.value;
                    activeContent[activeTab] = res.value;
                    updateGeneratorSession({ variantsContent });
                    showToast(`Polished: ${action.label}`);
                  }
                } catch (err) {
                  showToast(err.message, { tone: 'error' });
                } finally {
                  pBtn.disabled = false;
                  pBtn.textContent = originalLabel;
                }
              },
            },
          });
          polishStrip.append(pBtn);
        }

        // Render editor or recipient email mockup
        let contentEl = textarea;
        if (field.kind === 'email' && emailViewMode === 'preview') {
          contentEl = h('div.email-mockup', {}, [
            h('div.email-mockup-header', {}, [
              h('div.email-mockup-row', {}, [
                h('span.email-mockup-label', { text: 'From:' }),
                h('span.email-mockup-val', { text: `${activeSenderName} ${activeSenderTitle ? `(${activeSenderTitle})` : ''} <${settings?.company?.email || 'outreach@domain.com'}>` }),
              ]),
              h('div.email-mockup-row', {}, [
                h('span.email-mockup-label', { text: 'To:' }),
                h('span.email-mockup-val', { text: `${client.clientName} <${client.clientCompany}>` }),
              ]),
              h('div.email-mockup-row', {}, [
                h('span.email-mockup-label', { text: 'Subject:' }),
                h('span.email-mockup-val', { text: subject }),
              ]),
            ]),
            h('div.email-mockup-body', { style: 'background: #ffffff; color: #111111;' }, [
              h('div', { text: textarea.value }),
            ]),
          ]);
        }

        bodyWrap.append(
          h('div.stack', {}, [
            // Toolbar Row 1: label + view mode toggle + word count | core actions
            h('div.output-toolbar', {}, [
              h('div.row', { style: 'gap: 8px; flex-wrap: wrap;' }, [
                h('span.category-pill', { text: field.label }),
                viewModeBar,
                h('span.text-caption.text-dim', {
                  text: `${textarea.value.split(/\s+/).filter(Boolean).length} words`,
                }),
              ]),
              h('div.row', { style: 'gap: 6px; flex-wrap: wrap;' }, [
                field.kind === 'email' ? copyHtmlBtn : copyBtn,
                regenBtn,
                saveAllBtn,
                exportPdfBtn,
              ]),
            ]),
            // Toolbar Row 2 (email only): Send to email clients
            emailClientActions
              ? h('div', { style: 'display: flex; align-items: center; gap: 6px; padding: var(--space-2) 0; border-bottom: 1px solid var(--border-hairline);' }, [emailClientActions])
              : null,
            contentEl,
            emailViewMode === 'edit' ? polishStrip : null,
          ])
        );
      }

      function renderIcebreakersView(parent, field, rawValue) {
        const hooks = rawValue
          .split('\n')
          .map((h) => h.trim())
          .filter(Boolean);

        const listWrap = h('div.stack', {}, []);

        if (hooks.length === 0) {
          listWrap.append(h('p.text-muted', { text: 'No hooks generated yet. Click Regenerate below.' }));
        } else {
          hooks.forEach((hookText, idx) => {
            const copyHookBtn = button({
              label: 'Copy Hook',
              icon: 'copy',
              size: 'sm',
              onClick: async () => {
                await api.system.copyToClipboard(hookText);
                showToast(`Hook ${idx + 1} copied!`);
              },
            });

            listWrap.append(
              h('div.hook-card', {}, [
                h('div.hook-text', { text: hookText }),
                copyHookBtn,
              ])
            );
          });
        }

        const regenBtn = button({
          label: 'Regenerate Hooks',
          icon: 'refresh',
          size: 'sm',
          onClick: () => regenerate(field.key, regenBtn, null, () => renderBody()),
        });

        const saveAllBtn = button({
          label: 'Save full campaign',
          icon: 'save',
          size: 'sm',
          variant: 'primary',
          onClick: async () => {
            try {
              const matchedVar = STRATEGY_VARIANTS.find((v) => v.id === currentVariantId);
              await api.drafts.save({
                clientName: client.clientName,
                clientCompany: client.clientCompany,
                type: `Full Sequence (${matchedVar ? matchedVar.name : 'All 9 Pieces'})`,
                content: rawValue,
                allContent: { ...activeContent },
                goal: client.goal,
                tone: client.tone,
              });
              showToast('All 9 campaign pieces saved to History!');
            } catch (err) {
              showToast(err.message, { tone: 'error' });
            }
          },
        });

        parent.append(
          h('div.stack', {}, [
            h('div.output-toolbar', {}, [
              h('span.category-pill', { text: 'Personalized Opening Hooks' }),
              h('div.row', {}, [regenBtn, saveAllBtn]),
            ]),
            listWrap,
          ])
        );
      }

      renderBody();

      outputArea.append(h('div.stack', {}, [variantBar, tabsRow, bodyWrap]));
    }

    async function regenerate(fieldKey, regenBtn, textarea, onDone) {
      regenBtn.disabled = true;
      const original = regenBtn.textContent;
      regenBtn.textContent = 'Regenerating…';
      try {
        const result = await api.ai.regenerate(client, fieldKey);
        variantsContent[currentVariantId][fieldKey] = result.value;
        updateGeneratorSession({ variantsContent });
        if (textarea) textarea.value = result.value;
        if (onDone) onDone();
        showToast('Regenerated.');
      } catch (err) {
        showToast(err.message, { tone: 'error' });
      } finally {
        regenBtn.disabled = false;
        regenBtn.textContent = original;
      }
    }
  }
}
