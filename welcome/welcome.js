/**
 * Welcome page: what the extension does, in three steps.
 * Opened once when the extension is installed, and again from the popup or options page.
 */

import { browser } from '../lib/browser-api.js';
import { I18nHelper } from '../lib/i18n-helper.js';

document.addEventListener('DOMContentLoaded', () => {
  I18nHelper.localizePage(document);

  // Screen readers read the page from its title, and Tab then reaches the buttons
  const title = document.querySelector('.welcome-title');
  title.setAttribute('tabindex', '-1');
  title.focus();

  const closePage = async () => {
    // The page is a tab the extension opened itself, so it can close it
    try {
      const tab = await browser.tabs.getCurrent();
      if (tab?.id != null) {
        await browser.tabs.remove(tab.id);
        return;
      }
    } catch {
      // fall through to window.close
    }
    window.close();
  };

  document.getElementById('openOptionsBtn').addEventListener('click', () => browser.runtime.openOptionsPage());
  document.getElementById('closeBtn').addEventListener('click', closePage);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePage();
    }
  });

  // Tells the interface tests the page is localized and wired
  document.body.dataset.ready = 'true';
});
