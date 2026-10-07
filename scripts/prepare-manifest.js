/**
 * Builds the browser-specific manifest from the shared manifest.json.
 * The source manifest is never modified: callers write the result into a staging dir.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const BACKGROUND_ENTRY = 'background/background.js';

// Oldest versions running this code: module background (Firefox 112, Chrome 92),
// structuredClone (Chrome 98) and CSS range media queries (Chrome 104)
// Firefox 115 is the oldest supported ESR. web-ext lint warns that it predates
// data_collection_permissions (Firefox 140): older versions just ignore that key,
// which addons.mozilla.org requires.
export const MIN_FIREFOX_VERSION = '115.0';
export const MIN_CHROME_VERSION = '104';

export function buildManifest(target) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

  if (target === 'firefox') {
    // Firefox MV3 runs the background as an event page (module script)
    manifest.background = { scripts: [BACKGROUND_ENTRY], type: 'module' };
    manifest.browser_specific_settings = {
      gecko: {
        id: 'tabspin@firefox.extension',
        strict_min_version: MIN_FIREFOX_VERSION,
        data_collection_permissions: { required: ['none'] }
      }
    };
  } else if (target === 'chrome') {
    manifest.background = { service_worker: BACKGROUND_ENTRY, type: 'module' };
    manifest.minimum_chrome_version = MIN_CHROME_VERSION;
    delete manifest.browser_specific_settings;
  } else {
    throw new Error(`Unknown target "${target}" (expected firefox or chrome)`);
  }

  return manifest;
}
