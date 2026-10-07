/**
 * Fixtures giving each test a fresh browser profile with the extension loaded.
 */

import path from 'node:path';
import { test as base, chromium, expect } from '@playwright/test';

const EXTENSION_DIR = path.join(import.meta.dirname, '..', 'build', 'chrome');

export const test = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      reducedMotion: 'reduce',
      args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`]
    });
    // Keep tests offline and deterministic: sites opened by the extension get an empty
    // page (so their tab keeps its URL) and favicons fail, showing the fallback icon
    await context.route(/^https?:\/\//, route => route.request().resourceType() === 'document'
      ? route.fulfill({ contentType: 'text/html', body: '<title>Test page</title>' })
      : route.abort());
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    await use(worker.url().split('/')[2]);
  },

  /** Opens an extension page and fails the test on any uncaught page error. */
  openPage: async ({ context, extensionId }, use) => {
    const pages = [];
    await use(async (file) => {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      pages.push({ page, errors });
      await page.goto(`chrome-extension://${extensionId}/${file}`);
      await whenReady(page);
      return page;
    });
    for (const { errors } of pages) {
      expect(errors, 'uncaught page errors').toEqual([]);
    }
  },

  /** Replaces the saved data through the background script, like an import. */
  seed: async ({ openPage }, use) => {
    await use(async ({ tabs = [], categories = DEFAULT_CATEGORIES } = {}) => {
      const page = await openPage('options/options.html');
      const response = await page.evaluate(data => chrome.runtime.sendMessage({ action: 'importAllData', data }),
        { tabs, categories, settings: {} });
      expect(response.success).toBe(true);
      await page.close();
    });
  }
});

export const DEFAULT_CATEGORIES = [
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'personal', name: 'Personal', icon: '👤' }
];

export const sampleTabs = (count, category = 'work') => Array.from({ length: count }, (_, i) => ({
  id: `t${i + 1}`,
  url: `https://site${i + 1}.example/`,
  title: `Site ${i + 1}`,
  category,
  order: i
}));

/** Waits until the page finished loading its data and wiring its controls. */
export async function whenReady(page) {
  await page.locator('body[data-ready="true"]').waitFor();
}

/** Reloads an extension page and waits until it is interactive again. */
export async function reloadPage(page) {
  await page.reload();
  await whenReady(page);
}

/** Saved data, read from the background script. */
export async function savedData(page) {
  const response = await page.evaluate(() => chrome.runtime.sendMessage({ action: 'getTabsData', force: true }));
  return response.data;
}

export { expect };
