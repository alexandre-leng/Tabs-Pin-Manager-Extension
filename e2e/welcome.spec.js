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

/** Waits for a page opened by the action under test, not the welcome tab opened on install. */
async function waitForNewPage(context, before, part) {
  let found;
  await expect.poll(async () => {
    found = context.pages().find(page => !before.has(page) && page.url().includes(part));
    return Boolean(found);
  }, { timeout: 5000 }).toBe(true);
  await found.waitForLoadState();
  return found;
}

test('the welcome page tells what the extension is for, in three steps', async ({ openPage }) => {
  const page = await openPage('welcome/welcome.html');

  await expect(page.locator('h1')).toHaveText('How Tabs Pin works');
  await expect(page.locator('.welcome-intro')).toContainText('Reopen them in one click');
  await expect(page.locator('.welcome-step')).toHaveCount(3);
  await expect(page.locator('.step-title-text')).toHaveText([
    'Save a page',
    'Reopen them anytime',
    'Keep them apart'
  ]);
  await expect(page.locator('.step-icon')).toHaveCount(3);
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

test('Escape closes the welcome page, and the title takes the focus', async ({ openPage }) => {
  const page = await openPage('welcome/welcome.html');
  await expect(page.locator('.welcome-title')).toBeFocused();

  const closed = page.waitForEvent('close');
  // keydown closes the tab: there is no page left to receive the keyup
  await page.keyboard.down('Escape');
  await closed;
});

test('the popup help link reopens the welcome page', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const popup = await openPage('popup/popup.html');

  const link = popup.locator('.help-link');
  await expect(link).toHaveAttribute('aria-label', 'How it works');
  await expect(link).toHaveAttribute('href', '../welcome/welcome.html');

  const before = new Set(popup.context().pages());
  await link.click();
  const welcome = await waitForNewPage(popup.context(), before, '/welcome/welcome.html');
  await expect(welcome.locator('h1')).toHaveText('How Tabs Pin works');
});

test('the options page footer links back to the welcome page', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const options = await openPage('options/options.html');

  const before = new Set(options.context().pages());
  await options.locator('.footer-links a', { hasText: 'How it works' }).click();
  const welcome = await waitForNewPage(options.context(), before, '/welcome/welcome.html');
  await expect(welcome.locator('h1')).toHaveText('How Tabs Pin works');
});
