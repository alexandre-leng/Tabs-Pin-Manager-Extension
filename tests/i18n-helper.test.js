/**
 * Tests for i18n-helper.js
 * Uses a mock browser.i18n API for testing outside Firefox.
 */

// Mock browser API
const i18nMessages = {};
global.browser = {
  i18n: {
    getMessage(key) {
      const msg = i18nMessages[key];
      if (!msg) return '';
      return msg;
    },
  },
};

/**
 * Helper to seed mock translations for tests.
 * Keeps message data outside browser.i18n so web-ext lint
 * does not flag unsupported internal properties.
 */
function setMessage(key, value) {
  i18nMessages[key] = value;
}

const I18nHelper = require('../lib/i18n-helper.js');

describe('I18nHelper', () => {
  describe('localizePage', () => {
    test('translates text, title and placeholder, keeping HTML text for unknown keys', () => {
      setMessage('hello', 'Bonjour');
      setMessage('tip', 'Astuce');
      setMessage('ph', 'Saisir');
      const make = (attribute, key) => {
        const element = {
          textContent: 'html', title: 'html', placeholder: 'html', ariaLabel: 'html',
          getAttribute: () => key,
          hasAttribute: name => name === 'aria-label',
          setAttribute(name, value) { if (name === 'aria-label') this.ariaLabel = value; }
        };
        return { attribute, element };
      };
      const items = [make('data-i18n', 'hello'), make('data-i18n-title', 'tip'),
        make('data-i18n-placeholder', 'ph'), make('data-i18n', 'unknownKey')];
      const root = {
        querySelectorAll: selector => items.filter(i => `[${i.attribute}]` === selector).map(i => i.element)
      };

      I18nHelper.localizePage(root);

      expect(items[0].element.textContent).toBe('Bonjour');
      expect(items[1].element.title).toBe('Astuce');
      expect(items[1].element.ariaLabel).toBe('Astuce');
      expect(items[2].element.placeholder).toBe('Saisir');
      expect(items[3].element.textContent).toBe('html');
    });
  });
});
