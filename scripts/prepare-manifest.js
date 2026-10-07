/**
 * Builds the browser-specific manifest from the shared manifest.json.
 * The source manifest is never modified: callers write the result into a staging dir.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/**
 * Library scripts the background loads, read from the importScripts() call in
 * background.js so the Firefox (background.scripts) and Chrome (service worker)
 * setups cannot drift apart.
 */
function getBackgroundLibraries() {
  const source = fs.readFileSync(path.join(ROOT, 'background/background.js'), 'utf8');
  const call = source.match(/importScripts\(([\s\S]*?)\);/);
  if (!call) throw new Error('importScripts() call not found in background/background.js');
  return [...call[1].matchAll(/'\.\.\/([^']+)'/g)].map(m => m[1]);
}

function buildManifest(target) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

  if (target === 'firefox') {
    // Firefox MV3 runs the background as event-page scripts rather than a service worker
    manifest.background = {
      scripts: [...getBackgroundLibraries(), 'background/background.js']
    };
    manifest.browser_specific_settings = {
      gecko: {
        id: 'tabspin@firefox.extension',
        data_collection_permissions: { required: ['none'] }
      }
    };
  } else if (target === 'chrome') {
    manifest.background = { service_worker: 'background/background.js' };
    delete manifest.browser_specific_settings;
  } else {
    throw new Error(`Unknown target "${target}" (expected firefox or chrome)`);
  }

  return manifest;
}

module.exports = { buildManifest, getBackgroundLibraries };
