/**
 * Automated accessibility audit (axe-core, WCAG 2.1 A and AA) of every screen.
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, sampleTabs, test } from './fixtures.js';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoViolations(page, include) {
  const builder = new AxeBuilder({ page }).withTags(WCAG);
  if (include) builder.include(include);
  const { violations } = await builder.analyze();
  const summary = violations.map(v => `${v.id}: ${v.help} -> ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);
  expect(summary).toEqual([]);
}

for (const scheme of ['light', 'dark']) {
  test.describe(`${scheme} theme`, () => {
    test.beforeEach(async ({ context }) => {
      await context.pages()[0]?.emulateMedia({ colorScheme: scheme });
    });

    const open = async (openPage, file) => {
      const page = await openPage(file);
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      return page;
    };

    test('popup', async ({ openPage, seed }) => {
      await seed({ tabs: sampleTabs(3) });
      await expectNoViolations(await open(openPage, 'popup/popup.html'));
    });

    test('popup empty state', async ({ openPage, seed }) => {
      await seed({ tabs: [] });
      await expectNoViolations(await open(openPage, 'popup/popup.html'));
    });

    test('options page', async ({ openPage, seed }) => {
      await seed({ tabs: sampleTabs(3) });
      await expectNoViolations(await open(openPage, 'options/options.html'));
    });

    test('tab form', async ({ openPage, seed }) => {
      await seed({ tabs: sampleTabs(1) });
      const page = await open(openPage, 'options/options.html');
      await page.locator('#addTabBtn').click();
      await expect(page.locator('#tabModalOverlay')).toHaveClass(/show/);
      await expectNoViolations(page, '#tabModalOverlay');
    });

    test('category editor and icon picker', async ({ openPage, seed }) => {
      await seed({ tabs: sampleTabs(1) });
      const page = await open(openPage, 'options/options.html');
      await page.locator('.category-item').first().click();
      await expect(page.locator('#categoryModalOverlay')).toHaveClass(/show/);
      await expectNoViolations(page, '#categoryModalOverlay');
      await page.locator('#iconSelectorBtn').click();
      await expect(page.locator('#iconPickerOverlay')).toHaveClass(/show/);
      await expectNoViolations(page, '#iconPickerOverlay');
    });
  });
}

test.describe('keyboard', () => {
  const focusedId = page => page.evaluate(() => document.activeElement?.id || document.activeElement?.className);

  test('dialogs take the focus, Escape closes the top one and gives the focus back', async ({ openPage, seed }) => {
    await seed({ tabs: sampleTabs(1) });
    const page = await openPage('options/options.html');

    await page.locator('#addTabBtn').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#tabUrl')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#tabModalOverlay')).toBeHidden();
    await expect(page.locator('#addTabBtn')).toBeFocused();

    // Category card: reachable and activated with the keyboard
    await page.locator('.category-item').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#categoryName')).toBeFocused();
    await page.locator('#iconSelectorBtn').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#iconSearchInput')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('#iconPickerOverlay')).toBeHidden();
    await expect(page.locator('#categoryModalOverlay')).toBeVisible();
    expect(await focusedId(page)).toBe('iconSelectorBtn');

    await page.keyboard.press('Escape');
    await expect(page.locator('#categoryModalOverlay')).toBeHidden();
    await expect(page.locator('.category-item').first()).toBeFocused();
  });

  test('the category of a tab can be changed without a mouse', async ({ openPage, seed }) => {
    await seed({ tabs: sampleTabs(1) });
    const page = await openPage('options/options.html');

    await page.locator('.tab-item .tab-category').focus();
    await page.keyboard.press('Enter');
    const select = page.locator('.category-quick-edit-popover:not(#categoryQuickEditPopoverTemplate) select');
    await expect(select).toBeFocused();
    await select.selectOption('personal');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('.tab-item .tab-category')).toContainText('Personal');
  });

  test('a popup category opens its tabs from the keyboard', async ({ openPage, seed }) => {
    await seed({ tabs: sampleTabs(2) });
    const popup = await openPage('popup/popup.html');
    await popup.locator('#categoriesList .category-item').first().focus();
    await popup.keyboard.press('Enter');
    await expect(popup.locator('#toastMessage')).toHaveText('Opened 2 tabs');
  });
});
