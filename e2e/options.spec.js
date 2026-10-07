import fs from 'node:fs';
import { expect, reloadPage, sampleTabs, savedData, test } from './fixtures.js';

const titles = page => page.locator('.tab-item .tab-title').allTextContents();

test('adds a tab from the form', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const options = await openPage('options/options.html');

  await options.locator('#addFirstTabBtn').click();
  await options.locator('#tabUrl').fill('https://new.example/page');
  await options.locator('#tabTitle').fill('New page');
  await options.locator('#tabCategory').selectOption('personal');
  await options.locator('#saveTabBtn').click();

  await expect(options.locator('.tab-item')).toHaveCount(1);
  await expect(options.locator('.tab-item .tab-title')).toHaveText('New page');
  const { tabs } = await savedData(options);
  expect(tabs).toEqual([expect.objectContaining({ url: 'https://new.example/page', category: 'personal' })]);
});

test('refuses a non-http URL', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const options = await openPage('options/options.html');
  await options.locator('#addFirstTabBtn').click();
  await options.locator('#tabUrl').fill('javascript:alert(1)');
  await options.locator('#saveTabBtn').click();
  expect((await savedData(options)).tabs).toEqual([]);
});

test('edits and deletes a tab', async ({ openPage, seed }) => {
  await seed({ tabs: sampleTabs(2) });
  const options = await openPage('options/options.html');

  await options.locator('.tab-item').first().getByRole('button', { name: 'Edit' }).click();
  await expect(options.locator('#tabModalTitle')).toHaveText('Edit Tab');
  await options.locator('#tabTitle').fill('Renamed');
  await options.locator('#saveTabBtn').click();
  await expect(options.locator('.tab-item .tab-title').first()).toHaveText('Renamed');

  options.once('dialog', dialog => dialog.accept());
  await options.locator('.tab-item').nth(1).getByRole('button', { name: 'Delete' }).click();
  await expect(options.locator('.tab-item')).toHaveCount(1);
  expect((await savedData(options)).tabs.map(t => t.title)).toEqual(['Renamed']);
});

test('reorders with the arrow buttons, and the order survives a reload', async ({ openPage, seed }) => {
  await seed({ tabs: sampleTabs(3) });
  const options = await openPage('options/options.html');

  await expect(options.locator('.tab-item').first().getByRole('button', { name: 'Move up' })).toBeDisabled();
  await options.locator('.tab-item').first().getByRole('button', { name: 'Move down' }).click();
  await expect.poll(() => titles(options)).toEqual(['Site 2', 'Site 1', 'Site 3']);

  await reloadPage(options);
  await expect.poll(() => titles(options)).toEqual(['Site 2', 'Site 1', 'Site 3']);
});

test('moves a tab from the top to the end by drag and drop', async ({ openPage, seed }) => {
  await seed({ tabs: sampleTabs(4) });
  const options = await openPage('options/options.html');
  await expect(options.locator('.tab-item')).toHaveCount(4);

  const last = options.locator('.tab-item').last();
  const box = await last.boundingBox();
  await options.locator('.tab-item').first().dragTo(last, {
    targetPosition: { x: box.width - 5, y: box.height - 5 }
  });

  await expect.poll(() => titles(options)).toEqual(['Site 2', 'Site 3', 'Site 4', 'Site 1']);
  await expect.poll(async () => (await savedData(options)).tabs
    .sort((a, b) => a.order - b.order).map(t => t.title)).toEqual(['Site 2', 'Site 3', 'Site 4', 'Site 1']);
});

test('changes the category of a tab from its badge', async ({ openPage, seed }) => {
  await seed({ tabs: sampleTabs(1) });
  const options = await openPage('options/options.html');

  await options.locator('.tab-item .tab-category').click();
  const popover = options.locator('.category-quick-edit-popover:not(#categoryQuickEditPopoverTemplate)');
  await popover.locator('select').selectOption('personal');
  await popover.getByRole('button', { name: 'Confirm' }).click();

  await expect(options.locator('.tab-item .tab-category')).toContainText('Personal');
  expect((await savedData(options)).tabs[0].category).toBe('personal');
});

test('renames a category and picks its icon', async ({ openPage, seed }) => {
  await seed({ tabs: sampleTabs(1) });
  const options = await openPage('options/options.html');

  await options.locator('.category-item', { hasText: 'Work' }).click();
  await options.locator('#categoryName').fill('Job');
  await options.getByRole('button', { name: 'Choose an icon' }).click();
  await options.locator('#iconSearchInput').fill('chart');
  await options.locator('#iconGrid').getByText('📊', { exact: true }).first().click();
  await options.locator('#saveCategoryBtn').click();

  await expect(options.locator('.category-item', { hasText: 'Job' })).toContainText('📊');
  const work = (await savedData(options)).categories.find(c => c.id === 'work');
  expect(work).toMatchObject({ name: 'Job', icon: '📊' });
});

test('exports then imports the settings, skipping invalid tabs', async ({ openPage, seed }, testInfo) => {
  await seed({ tabs: sampleTabs(2) });
  const options = await openPage('options/options.html');

  const downloadPromise = options.waitForEvent('download');
  await options.locator('#exportBtn').click();
  const exported = JSON.parse(fs.readFileSync(await (await downloadPromise).path(), 'utf8'));
  expect(exported.tabs.map(t => t.url)).toEqual(['https://site1.example/', 'https://site2.example/']);

  exported.tabs.push({ id: 'evil', url: 'javascript:alert(1)', title: 'Evil' });
  const file = testInfo.outputPath('backup.json');
  fs.writeFileSync(file, JSON.stringify(exported));
  await seed({ tabs: [] });
  await reloadPage(options);

  await options.locator('#importFileInput').setInputFiles(file);
  await expect(options.locator('.tab-item')).toHaveCount(2);
  expect((await savedData(options)).tabs.map(t => t.title)).toEqual(['Site 1', 'Site 2']);
});
