/**
 * Tests for the toast shown after opening tabs from the popup.
 */

import { tabActions } from '../popup/tab-actions.js';

function makePopup() {
  const toasts = [];
  const popup = Object.assign(Object.create(tabActions), {
    showToast(type, icon, message) { toasts.push({ type, message }); }
  });
  return { popup, toasts };
}

beforeAll(() => {
  globalThis.browser = { i18n: { getMessage: key => key } };
});

afterAll(() => {
  delete globalThis.browser;
});

describe('reportOpenResult', () => {
  test.each([
    [{ opened: 2 }, 'success', 'tabsOpenedCount', true],
    [{ opened: 1, skipped: 2 }, 'success', 'someTabsAlreadyOpen', true],
    [{ pinned: 1 }, 'success', 'tabPinnedSingle', true],
    [{ pinned: 2 }, 'success', 'tabsPinned', true],
    [{ opened: 1 }, 'success', 'tabOpenedSingle', true],
    [{ pinned: 1, opened: 1 }, 'success', 'someTabsPinnedAndOpened', true],
    [{ skipped: 3 }, 'info', 'allTabsAlreadyOpen', false],
    [{ failed: 2 }, 'error', 'failedToOpenTabs', false],
    [{ failed: 1, skipped: 1 }, 'error', 'failedToOpenTabs', false]
  ])('%o shows %s "%s"', (response, type, message, opened) => {
    const { popup, toasts } = makePopup();
    expect(popup.reportOpenResult(response)).toBe(opened);
    expect(toasts).toEqual([{ type, message }]);
  });

  test('uses the caller failure message', () => {
    const { popup, toasts } = makePopup();
    popup.reportOpenResult({ failed: 1 }, 'failedToOpenCategoryTabs');
    expect(toasts[0].message).toBe('failedToOpenCategoryTabs');
  });
});
