/**
 * Tabs Pin — i18n Helper
 * Page localization shared by the popup and options pages.
 */

import { browser } from './browser-api.js';

// Languages written right to left. Own list first: some Chromium builds answer
// an empty `@@bidi_dir`, which would leave Arabic laid out left to right.
const RTL_LANGUAGES = new Set(['ar', 'dv', 'fa', 'he', 'ku', 'ps', 'sd', 'ug', 'ur', 'yi']);

export const I18nHelper = {
  /**
   * Translates the text, title and placeholder of every element under `root` carrying
   * data-i18n, data-i18n-title (also its aria-label, if any) or data-i18n-placeholder.
   * Elements keep their HTML text
   * when a key has no translation.
   * @param {ParentNode} root
   */
  localizePage(root) {
    // Language and writing direction of the UI (Arabic is right-to-left)
    const page = root.documentElement;
    if (page) {
      const uiLanguage = browser.i18n.getUILanguage() || '';
      page.lang = uiLanguage;
      page.dir = RTL_LANGUAGES.has(uiLanguage.split('-')[0].toLowerCase())
        ? 'rtl'
        : browser.i18n.getMessage('@@bidi_dir') || 'ltr';
    }
    const bindings = [
      ['data-i18n', (element, message) => { element.textContent = message; }],
      ['data-i18n-title', (element, message) => {
        element.title = message;
        // Icon-only buttons carry the same text as their accessible name
        if (element.hasAttribute('aria-label')) element.setAttribute('aria-label', message);
      }],
      ['data-i18n-placeholder', (element, message) => { element.placeholder = message; }]
    ];
    for (const [attribute, apply] of bindings) {
      root.querySelectorAll(`[${attribute}]`).forEach(element => {
        const message = browser.i18n.getMessage(element.getAttribute(attribute));
        if (message) apply(element, message);
      });
    }
  }
};
