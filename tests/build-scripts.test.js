/**
 * Tests for the manifest preparation used by build, lint and dev.
 */

import fs from 'node:fs';
import path from 'node:path';
import { buildManifest } from '../scripts/prepare-manifest.js';

const ROOT = path.join(import.meta.dirname, '..');

describe('buildManifest', () => {
  test('firefox runs background.js as a module event page', () => {
    const manifest = buildManifest('firefox');
    expect(manifest.background).toEqual({ scripts: ['background/background.js'], type: 'module' });
    expect(manifest.browser_specific_settings.gecko.id).toBe('tabspin@firefox.extension');
  });

  test('chrome runs background.js as a module service worker, without Firefox settings', () => {
    const manifest = buildManifest('chrome');
    expect(manifest.background).toEqual({ service_worker: 'background/background.js', type: 'module' });
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
