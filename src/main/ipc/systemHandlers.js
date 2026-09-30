/**
 * @file Miscellaneous system-level IPC handlers: clipboard access, the
 * native file picker for the company logo, and app version reporting.
 */

import { ipcMain, clipboard, dialog, app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CHANNELS } from '../../shared/channels.js';

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg']);
const MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };

/** Registers clipboard, dialog and version ipcMain.handle listeners. */
export function registerSystemHandlers() {
  ipcMain.handle(CHANNELS.APP_GET_VERSION, () => app.getVersion());

  ipcMain.handle(CHANNELS.CLIPBOARD_COPY, (_event, text) => {
    clipboard.writeText(typeof text === 'string' ? text : '');
    return true;
  });

  ipcMain.handle(CHANNELS.DIALOG_PICK_IMAGE, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Choose a company logo',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] }],
    });
    if (canceled || filePaths.length === 0) return { ok: false, canceled: true };

    const filePath = filePaths[0];
    const ext = path.extname(filePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return { ok: false, error: 'Please choose a PNG, JPG, or SVG image.' };
    }

    try {
      const stat = await fs.stat(filePath);
      if (stat.size > MAX_LOGO_BYTES) {
        return { ok: false, error: 'Logo file is too large. Please use an image under 2MB.' };
      }

      const buffer = await fs.readFile(filePath);
      const dataUri = `data:${MIME_BY_EXT[ext]};base64,${buffer.toString('base64')}`;
      return { ok: true, dataUri };
    } catch (err) {
      return { ok: false, error: err.message || 'Could not read image file.' };
    }
  });
}
