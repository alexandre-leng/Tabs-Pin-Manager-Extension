/**
 * Minimal Browser Polyfill for Chrome Compatibility
 * Maps the 'browser' namespace to 'chrome' if it's missing (Chrome/Edge/etc.)
 * and ensures basic Promise support for Chrome's callback-based APIs if needed.
 */

'use strict';

(function(global) {
  if (typeof global.browser === 'undefined') {
    if (typeof global.chrome !== 'undefined') {
      // In Manifest V3, many chrome.* APIs already return promises
      // This simple bridge works for most modern Chrome versions
      global.browser = global.chrome;
    } else {
      console.warn('⚠️ Browser Polyfill: Neither browser nor chrome namespace found');
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : self));
