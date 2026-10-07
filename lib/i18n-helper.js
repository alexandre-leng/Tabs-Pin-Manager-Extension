/**
 * Tabs Pin — i18n Helper
 * Shared i18n utilities used by popup, options, and background.
 */

'use strict';

const I18nHelper = {
  /**
   * Get a localized message with fallback.
   * @param {string} key — i18n key
   * @param {string} [fallback] — fallback text if key not found
   * @returns {string}
   */
  msg(key, fallback) {
    return browser.i18n.getMessage(key) || fallback || key;
  },

  /**
   * Get a localized message with substitutions.
   * @param {string} key — i18n key
   * @param {Array<string>} subs — substitution values
   * @param {string} [fallback] — fallback text
   * @returns {string}
   */
  msgSub(key, subs, fallback) {
    return browser.i18n.getMessage(key, subs) || fallback || key;
  },

  /**
   * Get a localized placeholder for an input element.
   * @param {string} key — i18n key without 'placeholder' prefix
   * @param {string} fallback
   * @returns {string}
   */
  placeholder(key, fallback) {
    return this.msg('placeholder' + key.charAt(0).toUpperCase() + key.slice(1), fallback);
  },

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
