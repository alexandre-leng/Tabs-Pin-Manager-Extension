/**
 * Tests for the toast shown after opening tabs from the popup.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadReporter() {
  const toasts = [];
  class PopupManager {
    showToast(type, icon, message) { toasts.push({ type, message }); }
  }
  const context = vm.createContext({
    PopupManager,
    browser: { i18n: { getMessage: (key) => key } },
    console
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../popup/tab-actions.js'), 'utf8'), context);
  return { popup: new PopupManager(), toasts };
}

describe('reportOpenResult', () => {
  test.each([
    [{ opened: 2 }, 'success', 'tabsOpenedCount', true],
    [{ opened: 1, skipped: 2 }, 'success', 'someTabsAlreadyOpen', true],
    [{ pinned: 1 }, 'success', 'tabsPinned', true],
    [{ pinned: 1, opened: 1 }, 'success', 'someTabsPinnedAndOpened', true],
    [{ skipped: 3 }, 'info', 'allTabsAlreadyOpen', false],
    [{ failed: 2 }, 'error', 'failedToOpenTabs', false],
    [{ failed: 1, skipped: 1 }, 'error', 'failedToOpenTabs', false]
  ])('%o shows %s "%s"', (response, type, message, opened) => {
    const { popup, toasts } = loadReporter();
    expect(popup.reportOpenResult(response)).toBe(opened);
    expect(toasts).toEqual([{ type, message }]);
  });

  test('uses the caller failure message', () => {
    const { popup, toasts } = loadReporter();
    popup.reportOpenResult({ failed: 1 }, 'failedToOpenCategoryTabs');
    expect(toasts[0].message).toBe('failedToOpenCategoryTabs');
  });
});
