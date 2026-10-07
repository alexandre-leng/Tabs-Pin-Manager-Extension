import { mixin } from '../lib/mixins.js';
import { OptionsManager } from '../options/options.js';
import { PopupManager } from '../popup/popup.js';

test('adds methods to the target', () => {
  class Page {}
  mixin(Page.prototype, { hello() { return 'hi'; } });
  expect(new Page().hello()).toBe('hi');
});

test('refuses to replace an existing method', () => {
  class Page { render() {} }
  expect(() => mixin(Page.prototype, { render() {} })).toThrow('"render" is already defined');
});

test('the popup and options pages compose without name clashes', () => {
  // Importing the page classes runs their mixin() calls, which throw on a clash
  expect(typeof PopupManager.prototype.openAllTabs).toBe('function');
  expect(typeof OptionsManager.prototype.openIconPicker).toBe('function');
});
