/**
 * WishReach - Personalized AI Cold Outreach Platform
 * Copyright (C) 2026 Vishwjeet Singh Vilkhu <https://github.com/vishwjeet-vilkhu>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * @file Application entry point. Creates the single BrowserWindow with a
 * hardened webPreferences configuration and wires up IPC handlers.
 */


import { app, BrowserWindow, session, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { registerAllHandlers } from './ipc/index.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.argv.includes('--dev');

/** Content-Security-Policy applied to every response the renderer loads. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ');

/** @returns {BrowserWindow} */
function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 720,
    show: false,
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    title: 'WishReach',
    icon: path.join(__dirname, '..', '..', 'assets', 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  win.once('ready-to-show', () => win.show());

  // Safely open outbound links with strict protocol validation (blocks file:// and custom URI schemes)
  function safeOpenExternal(targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      if (['https:', 'http:', 'mailto:'].includes(parsed.protocol)) {
        shell.openExternal(targetUrl);
      }
    } catch {}
  }

  // Every outbound navigation/link opens in the OS browser instead of
  // inside the app — this is a desktop tool, not a browser shell.
  win.webContents.setWindowOpenHandler(({ url }) => {
    safeOpenExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault();
      safeOpenExternal(url);
    }
  });

  // In dev mode, toggle DevTools manually with F12 or Ctrl+Shift+I instead of auto-opening
  if (isDev) {
    win.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i')) {
        win.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }

  return win;
}

let mainWindow = null;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [CSP],
        },
      });
    });

    registerAllHandlers();
    mainWindow = createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

