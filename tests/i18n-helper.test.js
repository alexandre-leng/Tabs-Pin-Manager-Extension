/**
 * Tests for i18n-helper.js
 * Uses a mock browser.i18n API for testing outside Firefox.
 */

// Mock browser API
const i18nMessages = {};
global.browser = {
  i18n: {
    getMessage(key, substitutions) {
      const msg = i18nMessages[key];
      if (!msg) return '';
      let text = msg;
      if (substitutions) {
        substitutions.forEach((sub, i) => {
          text = text.replace('$' + (i + 1), sub);
        });
      }
      return text;
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
  describe('msg', () => {
    test('returns message when key exists', () => {
      setMessage('testKey', 'Hello World');
      expect(I18nHelper.msg('testKey')).toBe('Hello World');
    });

    test('returns fallback when key missing', () => {
      expect(I18nHelper.msg('missingKey', 'Fallback')).toBe('Fallback');
    });

    test('returns key when no fallback and key missing', () => {
      expect(I18nHelper.msg('missingKey')).toBe('missingKey');
    });
  });

  describe('msgSub', () => {
    test('returns substituted message', () => {
      setMessage('greeting', 'Hello $1');
      expect(I18nHelper.msgSub('greeting', ['World'])).toBe('Hello World');
    });

    test('handles multiple substitutions', () => {
      setMessage('count', '$1 of $2');
      expect(I18nHelper.msgSub('count', ['3', '10'])).toBe('3 of 10');
    });
  });

  describe('placeholder', () => {
    test('returns placeholder message', () => {
      setMessage('placeholderUrl', 'https://example.com');
      expect(I18nHelper.placeholder('url')).toBe('https://example.com');
    });
  });
});
