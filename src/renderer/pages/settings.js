/**
 * @file Settings page. Everything collected during onboarding can be
 * edited here, plus Groq key management and configuration import/export.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from '../components/icons.js';
import { textField, textareaField, selectField } from '../components/textarea.js';
import { button } from '../components/button.js';
import { api } from '../js/api.js';
import { getAppState, setAppState } from '../js/state.js';
import { firstError } from '../js/validators.js';
import { showToast } from '../components/toast.js';
import { confirmModal, openModal } from '../components/modal.js';
import { navigate } from '../js/router.js';
import { avatarEl, avatarPicker } from '../components/avatar.js';
import { openAboutModal } from '../components/aboutModal.js';

/** @param {HTMLElement} container */
export async function renderSettings(container) {
  const settings = await api.settings.get();
  setAppState({ settings });
  const models = await api.groq.listModels();

  const company = { ...settings.company };
  const user = { ...settings.user };
  let senderProfiles = Array.isArray(settings.senderProfiles) ? [...settings.senderProfiles] : [];
  let activeSenderProfileId = settings.activeSenderProfileId || '';
  let servicesText = (settings.services || []).join('\n');
  let model = settings.groq.model;

  const header = h('div.page-header', {}, [
    h('div.page-header-text', {}, [
      h('h1', { text: 'Settings' }),
      h('p', { text: 'This identity is injected into every piece of generated content.' }),
    ]),
  ]);

  const page = h('div.page', {}, [
    h('div.page-inner', {}, [
      header,
      companySection(),
      servicesSection(),
      identitySection(),
      await aiProviderSection(),
      themeSection(),
      dataSection(),
      openSourceSection(),
    ]),
  ]);
  container.append(page);

  function sectionCard(title, description, bodyEl, saveBtn) {
    return h('div.card.card-pad.stack', {}, [
      h('div.row-between', {}, [
        h('div', {}, [h('h3.text-title', { text: title }), h('p.text-caption', { text: description })]),
        saveBtn,
      ]),
      h('hr.divider'),
      bodyEl,
    ]);
  }

  function companySection() {
    const logoPreview = h('div.logo-preview', { html: company.logo ? '' : iconMarkup('building', 22) });
    if (company.logo) logoPreview.append(h('img', { src: company.logo, alt: '' }));

    const uploadBtn = button({
      label: 'Replace logo', icon: 'upload', size: 'sm',
      onClick: async () => {
        const result = await api.system.pickLogoImage();
        if (result?.dataUri) {
          company.logo = result.dataUri;
          clear(logoPreview);
          logoPreview.append(h('img', { src: result.dataUri, alt: '' }));
        } else if (result?.error) {
          showToast(result.error, { tone: 'error' });
        }
      },
    });

    const name = textField({ label: 'Company name', value: company.name, onInput: (v) => (company.name = v) });
    const website = textField({ label: 'Website', value: company.website, optional: true, onInput: (v) => (company.website = v) });
    const email = textField({ label: 'Email', value: company.email, optional: true, type: 'email', onInput: (v) => (company.email = v) });
    const phone = textField({ label: 'Contact number', value: company.phone, optional: true, onInput: (v) => (company.phone = v) });
    const linkedin = textField({ label: 'LinkedIn URL', value: company.linkedin, optional: true, onInput: (v) => (company.linkedin = v) });
    const address = textField({ label: 'Address', value: company.address, optional: true, onInput: (v) => (company.address = v) });

    const saveBtn = button({
      label: 'Save', variant: 'primary', size: 'sm',
      onClick: async () => {
        const error = firstError([
          { value: company.name, label: 'Company name', required: true },
          { value: company.website, label: 'Website', url: true },
          { value: company.email, label: 'Email', email: true },
        ]);
        if (error) return showToast(error, { tone: 'error' });
        const result = await api.settings.save({ company });
        if (result?.ok) {
          setAppState({ settings: result.state });
          showToast('Company profile saved.');
        } else {
          showToast(result?.error || 'Could not save.', { tone: 'error' });
        }
      },
    });

    return sectionCard(
      'Company profile',
      'Identity used across every generated message.',
      h('div.stack', {}, [
        h('div.logo-picker', {}, [logoPreview, uploadBtn]),
        h('div.grid-2', {}, [name.el, website.el]),
        h('div.grid-2', {}, [email.el, phone.el]),
        h('div.grid-2', {}, [linkedin.el, address.el]),
      ]),
      saveBtn
    );
  }

  function servicesSection() {
    const field = textareaField({
      label: 'Services offered', value: servicesText, rows: 6,
      hint: 'One per line. Mentioned in outreach only when relevant.',
      onInput: (v) => (servicesText = v),
    });
    const saveBtn = button({
      label: 'Save', variant: 'primary', size: 'sm',
      onClick: async () => {
        const services = servicesText.split('\n').map((s) => s.trim()).filter(Boolean);
        const result = await api.settings.save({ services });
        if (result?.ok) {
          setAppState({ settings: result.state });
          showToast('Services updated.');
        } else {
          showToast(result?.error || 'Could not save.', { tone: 'error' });
        }
      },
    });
    return sectionCard('Services', 'What your company offers.', h('div.stack', {}, [field.el]), saveBtn);
  }

  function identitySection() {
    const avatarWidget = avatarPicker({
      initialAvatar: user.avatar || '',
      name: user.fullName || '',
      onChange: (url) => {
        user.avatar = url;
      },
    });

    const fullName = textField({ label: 'Full name', value: user.fullName, onInput: (v) => (user.fullName = v) });
    const designation = textField({ label: 'Designation', value: user.designation, onInput: (v) => (user.designation = v) });
    const department = textField({ label: 'Department', value: user.department, onInput: (v) => (user.department = v) });
    const signature = textareaField({ label: 'Signature', value: user.signature, rows: 4, onInput: (v) => (user.signature = v) });

    const savePrimaryBtn = button({
      label: 'Save primary identity', variant: 'primary', size: 'sm',
      onClick: async () => {
        const error = firstError([{ value: user.fullName, label: 'Full name', required: true }]);
        if (error) return showToast(error, { tone: 'error' });
        const result = await api.settings.save({ user });
        if (result?.ok) {
          setAppState({ settings: result.state });
          showToast('Primary identity saved.');
        } else {
          showToast(result?.error || 'Could not save.', { tone: 'error' });
        }
      },
    });

    const profilesListEl = h('div.stack', { style: 'gap: 8px;' });

    function renderProfilesList() {
      clear(profilesListEl);

      // Primary profile card
      const isPrimaryActive = !activeSenderProfileId;
      const primaryCard = h('div.profile-card', { class: isPrimaryActive ? 'is-active' : '' }, [
        h('div.row', { style: 'gap: 12px; align-items: center; flex: 1;' }, [
          avatarEl({ src: user.avatar, name: user.fullName || 'Primary', size: 36 }),
          h('div.stack', { style: 'gap: 2px; flex: 1;' }, [
            h('div.row', { style: 'gap: 8px;' }, [
              h('span.text-body-strong', { text: `Primary Profile: ${user.fullName || 'Default User'}` }),
              isPrimaryActive ? h('span.badge', { text: 'Active Default ✓' }) : null,
            ]),
            h('p.text-caption.text-dim', { text: `${user.designation || 'No designation'} · ${user.department || 'No department'}` }),
          ]),
        ]),
        h('div.row', { style: 'gap: 6px;' }, [
          !isPrimaryActive ? button({
            label: 'Set as default',
            size: 'sm',
            onClick: async () => {
              activeSenderProfileId = '';
              const res = await api.settings.save({ activeSenderProfileId: '' });
              if (res?.ok) {
                setAppState({ settings: res.state });
                renderProfilesList();
                showToast('Primary identity set as default sender.');
              }
            },
          }) : null,
        ]),
      ]);

      profilesListEl.append(primaryCard);

      if (senderProfiles.length === 0) {
        profilesListEl.append(
          h('p.text-caption.text-dim', {
            style: 'padding: 8px 4px;',
            text: 'No additional team personas yet. Click "+ Add sender profile" below to create profiles for SDRs, founders, or specialized outreach roles.',
          })
        );
      } else {
        senderProfiles.forEach((profile) => {
          const isDefault = activeSenderProfileId === profile.id;
          const sigSnippet = profile.signature ? profile.signature.replace(/\n+/g, ' ').slice(0, 60) : '';

          const setDefaultBtn = !isDefault ? button({
            label: 'Set as default',
            size: 'sm',
            onClick: async () => {
              activeSenderProfileId = profile.id;
              const res = await api.settings.save({ activeSenderProfileId: profile.id });
              if (res?.ok) {
                setAppState({ settings: res.state });
                renderProfilesList();
                showToast(`"${profile.name}" set as default sender.`);
              }
            },
          }) : null;

          const editBtn = button({
            label: 'Edit',
            size: 'sm',
            onClick: () => openProfileModal(profile),
          });

          const deleteBtn = button({
            label: 'Delete',
            size: 'sm',
            variant: 'danger',
            onClick: () => {
              confirmModal({
                title: `Delete profile "${profile.name}"?`,
                body: `This persona (${profile.fullName}) will be removed.`,
                confirmLabel: 'Delete',
                onConfirm: async () => {
                  senderProfiles = senderProfiles.filter((p) => p.id !== profile.id);
                  if (activeSenderProfileId === profile.id) activeSenderProfileId = '';
                  const res = await api.settings.save({ senderProfiles, activeSenderProfileId });
                  if (res?.ok) {
                    setAppState({ settings: res.state });
                    renderProfilesList();
                    showToast('Profile deleted.');
                  }
                },
              });
            },
          });

          const card = h('div.profile-card', { class: isDefault ? 'is-active' : '' }, [
            h('div.row', { style: 'gap: 12px; align-items: center; flex: 1;' }, [
              avatarEl({ src: profile.avatar, name: profile.name || profile.fullName, size: 36 }),
              h('div.stack', { style: 'gap: 2px; flex: 1;' }, [
                h('div.row', { style: 'gap: 8px;' }, [
                  h('span.text-body-strong', { text: profile.name }),
                  isDefault ? h('span.badge', { text: 'Active Default ✓' }) : null,
                ]),
                h('p.text-caption.text-dim', {
                  text: `${profile.fullName || 'No name'} · ${profile.designation || 'No designation'}${profile.department ? ` (${profile.department})` : ''}`,
                }),
                sigSnippet ? h('p.text-caption', { style: 'font-style: italic; opacity: 0.75;', text: `Signature: "${sigSnippet}${profile.signature.length > 60 ? '…' : ''}"` }) : null,
              ]),
            ]),
            h('div.row', { style: 'gap: 6px;' }, [setDefaultBtn, editBtn, deleteBtn]),
          ]);

          profilesListEl.append(card);
        });
      }
    }

    function openProfileModal(existingProfile = null) {
      const isEdit = Boolean(existingProfile);
      const data = existingProfile ? { ...existingProfile } : {
        id: `prof_${Date.now()}`,
        name: '',
        fullName: '',
        designation: '',
        department: '',
        signature: '',
        avatar: '',
      };

      const nameField = textField({
        label: 'Profile label / role',
        value: data.name,
        placeholder: 'e.g. Technical Founder, Enterprise SDR, Partnerships Lead',
        onInput: (v) => (data.name = v),
      });

      const fullNameField = textField({
        label: 'Sender full name',
        value: data.fullName,
        placeholder: 'Jordan Miller',
        onInput: (v) => (data.fullName = v),
      });

      const designationField = textField({
        label: 'Designation / Title',
        value: data.designation,
        placeholder: 'Head of Strategic Partnerships',
        onInput: (v) => (data.designation = v),
      });

      const deptField = textField({
        label: 'Department',
        value: data.department,
        optional: true,
        placeholder: 'Partnerships & Growth',
        onInput: (v) => (data.department = v),
      });

      const avatarPickerField = avatarPicker({
        initialAvatar: data.avatar || '',
        name: data.name || data.fullName || '',
        onChange: (v) => (data.avatar = v),
      });

      const sigField = textareaField({
        label: 'Custom signature',
        value: data.signature,
        rows: 3,
        placeholder: 'Best,\nJordan Miller\nHead of Partnerships\nAcme Corp',
        onInput: (v) => (data.signature = v),
      });

      const formWrap = h('div.stack', { style: 'gap: 14px; max-height: 70vh; overflow-y: auto; padding-right: 4px;' }, [
        nameField.el,
        h('div.grid-2', {}, [fullNameField.el, designationField.el]),
        deptField.el,
        avatarPickerField,
        sigField.el,
      ]);

      let closeModal;
      const cancelBtn = h('button.btn.btn-outline', { text: 'Cancel', on: { click: () => closeModal() } });
      const submitBtn = button({
        label: isEdit ? 'Update profile' : 'Add profile',
        variant: 'primary',
        size: 'sm',
        onClick: async () => {
          const err = firstError([
            { value: data.name, label: 'Profile label', required: true },
            { value: data.fullName, label: 'Full name', required: true },
          ]);
          if (err) return showToast(err, { tone: 'error' });

          if (isEdit) {
            const idx = senderProfiles.findIndex((p) => p.id === existingProfile.id);
            if (idx !== -1) senderProfiles[idx] = data;
          } else {
            senderProfiles.push(data);
          }

          const res = await api.settings.save({ senderProfiles, activeSenderProfileId });
          if (res?.ok) {
            setAppState({ settings: res.state });
            closeModal();
            renderProfilesList();
            showToast(isEdit ? 'Profile updated.' : 'Sender profile created.');
          } else {
            showToast(res?.error || 'Could not save profile.', { tone: 'error' });
          }
        },
      });

      closeModal = openModal({
        title: isEdit ? 'Edit sender profile' : 'Add sender profile',
        body: formWrap,
        actions: [cancelBtn, submitBtn],
        size: 'lg',
      });
    }

    renderProfilesList();

    const addProfileBtn = button({
      label: 'Add sender profile',
      icon: 'user',
      size: 'sm',
      onClick: () => openProfileModal(null),
    });

    const personasHeader = h('div.row-between', { style: 'margin-top: var(--space-4); margin-bottom: var(--space-2);' }, [
      h('div', {}, [
        h('h4.text-body-strong', { text: 'Multi-Sender Personas & Signatures' }),
        h('p.text-caption', { text: 'Switch between team members or specialized outreach signatures in the Generator.' }),
      ]),
      addProfileBtn,
    ]);

    return sectionCard(
      'Your identity & senders',
      'The sender persona and signature injected into cold emails and messages.',
      h('div.stack', {}, [
        avatarWidget,
        h('div.grid-2', {}, [fullName.el, designation.el]),
        department.el,
        signature.el,
        h('div.row-between', {}, [
          button({
            label: 'Open Signature Studio',
            icon: 'pen',
            size: 'sm',
            onClick: () => navigate('/signature'),
          }),
          savePrimaryBtn,
        ]),
        h('hr.divider'),
        personasHeader,
        profilesListEl,
      ]),
      null
    );
  }

  async function aiProviderSection() {
    let aiData;
    try {
      aiData = await api.ai.getProviders();
    } catch {
      aiData = {
        providers: {},
        languages: [],
        activeProvider: 'groq',
        activeModel: 'openai/gpt-oss-120b',
        customBaseUrl: '',
        temperature: 0.7,
        defaultLanguage: 'English (US)',
        keys: {},
      };
    }

    const providers = aiData.providers || {};
    let currentProviderId = aiData.activeProvider || 'groq';
    let currentModel = aiData.activeModel;
    let customBaseUrl = aiData.customBaseUrl || '';
    let temperature = aiData.temperature ?? 0.7;
    let defaultLanguage = aiData.defaultLanguage || 'English (US)';
    let keysState = { ...(aiData.keys || {}) };

    const wrap = h('div.stack');

    function renderAIControls() {
      clear(wrap);
      const provConfig = providers[currentProviderId];
      if (!provConfig) return;

      const providerSelect = selectField({
        label: 'Active AI Provider',
        value: currentProviderId,
        options: Object.values(providers).map((p) => ({ value: p.id, label: p.name })),
        onChange: (newProv) => {
          currentProviderId = newProv;
          currentModel = providers[newProv]?.defaultModel || '';
          renderAIControls();
        },
      });

      const modelSelect = selectField({
        label: 'Model',
        value: currentModel || provConfig.defaultModel,
        options: (provConfig.models || []).map((m) => ({ value: m.id, label: m.label })),
        onChange: (v) => (currentModel = v),
      });

      const langSelect = selectField({
        label: 'Default Generation Language',
        value: defaultLanguage,
        options: (aiData.languages || []).map((l) => ({ value: l.id, label: l.label })),
        onChange: (v) => (defaultLanguage = v),
      });

      const tempBadge = h('span.badge', {
        text: `${temperature.toFixed(1)} (${temperature < 0.4 ? 'Precise' : temperature > 0.7 ? 'Creative' : 'Balanced'})`,
      });
      const tempRange = h('input.range-input', {
        type: 'range',
        min: '0',
        max: '1',
        step: '0.1',
        value: String(temperature),
        on: {
          input: (e) => {
            temperature = parseFloat(e.target.value);
            tempBadge.textContent = `${temperature.toFixed(1)} (${temperature < 0.4 ? 'Precise' : temperature > 0.7 ? 'Creative' : 'Balanced'})`;
          },
        },
      });

      const tempGroup = h('div.slider-group', {}, [
        h('div.row-between', {}, [
          h('label.field-label', { text: 'Creativity / Temperature' }),
          tempBadge,
        ]),
        h('div.slider-row', {}, [tempRange]),
      ]);

      const keyHasSaved = Boolean(keysState[currentProviderId]);
      const statusBadge = h('span.badge', {
        text: provConfig.requiresKey
          ? (keyHasSaved ? 'Key configured ✓' : 'No key saved')
          : 'Local Provider (No key needed)',
      });

      if (provConfig.requiresKey) {
        let enteredKey = '';
        const keyInput = textField({
          label: `${provConfig.name} API Key`,
          type: 'password',
          placeholder: keyHasSaved ? '••••••••••••••••' : 'Enter API key…',
          hint: provConfig.helpUrl ? `Get a key from ${provConfig.helpUrl}` : undefined,
          onInput: (v) => (enteredKey = v),
        });

        const saveKeyBtn = button({
          label: 'Save key',
          size: 'sm',
          onClick: async () => {
            if (!enteredKey.trim()) return showToast('Enter an API key first.', { tone: 'error' });
            try {
              await api.ai.saveProviderKey(currentProviderId, enteredKey.trim());
              keysState[currentProviderId] = true;
              statusBadge.textContent = 'Key configured ✓';
              showToast(`${provConfig.name} key saved securely.`);
            } catch (err) {
              showToast(err.message, { tone: 'error' });
            }
          },
        });

        const testKeyBtn = button({
          label: 'Test connection',
          size: 'sm',
          onClick: async () => {
            testKeyBtn.disabled = true;
            const original = testKeyBtn.textContent;
            testKeyBtn.textContent = 'Testing…';
            try {
              const res = await api.ai.testProviderKey({
                providerId: currentProviderId,
                apiKey: enteredKey.trim() || undefined,
                model: currentModel,
              });
              showToast(res.message || 'Connection successful!');
            } catch (err) {
              showToast(err.message, { tone: 'error' });
            } finally {
              testKeyBtn.disabled = false;
              testKeyBtn.textContent = original;
            }
          },
        });

        const clearKeyBtn = button({
          label: 'Remove key',
          size: 'sm',
          variant: 'danger',
          onClick: () =>
            confirmModal({
              title: `Remove ${provConfig.name} key?`,
              body: 'You will need to re-enter a key before generating content with this provider.',
              confirmLabel: 'Remove',
              onConfirm: async () => {
                await api.ai.clearProviderKey(currentProviderId);
                keysState[currentProviderId] = false;
                statusBadge.textContent = 'No key saved';
                showToast('Key removed.');
              },
            }),
        });

        wrap.append(
          h('div.row', {}, [statusBadge]),
          h('div.grid-2', {}, [providerSelect.el, modelSelect.el]),
          h('div.grid-2', {}, [keyInput.el, langSelect.el]),
          tempGroup,
          h('div.row', {}, [saveKeyBtn, testKeyBtn, clearKeyBtn])
        );
      } else {
        const baseUrlInput = textField({
          label: 'Ollama Base URL',
          value: customBaseUrl || provConfig.baseUrl,
          placeholder: 'http://localhost:11434/v1',
          onInput: (v) => (customBaseUrl = v),
        });

        const testConnBtn = button({
          label: 'Test local connection',
          size: 'sm',
          onClick: async () => {
            testConnBtn.disabled = true;
            testConnBtn.textContent = 'Checking…';
            try {
              const res = await api.ai.testProviderKey({
                providerId: 'ollama',
                model: currentModel,
                customBaseUrl: customBaseUrl || provConfig.baseUrl,
              });
              showToast(res.message || 'Connected to local Ollama!');
            } catch (err) {
              showToast(err.message, { tone: 'error' });
            } finally {
              testConnBtn.disabled = false;
              testConnBtn.textContent = 'Test local connection';
            }
          },
        });

        wrap.append(
          h('div.row', {}, [statusBadge]),
          h('div.grid-2', {}, [providerSelect.el, modelSelect.el]),
          h('div.grid-2', {}, [baseUrlInput.el, langSelect.el]),
          tempGroup,
          h('div.row', {}, [testConnBtn])
        );
      }
    }

    renderAIControls();

    const saveSettingsBtn = button({
      label: 'Save AI settings',
      size: 'sm',
      variant: 'primary',
      onClick: async () => {
        const result = await api.settings.save({
          ai: {
            provider: currentProviderId,
            model: currentModel,
            customBaseUrl,
            temperature,
            defaultLanguage,
          },
          ...(currentProviderId === 'groq' ? { groq: { model: currentModel } } : {}),
        });
        if (result?.ok) {
          setAppState({ settings: result.state });
          showToast('AI preferences saved.');
        } else {
          showToast(result?.error || 'Could not save.', { tone: 'error' });
        }
      },
    });

    return sectionCard(
      'AI Intelligence Engine',
      'Select and configure your active AI provider: Groq, OpenAI, Google Gemini, Anthropic Claude, or local Ollama.',
      wrap,
      saveSettingsBtn
    );
  }

  function themeSection() {
    let currentTheme = settings.theme || 'dark';

    const THEME_OPTIONS = [
      {
        id: 'dark',
        name: 'Obsidian Dark',
        desc: 'Deep carbon neutral dark mode with high contrast text.',
        swatches: ['#060606', '#171717', '#262626', '#f7f7f6'],
      },
      {
        id: 'light',
        name: 'Soft Paper Light',
        desc: 'Warm, low-glare ergonomic light theme crafted for long sessions.',
        swatches: ['#f6f6f2', '#ebebe4', '#deded6', '#1a1c20'],
      },
      {
        id: 'midnight',
        name: 'Midnight Cyber',
        desc: 'Deep indigo-tinted dark mode with subtle electric accents.',
        swatches: ['#070a13', '#151e33', '#334873', '#f1f5fd'],
      },
      {
        id: 'amber',
        name: 'Warm Espresso',
        desc: 'Warm obsidian palette with earthy sepia undertones.',
        swatches: ['#0f0d0b', '#24201b', '#4c4338', '#fbf7ee'],
      },
    ];

    const grid = h('div.theme-grid');
    const cardMap = new Map();

    for (const opt of THEME_OPTIONS) {
      const isCur = opt.id === currentTheme;
      const swatchEls = opt.swatches.map((color) => h('div.theme-swatch', { style: `background: ${color};` }));

      const card = h(
        'button.theme-card',
        {
          class: isCur ? 'is-active' : '',
          on: {
            click: async () => {
              currentTheme = opt.id;
              for (const [id, el] of cardMap) el.classList.toggle('is-active', id === currentTheme);
              document.documentElement.setAttribute('data-theme', currentTheme);
              const res = await api.settings.save({ theme: currentTheme });
              if (res?.ok) {
                setAppState({ settings: res.state });
                showToast(`Applied ${opt.name} theme.`);
              }
            },
          },
        },
        [
          h('div.theme-swatches', {}, swatchEls),
          h('span.text-body-strong', { text: opt.name }),
          h('span.text-caption.text-dim', { text: opt.desc }),
        ]
      );
      cardMap.set(opt.id, card);
      grid.append(card);
    }

    return sectionCard(
      'Appearance & Themes',
      'Select a desktop color theme tailored for long outreach sessions.',
      grid,
      null
    );
  }

  function dataSection() {
    const exportBtn = button({
      label: 'Export configuration', icon: 'download',
      onClick: async () => {
        try {
          const result = await api.settings.export();
          if (result) showToast(`Exported to ${result.filePath}`);
        } catch (err) {
          showToast(err.message, { tone: 'error' });
        }
      },
    });
    const importBtn = button({
      label: 'Import configuration', icon: 'upload',
      onClick: async () => {
        try {
          const result = await api.settings.import();
          if (result?.state) {
            setAppState({ settings: result.state });
            showToast('Configuration imported. Reopen Settings to see changes.');
          }
        } catch (err) {
          showToast(err.message, { tone: 'error' });
        }
      },
    });
    const resetBtn = button({
      label: 'Reset app', icon: 'trash', variant: 'danger',
      onClick: () => confirmModal({
        title: 'Reset WishReach?',
        body: 'This clears your company profile, services, identity, Groq key, drafts, and templates. This cannot be undone.',
        confirmLabel: 'Reset everything',
        onConfirm: async () => {
          await api.settings.reset();
          location.reload();
        },
      }),
    });

    return sectionCard(
      'Data',
      'Move your setup between machines, or start over.',
      h('div.row', {}, [exportBtn, importBtn, resetBtn]),
      null
    );
  }

  function openSourceSection() {
    const detailsBtn = button({
      label: 'View License & Author Details',
      icon: 'sparkles',
      size: 'sm',
      onClick: () => openAboutModal(),
    });

    const repoBtn = button({
      label: 'GitHub Repository',
      icon: 'globe',
      size: 'sm',
      onClick: () => {
        window.open('https://github.com/vishwjeet-vilkhu/wishreach', '_blank');
      },
    });

    const body = h('div.stack', { style: 'gap: var(--space-4);' }, [
      h('div.row-between', { style: 'align-items: center;' }, [
        h('div.stack', { style: 'gap: 2px;' }, [
          h('span.text-body-strong', { text: 'Original Creator & Architect' }),
          h('span.text-caption.text-dim', { text: 'Vishwjeet Singh Vilkhu' }),
        ]),
        h('span.badge', { text: 'GNU AGPL v3.0' }),
      ]),
      h('p.text-caption', {
        style: 'color: var(--text-2); line-height: 1.5;',
        text: 'WishReach is distributed under the GNU Affero General Public License v3.0. All downstream modifications, forks, and distributions must preserve author attribution, legal notices, and provide full source code under the AGPL license.',
      }),
      h('div.row', { style: 'gap: var(--space-3);' }, [detailsBtn, repoBtn]),
    ]);

    return sectionCard(
      'Open Source & Legal Attribution',
      'Original authorship, license enforcement, and community governance.',
      body,
      null
    );
  }
}
