/**
 * @file IPC handlers for the History page: every generated piece of
 * content the user chooses to keep is saved here as a "draft".
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { promises as fs } from 'node:fs';
import { getState, updateState } from '../store/index.js';
import { CHANNELS } from '../../shared/channels.js';
import { generateId } from '../utils/object.js';
import { sanitizeText, ValidationError, LIMITS } from '../utils/validate.js';

/** Registers the drafts (history) ipcMain.handle listeners. */
export function registerDraftsHandlers() {
  ipcMain.handle(CHANNELS.DRAFTS_LIST, () => getState().drafts);

  ipcMain.handle(CHANNELS.DRAFTS_SAVE, (_event, payload) => {
    try {
      let cleanAllContent = undefined;
      if (payload?.allContent && typeof payload.allContent === 'object') {
        cleanAllContent = {};
        for (const [k, v] of Object.entries(payload.allContent)) {
          if (typeof v === 'string') {
            cleanAllContent[k] = v;
          }
        }
      }

      const draft = {
        id: generateId(),
        timestamp: Date.now(),
        clientName: sanitizeText(payload?.clientName, 'Client name', { required: true }),
        clientCompany: sanitizeText(payload?.clientCompany, 'Client company', { required: true }),
        type: sanitizeText(payload?.type, 'Type', { required: true }),
        content: sanitizeText(payload?.content, 'Content', { required: true, max: LIMITS.MAX_LONG_TEXT }),
        goal: sanitizeText(payload?.goal, 'Goal'),
        tone: sanitizeText(payload?.tone, 'Tone'),
        allContent: cleanAllContent,
      };
      const state = getState();
      const drafts = [draft, ...state.drafts].slice(0, 2000);
      updateState({ drafts });
      return { ok: true, draft };
    } catch (error) {
      if (error instanceof ValidationError) return { ok: false, error: error.message };
      return { ok: false, error: 'Could not save draft.' };
    }
  });

  ipcMain.handle(CHANNELS.DRAFTS_DELETE, (_event, id) => {
    const state = getState();
    const drafts = state.drafts.filter((d) => d.id !== id);
    updateState({ drafts });
    return drafts;
  });

  ipcMain.handle(CHANNELS.DRAFTS_EXPORT, async () => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export history (JSON)',
        defaultPath: 'wishreach-history.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (canceled || !filePath) return { ok: false, canceled: true };
      await fs.writeFile(filePath, JSON.stringify(getState().drafts, null, 2), 'utf-8');
      return { ok: true, filePath };
    } catch (err) {
      return { ok: false, error: err.message || 'Could not export history.' };
    }
  });

  ipcMain.handle(CHANNELS.DRAFTS_EXPORT_CSV, async () => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export history to CSV',
        defaultPath: 'wishreach-history.csv',
        filters: [{ name: 'CSV Document', extensions: ['csv'] }],
      });
      if (canceled || !filePath) return { ok: false, canceled: true };

      const drafts = getState().drafts || [];
      const headers = ['ID', 'Date', 'Client Name', 'Company', 'Type', 'Goal', 'Tone', 'Content'];

      function escapeCSV(val) {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }

      const rows = drafts.map((d) => [
        escapeCSV(d.id),
        escapeCSV(new Date(d.timestamp).toISOString()),
        escapeCSV(d.clientName),
        escapeCSV(d.clientCompany),
        escapeCSV(d.type),
        escapeCSV(d.goal || ''),
        escapeCSV(d.tone || ''),
        escapeCSV(d.content || ''),
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      await fs.writeFile(filePath, csvContent, 'utf-8');
      return { ok: true, filePath };
    } catch (err) {
      return { ok: false, error: err.message || 'Could not export CSV.' };
    }
  });

  ipcMain.handle(CHANNELS.CAMPAIGN_EXPORT_PDF, async (_event, payload) => {
    try {
      const defaultName = payload?.clientCompany
        ? `Outreach_${payload.clientCompany.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
        : 'wishreach-campaign.pdf';

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export Campaign as PDF',
        defaultPath: defaultName,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      });
      if (canceled || !filePath) return { ok: false, canceled: true };

    const state = getState();
    const company = state.company || {};
    const user = state.user || {};
    const items = payload?.items || [];

    const escapeHtml = (str) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const itemsHtml = items
      .map(
        (item) => `
        <div class="piece">
          <div class="piece-header">${escapeHtml(item.label || 'Outreach Piece')}</div>
          <div class="piece-body">${escapeHtml(item.content || '').replace(/\n/g, '<br/>')}</div>
        </div>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 16mm 14mm; size: A4; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            background: #fff;
            line-height: 1.5;
            font-size: 12px;
            margin: 0;
            padding: 0;
          }
          .header {
            border-bottom: 2px solid #111;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0 0 4px 0;
          }
          .doc-sub {
            font-size: 11px;
            color: #666;
            margin: 0;
          }
          .meta-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 16px;
            background: #f8f8f9;
            border: 1px solid #e2e2e4;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 20px;
            font-size: 11.5px;
          }
          .meta-row { display: flex; gap: 6px; }
          .meta-label { font-weight: 600; color: #555; }
          .piece {
            margin-bottom: 20px;
            page-break-inside: avoid;
            border: 1px solid #ddd;
            border-radius: 6px;
            overflow: hidden;
          }
          .piece-header {
            background: #18181b;
            color: #fff;
            padding: 6px 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .piece-body {
            padding: 12px 14px;
            font-size: 12px;
            line-height: 1.6;
            color: #222;
          }
          .footer {
            border-top: 1px solid #e5e5e7;
            padding-top: 10px;
            margin-top: 24px;
            font-size: 10px;
            color: #888;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">${escapeHtml(company.name || 'WishReach')} — Outreach Campaign</div>
            <div class="doc-sub">Target: ${escapeHtml(payload?.clientName || 'Prospect')} (${escapeHtml(payload?.clientCompany || 'Company')})</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            Generated on ${new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </div>
        </div>

        <div class="meta-box">
          <div class="meta-row"><span class="meta-label">Client Name:</span> <span>${escapeHtml(payload?.clientName || '-')}</span></div>
          <div class="meta-row"><span class="meta-label">Client Company:</span> <span>${escapeHtml(payload?.clientCompany || '-')}</span></div>
          <div class="meta-row"><span class="meta-label">Goal:</span> <span>${escapeHtml(payload?.goal || 'Cold Outreach')}</span></div>
          <div class="meta-row"><span class="meta-label">Tone:</span> <span>${escapeHtml(payload?.tone || 'Professional')}</span></div>
          <div class="meta-row"><span class="meta-label">Sender:</span> <span>${escapeHtml(user.fullName || company.name || '-')} (${escapeHtml(user.designation || '')})</span></div>
          <div class="meta-row"><span class="meta-label">Sender Email:</span> <span>${escapeHtml(company.email || '-')}</span></div>
        </div>

        ${itemsHtml}

        <div class="footer">
          <span>Prepared with WishReach Personalized Outreach</span>
          <span>Confidential — For Internal & Outreach Use</span>
        </div>
      </body>
      </html>
    `;

    const printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    try {
      await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      const pdfBuffer = await printWin.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: {
          marginType: 'custom',
          top: 0.3,
          bottom: 0.3,
          left: 0.3,
          right: 0.3,
        },
      });
      await fs.writeFile(filePath, pdfBuffer);
      return { ok: true, filePath };
    } finally {
      if (!printWin.isDestroyed()) {
        printWin.destroy();
      }
    }
  } catch (err) {
    return { ok: false, error: err.message || 'Failed to export campaign PDF.' };
  }
});
}

