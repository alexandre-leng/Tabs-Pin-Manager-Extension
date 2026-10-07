import { DEFAULT_CATEGORIES, expect, sampleTabs, savedData, test } from './fixtures.js';

test('shows the empty state when nothing is saved', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const popup = await openPage('popup/popup.html');
  await expect(popup.locator('#emptyState')).toBeVisible();
  await expect(popup.locator('#openAllBtn')).toBeHidden();
});

test('lists categories with their tab counts', async ({ openPage, seed }) => {
  await seed({ tabs: [...sampleTabs(2, 'work'), { id: 'p', url: 'https://p.example/', title: 'P', category: 'personal' }] });
  const popup = await openPage('popup/popup.html');

  await expect(popup.locator('#openAllBtn')).toContainText('Open 3 tabs');
  await expect(popup.locator('#pinnedTabsCount')).toHaveText('3');
  await expect(popup.locator('#categoriesList')).toContainText('Work');
  await expect(popup.locator('#categoriesList')).toContainText('2 tabs');
});

test('opens every saved tab as a pinned tab, once', async ({ context, openPage, seed }) => {
  await seed({ tabs: sampleTabs(3) });
  const popup = await openPage('popup/popup.html');

  await popup.locator('#openAllBtn').click();
  await expect(popup.locator('#toastMessage')).toHaveText('Opened 3 tabs');

  const pinnedUrls = async () => (await popup.evaluate(() => chrome.tabs.query({ pinned: true })))
    .map(tab => tab.pendingUrl || tab.url).sort();
  expect(await pinnedUrls()).toEqual(['https://site1.example/', 'https://site2.example/', 'https://site3.example/']);
  expect((await savedData(popup)).settings.lastOpened).toEqual(expect.any(String));

  // A second click does not open duplicates
  await popup.waitForTimeout(2100);
  await popup.locator('#openAllBtn').click();
  await expect(popup.locator('#toastMessage')).toHaveText('All tabs are already open and pinned');
  expect(await pinnedUrls()).toHaveLength(3);
});

test('closes the pinned tabs of a category after confirmation', async ({ openPage, seed }) => {
  await seed({ tabs: sampleTabs(2) });
  const popup = await openPage('popup/popup.html');
  await popup.locator('#openAllBtn').click();
  await expect(popup.locator('#toastMessage')).toHaveText('Opened 2 tabs');
  popup.once('dialog', dialog => dialog.accept());
  await popup.locator('.category-item', { hasText: 'Work' }).getByRole('button', { name: /close/i }).click();
  await expect(popup.locator('#toastMessage')).toContainText('Closed 2 pinned tab(s)');
  expect(await popup.evaluate(() => chrome.tabs.query({ pinned: true }))).toHaveLength(0);
});

test('opens the options page', async ({ context, openPage, seed }) => {
  await seed({ tabs: sampleTabs(1), categories: DEFAULT_CATEGORIES });
  const popup = await openPage('popup/popup.html');
  const optionsPage = context.waitForEvent('page');
  await popup.locator('#openOptionsMainBtn').click();
  expect((await optionsPage).url()).toContain('/options/options.html');
});
