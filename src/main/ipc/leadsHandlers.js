/**
 * @file IPC handlers for the Mini CRM / Leads directory.
 * Stores prospects, their company profile, custom requirements, and outreach status.
 */

import { ipcMain } from 'electron';
import { getState, updateState } from '../store/index.js';
import { CHANNELS } from '../../shared/channels.js';
import { generateId } from '../utils/object.js';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  ValidationError,
  LIMITS,
} from '../utils/validate.js';

export function registerLeadsHandlers() {
  ipcMain.handle(CHANNELS.LEADS_LIST, () => {
    return getState().leads || [];
  });

  ipcMain.handle(CHANNELS.LEADS_SAVE, (_event, payload) => {
    try {
      const state = getState();
      const existingLeads = state.leads || [];

      const cleanLead = {
        name: sanitizeText(payload?.name, 'Lead name', { required: true }),
        company: sanitizeText(payload?.company, 'Lead company', { required: true }),
        role: sanitizeText(payload?.role, 'Lead designation / title'),
        email: sanitizeEmail(payload?.email, 'Lead email'),
        website: sanitizeUrl(payload?.website, 'Lead website'),
        country: sanitizeText(payload?.country, 'Country'),
        industry: sanitizeText(payload?.industry, 'Industry'),
        status: sanitizeText(payload?.status || 'New', 'Status'),
        requirements: sanitizeText(payload?.requirements, 'Requirements / notes', { max: LIMITS.MAX_LONG_TEXT }),
        notes: sanitizeText(payload?.notes, 'Outreach notes', { max: LIMITS.MAX_LONG_TEXT }),
      };

      let leads;
      let savedLead;

      if (payload?.id) {
        const idx = existingLeads.findIndex((l) => l.id === payload.id);
        if (idx !== -1) {
          savedLead = {
            ...existingLeads[idx],
            ...cleanLead,
            updatedAt: Date.now(),
          };
          leads = [...existingLeads];
          leads[idx] = savedLead;
        } else {
          savedLead = {
            id: payload.id,
            ...cleanLead,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          leads = [savedLead, ...existingLeads];
        }
      } else {
        savedLead = {
          id: generateId(),
          ...cleanLead,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        leads = [savedLead, ...existingLeads];
      }

      updateState({ leads });
      return { ok: true, lead: savedLead, leads };
    } catch (error) {
      if (error instanceof ValidationError) return { ok: false, error: error.message };
      return { ok: false, error: 'Could not save lead.' };
    }
  });

  ipcMain.handle(CHANNELS.LEADS_DELETE, (_event, id) => {
    const state = getState();
    const leads = (state.leads || []).filter((l) => l.id !== id);
    updateState({ leads });
    return leads;
  });
}
