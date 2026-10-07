/**
 * Tests for the manifest preparation and staging used by build, lint and dev.
 */

const fs = require('fs');
const path = require('path');
const { buildManifest, getBackgroundLibraries } = require('../scripts/prepare-manifest');

const ROOT = path.join(__dirname, '..');

describe('getBackgroundLibraries', () => {
  test('lists the files loaded by importScripts in background.js, and they exist', () => {
    const libraries = getBackgroundLibraries();
    expect(libraries).toContain('lib/storage-manager.js');
    for (const file of libraries) {
      expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
    }
  });
});

describe('buildManifest', () => {
  test('firefox runs the libraries then background.js as background scripts', () => {
    const manifest = buildManifest('firefox');
    expect(manifest.background).toEqual({
      scripts: [...getBackgroundLibraries(), 'background/background.js']
    });
    expect(manifest.browser_specific_settings.gecko.id).toBe('tabspin@firefox.extension');
  });

  test('chrome uses the service worker and no Firefox settings', () => {
    const manifest = buildManifest('chrome');
    expect(manifest.background).toEqual({ service_worker: 'background/background.js' });
    expect(manifest).not.toHaveProperty('browser_specific_settings');
  });

  test('does not modify the source manifest', () => {
    const before = fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8');
    buildManifest('firefox');
    buildManifest('chrome');
    expect(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')).toBe(before);
  });

  test('rejects unknown targets', () => {
    expect(() => buildManifest('safari')).toThrow();
  });
});
