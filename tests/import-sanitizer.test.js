import { sanitizeImportData } from '../background/import-sanitizer.js';

const categories = [{ id: 'work', name: 'Work', icon: '💼' }];

test('rejects data without the expected shape', () => {
  expect(() => sanitizeImportData(null)).toThrow();
  expect(() => sanitizeImportData({ tabs: [], categories, settings: [] })).toThrow();
  expect(() => sanitizeImportData({ tabs: [], categories: [{ name: 'no id' }], settings: {} })).toThrow();
});

test('drops tabs without an http(s) URL and fixes field types', () => {
  const result = sanitizeImportData({
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

test('drops container IDs from older backups', () => {
  const { tabs } = sanitizeImportData({
    categories, settings: {}, tabs: [{ id: 'a', url: 'https://a.com/', cookieStoreId: 'firefox-container-1' }]
  });
  expect(tabs[0]).not.toHaveProperty('cookieStoreId');
});

test('makes duplicate tab IDs unique', () => {
  const { tabs } = sanitizeImportData({
    categories, settings: {}, tabs: [{ id: 'x', url: 'https://a.com/' }, { id: 'x', url: 'https://b.com/' }]
  });
  expect(new Set(tabs.map(t => t.id)).size).toBe(2);
});

test('drops unnamed categories, which would block every later category save', () => {
  const result = sanitizeImportData({
    tabs: [{ url: 'https://a.com', category: 'x' }],
    categories: [{ id: 'work', name: 'Work' }, { id: 'x', name: '  ' }],
    settings: {}
  });
  expect(result.categories.map(c => c.id)).toEqual(['work']);
  expect(result.tabs[0].category).toBe('work');
});

test('keeps only a valid past lastOpened date', () => {
  const settingsOf = settings => sanitizeImportData({ tabs: [], categories: [{ id: 'w', name: 'W' }], settings }).settings;
  expect(settingsOf({ lastOpened: '2024-05-01T10:00:00.000Z', junk: 1 })).toEqual({ lastOpened: '2024-05-01T10:00:00.000Z' });
  expect(settingsOf({ lastOpened: 5 })).toEqual({});
  expect(settingsOf({ lastOpened: 'garbage' })).toEqual({});
  expect(settingsOf({ lastOpened: '3000-01-01' })).toEqual({});
});
