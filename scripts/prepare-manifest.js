/**
 * Prepare Manifest for Target Browser
 * Usage: node scripts/prepare-manifest.js [firefox|chrome]
 */

const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'firefox';
const manifestPath = path.join(__dirname, '../manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log(`🔧 Preparing manifest for ${target}...`);

if (target === 'firefox') {
  // Firefox MV3 prefers background.scripts over service_worker for stability
  delete manifest.background.service_worker;
  manifest.background.scripts = [
    "lib/browser-polyfill.js",
    "lib/default-categories.js",
    "lib/storage-manager.js",
    "lib/container-utils.js",
    "lib/domain-utils.js",
    "background/background.js"
  ];
  
  // Ensure we have an ID for Firefox and privacy settings
  if (!manifest.browser_specific_settings) {
    manifest.browser_specific_settings = { gecko: {} };
  }
  if (!manifest.browser_specific_settings.gecko) {
    manifest.browser_specific_settings.gecko = {};
  }
  
  manifest.browser_specific_settings.gecko.id = "tabspin@firefox.extension";
  manifest.browser_specific_settings.gecko.data_collection_permissions = {
    "required": ["none"]
  };
  
} else if (target === 'chrome') {
  // Chrome MV3 requires service_worker
  delete manifest.browser_specific_settings;
  
  // Ensure background is set up as a Service Worker for Chrome
  delete manifest.background.scripts;
  manifest.background = {
    "service_worker": "background/background.js"
  };
  
  // Remove Firefox-only permissions
  if (manifest.permissions) {
    manifest.permissions = manifest.permissions.filter(p => p !== 'contextualIdentities');
  }
}

// Write the modified manifest
const outputPath = path.join(__dirname, '../manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

console.log(`✅ Manifest updated for ${target}`);
