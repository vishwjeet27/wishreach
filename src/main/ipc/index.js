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
 * @file Single entry point that wires up every IPC handler module. main.js
 */


import { registerSettingsHandlers } from './settingsHandlers.js';
import { registerGroqHandlers } from './groqHandlers.js';
import { registerAIProviderHandlers } from './aiProviderHandlers.js';
import { registerGenerateHandlers, registerImageExtractHandler } from './generateHandlers.js';
import { registerDraftsHandlers } from './draftsHandlers.js';
import { registerTemplatesHandlers } from './templatesHandlers.js';
import { registerLeadsHandlers } from './leadsHandlers.js';
import { registerSystemHandlers } from './systemHandlers.js';

/** Registers every ipcMain.handle listener the app uses. */
export function registerAllHandlers() {
  registerSettingsHandlers();
  registerGroqHandlers();
  registerAIProviderHandlers();
  registerGenerateHandlers();
  registerImageExtractHandler();
  registerDraftsHandlers();
  registerTemplatesHandlers();
  registerLeadsHandlers();
  registerSystemHandlers();
}
