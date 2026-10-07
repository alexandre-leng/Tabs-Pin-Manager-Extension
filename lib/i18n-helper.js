/**
 * Tabs Pin — i18n Helper
 * Page localization shared by the popup and options pages.
 */

'use strict';

const I18nHelper = {
  /**
   * Translates the text, title and placeholder of every element under `root` carrying
   * data-i18n, data-i18n-title or data-i18n-placeholder. Elements keep their HTML text
   * when a key has no translation.
   * @param {ParentNode} root
   */
  localizePage(root) {
    const bindings = [
      ['data-i18n', (element, message) => { element.textContent = message; }],
      ['data-i18n-title', (element, message) => { element.title = message; }],
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

// Export for module contexts; also attach to window for non-module scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nHelper;
}
if (typeof self !== 'undefined') {
  self.I18nHelper = I18nHelper;
}
