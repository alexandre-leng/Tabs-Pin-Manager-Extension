/**
 * Tests for the shared open/pin logic behind openAllTabs and openCategoryTabs.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadBackground(existingTabs) {
  const createdTabs = [];
  const updatedTabs = [];
  // Absorbs any browser.*.addListener(...) style call made while the script loads
  const anything = () => new Proxy(function () {}, { get: () => anything(), apply: () => undefined });
  const browser = new Proxy({
    tabs: {
      query: async () => existingTabs,
      get: async (id) => existingTabs.find(t => t.id === id)
    }
  }, { get: (target, key) => (key in target ? target[key] : anything()) });

  class StorageManager {
    async healthCheck() { return { healthy: true }; }
    async get() { return {}; }
    async set() {}
  }
  class ContainerUtils {
    constructor() { this.initializationPromise = Promise.resolve(); }
    async updateTabWithContainer(id, props) {
      updatedTabs.push({ id, props });
      return { id, ...props };
    }
    async createTabWithContainer(options) {
      const tab = { id: 100 + createdTabs.length, ...options };
      createdTabs.push(tab);
      return tab;
    }
  }

  const context = vm.createContext({
    browser, StorageManager, ContainerUtils, URL, console, setTimeout, clearTimeout,
    DomainUtils: {}, DefaultCategories: {}
  });
  const source = fs.readFileSync(path.join(__dirname, '../background/background.js'), 'utf8');
  vm.runInContext(source, context);
  const bg = vm.runInContext('new TabsPinBackground()', context);
  return { bg, createdTabs, updatedTabs };
}

const MESSAGES = { pinned: 'p', alreadyOpen: 'a', none: 'n', opened: 'o', noAction: 'x' };

describe('openTabConfigs', () => {
  test('opens missing tabs as pinned and reports them', async () => {
    const { bg, createdTabs } = loadBackground([]);
    const result = await bg.openTabConfigs([{ url: 'https://a.com/' }, { url: 'https://b.com/' }], null, MESSAGES);

    expect(createdTabs.map(t => t.url)).toEqual(['https://a.com/', 'https://b.com/']);
    expect(createdTabs.every(t => t.pinned)).toBe(true);
    expect(result).toMatchObject({ success: true, opened: 2, failed: 0, message: 'o' });
  });

  test('skips tabs that are already open and pinned', async () => {
    const { bg, createdTabs } = loadBackground([{ id: 1, url: 'https://a.com/', pinned: true }]);
    const result = await bg.openTabConfigs([{ url: 'https://a.com/' }], null, MESSAGES);

    expect(createdTabs).toHaveLength(0);
    expect(result).toMatchObject({ opened: 0, skipped: 1, message: 'a' });
  });

  test('pins an existing unpinned tab instead of opening a duplicate', async () => {
    const { bg, createdTabs, updatedTabs } = loadBackground([{ id: 7, url: 'https://a.com/', pinned: false }]);
    const result = await bg.openTabConfigs([{ url: 'https://a.com/' }], null, MESSAGES);

    expect(createdTabs).toHaveLength(0);
    expect(updatedTabs).toEqual([{ id: 7, props: { pinned: true } }]);
    expect(result).toMatchObject({ opened: 0, pinned: 1, message: 'p' });
  });

  test('does not open the same URL twice in one call', async () => {
    const { bg, createdTabs } = loadBackground([]);
    await bg.openTabConfigs([{ url: 'https://a.com/' }, { url: 'https://a.com/' }], null, MESSAGES);

    expect(createdTabs).toHaveLength(1);
  });
});

describe('sortTabConfigs', () => {
  test('orders by `order`, then ordered before unordered, then by dateAdded', () => {
    const { bg } = loadBackground([]);
    const sorted = bg.sortTabConfigs([
      { id: 'late', dateAdded: '2024-02-01' },
      { id: 'two', order: 2 },
      { id: 'early', dateAdded: '2024-01-01' },
      { id: 'one', order: 1 }
    ]);

    expect(sorted.map(t => t.id)).toEqual(['one', 'two', 'early', 'late']);
  });
});

describe('sanitizeImportData', () => {
  const categories = [{ id: 'work', name: 'Work', icon: '💼' }];

  test('rejects data without the expected shape', () => {
    const { bg } = loadBackground([]);
    expect(() => bg.sanitizeImportData(null)).toThrow();
    expect(() => bg.sanitizeImportData({ tabs: [], categories, settings: [] })).toThrow();
    expect(() => bg.sanitizeImportData({ tabs: [], categories: [{ name: 'no id' }], settings: {} })).toThrow();
  });

  test('drops tabs without an http(s) URL and fixes field types', () => {
    const { bg } = loadBackground([]);
    const result = bg.sanitizeImportData({
      categories,
      settings: {},
      tabs: [
        { id: 'a', url: 'https://a.com/', title: 'A', category: 'work', order: 1 },
        { id: 'b', url: 'javascript:alert(1)' },
        { id: 'c', url: 'file:///etc/passwd' },
        'not a tab',
        { url: 'http://b.com/', category: 'missing', order: 'x', title: 42 }
      ]
    });

    expect(result.skipped).toBe(3);
    expect(result.tabs.map(t => t.url)).toEqual(['https://a.com/', 'http://b.com/']);
    const [, second] = result.tabs;
    expect(second.id).toMatch(/^tab_/);
    expect(second.category).toBe('work');
    expect(second.title).toBe('http://b.com/');
    expect(second).not.toHaveProperty('order');
  });

  test('makes duplicate tab IDs unique', () => {
    const { bg } = loadBackground([]);
    const { tabs } = bg.sanitizeImportData({
      categories,
      settings: {},
      tabs: [{ id: 'x', url: 'https://a.com/' }, { id: 'x', url: 'https://b.com/' }]
    });
    expect(new Set(tabs.map(t => t.id)).size).toBe(2);
  });
});
