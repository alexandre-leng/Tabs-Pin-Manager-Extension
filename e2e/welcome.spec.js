/**
 * Welcome page: what the extension does, and the ways back to it.
 */

import { expect, test } from './fixtures.js';

/** Waits for the page whose address contains `part`, ignoring the tab opened on install. */
async function waitForPage(context, part) {
  let found;
  await expect.poll(async () => {
    found = context.pages().find(page => page.url().includes(part));
    return Boolean(found);
  }, { timeout: 5000 }).toBe(true);
  await found.waitForLoadState();
  return found;
}

test('the welcome page tells what the extension is for, in three steps', async ({ openPage }) => {
  const page = await openPage('welcome/welcome.html');

  await expect(page.locator('h1')).toHaveText('How Tabs Pin works');
  await expect(page.locator('.welcome-intro')).toContainText('pinned tabs in one click');
  await expect(page.locator('.welcome-step')).toHaveCount(3);
  await expect(page.locator('.step-title')).toHaveText([
    'Pin a site',
    'Reopen them later',
    'Sort them by project'
  ]);
  await expect(page.locator('.welcome-privacy')).toContainText('no account, no server, no tracking');
  await expect(page.locator('#openOptionsBtn')).toHaveText('Open the options page');
});

test('the welcome page opens the options page', async ({ openPage }) => {
  const page = await openPage('welcome/welcome.html');

  await page.locator('#openOptionsBtn').click();
  const optionsPage = await waitForPage(page.context(), '/options/options.html');
  await expect(optionsPage.locator('#categoriesGrid')).toBeVisible();
});

test('"Got it" closes the welcome page', async ({ openPage }) => {
  const page = await openPage('welcome/welcome.html');

  const closed = page.waitForEvent('close');
  await page.locator('#closeBtn').click();
  await closed;
});

test('the popup help link reopens the welcome page', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const popup = await openPage('popup/popup.html');

  const link = popup.locator('.help-link');
  await expect(link).toHaveAttribute('aria-label', 'How it works');
  await expect(link).toHaveAttribute('href', '../welcome/welcome.html');

  const before = popup.context().pages().length;
  await link.click();
  const welcome = await waitForPage(popup.context(), '/welcome/welcome.html');
  expect(popup.context().pages().length).toBeGreaterThan(before);
  await expect(welcome.locator('h1')).toHaveText('How Tabs Pin works');
});

test('the options page footer links back to the welcome page', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const options = await openPage('options/options.html');

  await options.locator('.footer-links a', { hasText: 'How it works' }).click();
  const welcome = await waitForPage(options.context(), '/welcome/welcome.html');
  await expect(welcome.locator('h1')).toHaveText('How Tabs Pin works');
});
