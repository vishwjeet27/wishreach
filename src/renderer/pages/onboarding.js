/**
 * @file Four-step onboarding wizard shown on first launch. Collects
 * everything the system prompt needs (company identity, services, sender
 * identity, Groq credentials) so every later generation is a one-shot:
 * the user then only ever enters client details.
 */

import { h, clear } from '../js/dom.js';
import { iconMarkup } from '../components/icons.js';
import { textField, textareaField, selectField } from '../components/textarea.js';
import { api } from '../js/api.js';
import { firstError } from '../js/validators.js';
import { showToast } from '../components/toast.js';
import { avatarPicker } from '../components/avatar.js';

const STEP_TITLES = ['Company', 'Services', 'Your identity', 'Groq setup'];

/**
 * Renders the onboarding wizard.
 * @param {HTMLElement} root
 * @param {() => void} onComplete  Called once setup is saved successfully.
 */
export function renderOnboarding(root, onComplete) {
  const data = {
    company: { name: '', logo: '', website: '', address: '', phone: '', email: '', linkedin: '' },
    servicesText: 'AI Development\nSaaS Development\nWeb Applications\nMobile Apps\nUI/UX\nCloud',
    user: { fullName: '', designation: '', department: '', signature: '', avatar: '' },
    apiKey: '',
    model: '',
  };

  let step = 0;
  let models = [{ id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B (recommended)' }];

  const dotsRow = h('div.onboarding-steps');
  const body = h('div.onboarding-body');
  const footer = h('div.onboarding-footer');
  const card = h('div.onboarding-card', {}, [dotsRow, body, footer]);
  const wrap = h('div.onboarding', {}, [card]);

  clear(root);
  root.append(wrap);

  api.groq.listModels().then((list) => {
    if (Array.isArray(list) && list.length) {
      models = list;
      data.model = list[0].id;
      if (step === 3) renderStep();
    }
  });

  function renderDots() {
    clear(dotsRow);
    STEP_TITLES.forEach((_, i) => {
      dotsRow.append(h('div.onboarding-step-dot', { class: i < step ? 'is-done' : i === step ? 'is-active' : '' }));
    });
  }

  function renderStep() {
    renderDots();
    clear(body);
    clear(footer);

    body.append(h('h2.text-heading', { text: `Step ${step + 1} of 4 — ${STEP_TITLES[step]}` }));
    body.append(h('div', { style: 'height:20px' }));

    if (step === 0) body.append(renderCompanyStep());
    if (step === 1) body.append(renderServicesStep());
    if (step === 2) body.append(renderIdentityStep());
    if (step === 3) body.append(renderGroqStep());

    const backBtn = h('button.btn.btn-outline', {
      text: 'Back',
      disabled: step === 0,
      on: { click: () => { step -= 1; renderStep(); } },
    });
    const nextBtn = h('button.btn.btn-primary', {
      text: step === 3 ? 'Finish setup' : 'Continue',
      on: { click: () => handleNext(nextBtn) },
    });
    footer.append(backBtn, nextBtn);
  }

  function renderCompanyStep() {
    const logoPreview = h('div.logo-preview', { html: data.company.logo ? '' : iconMarkup('building', 24) });
    if (data.company.logo) logoPreview.append(h('img', { src: data.company.logo, alt: '' }));

    const uploadBtn = h('button.btn.btn-outline.btn-sm', {
      text: 'Upload logo',
      on: {
        click: async () => {
          const result = await api.system.pickLogoImage();
          if (result?.dataUri) {
            data.company.logo = result.dataUri;
            clear(logoPreview);
            logoPreview.append(h('img', { src: result.dataUri, alt: '' }));
          } else if (result?.error) {
            showToast(result.error, { tone: 'error' });
          }
        },
      },
    });

    const name = textField({ label: 'Company name', value: data.company.name, placeholder: 'Acme Technologies', onInput: (v) => (data.company.name = v) });
    const website = textField({ label: 'Website', value: data.company.website, placeholder: 'acme.com', optional: true, onInput: (v) => (data.company.website = v) });
    const address = textField({ label: 'Address', value: data.company.address, placeholder: 'City, Country', optional: true, onInput: (v) => (data.company.address = v) });
    const phone = textField({ label: 'Contact number', value: data.company.phone, placeholder: '+1 555 000 0000', optional: true, onInput: (v) => (data.company.phone = v) });
    const email = textField({ label: 'Email', value: data.company.email, placeholder: 'hello@acme.com', optional: true, type: 'email', onInput: (v) => (data.company.email = v) });
    const linkedin = textField({ label: 'LinkedIn URL', value: data.company.linkedin, placeholder: 'linkedin.com/company/acme', optional: true, onInput: (v) => (data.company.linkedin = v) });

    return h('div.stack', {}, [
      h('div.logo-picker', {}, [logoPreview, uploadBtn]),
      name.el,
      h('div.grid-2', {}, [website.el, email.el]),
      h('div.grid-2', {}, [phone.el, linkedin.el]),
      address.el,
    ]);
  }

  function renderServicesStep() {
    const hint = 'One service per line. These are only mentioned in outreach when relevant.';
    const field = textareaField({
      label: 'Services offered',
      value: data.servicesText,
      hint,
      rows: 8,
      onInput: (v) => (data.servicesText = v),
    });
    return h('div.stack', {}, [field.el]);
  }

  function renderIdentityStep() {
    const avatarWidget = avatarPicker({
      initialAvatar: data.user.avatar,
      name: data.user.fullName,
      onChange: (url) => { data.user.avatar = url; },
    });

    const fullName = textField({ label: 'Full name', value: data.user.fullName, placeholder: 'Rakesh Joshi', onInput: (v) => (data.user.fullName = v) });
    const designation = textField({ label: 'Designation', value: data.user.designation, placeholder: 'Assistant Manager', onInput: (v) => (data.user.designation = v) });
    const department = textField({ label: 'Department', value: data.user.department, placeholder: 'Business Development', onInput: (v) => (data.user.department = v) });
    const signature = textareaField({
      label: 'Email signature',
      value: data.user.signature,
      hint: 'Used verbatim at the end of every generated email.',
      rows: 4,
      onInput: (v) => (data.user.signature = v),
    });
    if (!data.user.signature) {
      signature.textarea.placeholder = 'Rakesh Joshi\nAssistant Manager, Business Development\nAcme Technologies';
    }
    return h('div.stack', {}, [
      avatarWidget,
      h('div.grid-2', {}, [fullName.el, designation.el]),
      department.el,
      signature.el,
    ]);
  }

  function renderGroqStep() {
    const key = textField({
      label: 'Groq API key',
      value: data.apiKey,
      type: 'password',
      placeholder: 'gsk_…',
      hint: 'Stored encrypted on this device. You can add or change this later in Settings.',
      optional: true,
      onInput: (v) => (data.apiKey = v),
    });
    const model = selectField({
      label: 'Model',
      value: data.model || models[0]?.id,
      options: models.map((m) => ({ value: m.id, label: m.label })),
      onChange: (v) => (data.model = v),
    });
    return h('div.stack', {}, [key.el, model.el]);
  }

  async function handleNext(nextBtn) {
    if (step === 0) {
      const error = firstError([
        { value: data.company.name, label: 'Company name', required: true },
        { value: data.company.website, label: 'Website', url: true },
        { value: data.company.email, label: 'Email', email: true },
      ]);
      if (error) return showToast(error, { tone: 'error' });
    }
    if (step === 2) {
      const error = firstError([{ value: data.user.fullName, label: 'Full name', required: true }]);
      if (error) return showToast(error, { tone: 'error' });
    }

    if (step < 3) {
      step += 1;
      renderStep();
      return;
    }

    nextBtn.disabled = true;
    nextBtn.textContent = 'Saving…';
    try {
      const services = data.servicesText.split('\n').map((s) => s.trim()).filter(Boolean);
      const saveResult = await api.settings.save({
        company: data.company,
        user: data.user,
        services,
        groq: { model: data.model || models[0].id },
        onboarded: true,
      });
      if (!saveResult?.ok) {
        showToast(saveResult?.error || 'Could not save settings.', { tone: 'error' });
        nextBtn.disabled = false;
        nextBtn.textContent = 'Finish setup';
        return;
      }
      if (data.apiKey.trim()) {
        await api.groq.saveKey(data.apiKey.trim());
      }
      onComplete();
    } catch (error) {
      showToast(error.message, { tone: 'error' });
      nextBtn.disabled = false;
      nextBtn.textContent = 'Finish setup';
    }
  }

  renderStep();
}
