/**
 * Builds the browser-specific manifest from the shared manifest.json.
 * The source manifest is never modified: callers write the result into a staging dir.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const BACKGROUND_ENTRY = 'background/background.js';

export function buildManifest(target) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

  if (target === 'firefox') {
    // Firefox MV3 runs the background as an event page (module script)
    manifest.background = { scripts: [BACKGROUND_ENTRY], type: 'module' };
    manifest.browser_specific_settings = {
      gecko: {
        id: 'tabspin@firefox.extension',
        data_collection_permissions: { required: ['none'] }
      }
    };
  } else if (target === 'chrome') {
    manifest.background = { service_worker: BACKGROUND_ENTRY, type: 'module' };
    delete manifest.browser_specific_settings;
  } else {
    throw new Error(`Unknown target "${target}" (expected firefox or chrome)`);
  }

  return manifest;
}
