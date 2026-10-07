/**
 * Tabs Pin — i18n Helper
 * Page localization shared by the popup and options pages.
 */

import { browser } from './browser-api.js';

export const I18nHelper = {
  /**
   * Translates the text, title and placeholder of every element under `root` carrying
   * data-i18n, data-i18n-title (also its aria-label, if any) or data-i18n-placeholder.
   * Elements keep their HTML text
   * when a key has no translation.
   * @param {ParentNode} root
   */
  localizePage(root) {
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
