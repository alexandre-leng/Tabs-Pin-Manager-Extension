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

test('adds a category from the category modal', async ({ openPage, seed }) => {
  await seed({ tabs: sampleTabs(1) });
  const options = await openPage('options/options.html');

  await options.locator('#addCategoryBtn').click();
  await expect(options.locator('#categoryModalTitle')).toHaveText('Add Category');
  await options.locator('#categoryName').fill('Clients 2026');
  await options.locator('#saveCategoryBtn').click();

  await expect(options.locator('#categoryModalOverlay')).toBeHidden();
  await expect(options.locator('.category-item', { hasText: 'Clients 2026' })).toContainText('📁');
  const { categories } = await savedData(options);
  expect(categories.at(-1)).toEqual({ id: 'clients-2026', name: 'Clients 2026', icon: '📁' });
  // Below the limit the add button keeps the focus, ready for another category
  await expect(options.locator('#addCategoryBtn')).toBeFocused();

  // The new category is offered straight away when adding or moving a tab
  await options.locator('#addTabBtn').click();
  await expect(options.locator('#tabCategory option', { hasText: 'Clients 2026' })).toHaveCount(1);
});

test('stops at 20 categories, and keeps the focus on the last one created', async ({ openPage, seed }) => {
  const categories = Array.from({ length: 19 }, (_, i) => ({ id: `cat${i}`, name: `Category ${i}`, icon: '📁' }));
  await seed({ categories });
  const options = await openPage('options/options.html');

  await options.locator('#addCategoryBtn').click();
  await options.locator('#categoryName').fill('Last One');
  await options.locator('#saveCategoryBtn').click();

  await expect(options.locator('.category-item')).toHaveCount(20);
  await expect(options.locator('#addCategoryBtn')).toBeDisabled();
  await expect(options.locator('#categoryLimitHint')).toHaveText('Maximum of 20 categories reached');
  // The add button is disabled now: the keyboard lands on the new card instead
  await expect(options.locator('[data-category-id="last-one"]')).toBeFocused();
});

test('refuses a name already used, and keeps the IDs distinct', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const options = await openPage('options/options.html');
  for (const name of ['Work', 'Work']) {
    await options.locator('#addCategoryBtn').click();
    await options.locator('#categoryName').fill(name);
    await options.locator('#saveCategoryBtn').click();
    await expect(options.locator('#categoryModalOverlay')).toBeHidden();
  }
  const { categories } = await savedData(options);
  expect(categories.map(c => c.id)).toEqual(['work', 'personal', 'work-2', 'work-3']);
  expect(new Set(categories.map(c => c.id)).size).toBe(categories.length);
});

test('shows markup typed in a category name as text', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const options = await openPage('options/options.html');
  const name = '<img src=x onerror="window.__xss=1">';

  await options.locator('#addCategoryBtn').click();
  await options.locator('#categoryName').fill(name);
  await options.locator('#saveCategoryBtn').click();

  await expect(options.locator('.category-item', { hasText: 'onerror' })).toHaveCount(1);
  expect(await options.evaluate(() => window.__xss)).toBeUndefined();
});

test('wraps a very long category name inside its card', async ({ openPage, seed }) => {
  await seed({ tabs: [] });
  const options = await openPage('options/options.html');
  await options.setViewportSize({ width: 1024, height: 800 });

  await options.locator('#addCategoryBtn').click();
  await options.locator('#categoryName').fill('A'.repeat(120));
  await options.locator('#saveCategoryBtn').click();

  await expect(options.locator('.category-item')).toHaveCount(3);
  const overflow = await options.evaluate(() => ({
    body: document.documentElement.scrollWidth - window.innerWidth,
    cards: [...document.querySelectorAll('.category-item')]
      .map(card => card.scrollWidth - card.clientWidth)
  }));
  expect(overflow.cards.every(delta => delta <= 1)).toBe(true);
  expect(overflow.body).toBeLessThanOrEqual(1);
});

test('resets at the limit, and the tabs of removed categories move to the first one', async ({ openPage, seed }) => {
  const categories = Array.from({ length: 20 }, (_, i) => ({ id: `cat${i}`, name: `Category ${i}`, icon: '📁' }));
  await seed({ tabs: sampleTabs(3, 'cat3'), categories });
  const options = await openPage('options/options.html');
  await expect(options.locator('#addCategoryBtn')).toBeDisabled();

  options.once('dialog', dialog => dialog.accept());
  await options.locator('#resetCategoriesBtn').click();

  await expect(options.locator('.category-item')).toHaveCount(6);
  await expect(options.locator('#addCategoryBtn')).toBeEnabled();
  await expect(options.locator('#categoryLimitHint')).toBeHidden();
  await expect(options.locator('[data-category-id="work"] .category-count')).toHaveText('3 tabs');
  const { categories: saved, tabs } = await savedData(options);
  expect(saved.map(c => c.id)).toEqual(['work', 'personal', 'development', 'social', 'tools', 'entertainment']);
  expect(tabs.every(t => t.category === 'work')).toBe(true);
});

test('keeps a backup with more than 20 categories readable and editable', async ({ openPage, seed }) => {
  const categories = Array.from({ length: 25 }, (_, i) => ({ id: `cat${i}`, name: `Category ${i}`, icon: '📁' }));
  await seed({ tabs: [], categories });
  const options = await openPage('options/options.html');

  await expect(options.locator('.category-item')).toHaveCount(25);
  await expect(options.locator('#addCategoryBtn')).toBeDisabled();
  await options.locator('.category-item').first().click();
  await options.locator('#categoryName').fill('Renamed');
  await options.locator('#saveCategoryBtn').click();

  await expect(options.locator('.category-item', { hasText: 'Renamed' })).toHaveCount(1);
  expect((await savedData(options)).categories).toHaveLength(25);
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
