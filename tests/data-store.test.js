import { DataStore } from '../background/data-store.js';
import { installFakeBrowser, uninstallFakeBrowser } from './helpers/fake-browser.js';

let fake;
let store;

beforeEach(async () => {
  fake = installFakeBrowser();
  fake.store.pinnedTabs = [
    { id: 'a', url: 'https://a.com/', order: 0 },
    { id: 'b', url: 'https://b.com/', order: 1 },
    { id: 'c', url: 'https://c.com/', order: 2 }
  ];
  fake.store.categories = [{ id: 'work', name: 'Work', icon: '💼' }];
  store = new DataStore();
  await store.load(false);
});

afterEach(uninstallFakeBrowser);

test('reorderTabs assigns a contiguous order and persists it', async () => {
  await store.reorderTabs(['c', 'a']);
  const order = Object.fromEntries(fake.store.pinnedTabs.map(t => [t.id, t.order]));
  expect(order).toEqual({ c: 0, a: 1, b: 2 });
});

test('saveTab adds a tab with defaults and notifies the pages', async () => {
  const saved = await store.saveTab({ url: 'https://d.com/', title: 'D' });
  expect(saved).toMatchObject({ category: 'work', enabled: true });
  expect(saved.id).toMatch(/^tab_/);
  expect(fake.store.pinnedTabs).toHaveLength(4);
  expect(fake.sentMessages.at(-1)).toMatchObject({ action: 'dataChanged', changeType: 'tabsChanged' });
});

test('saveTab rejects non-http URLs', async () => {
  await expect(store.saveTab({ url: 'javascript:alert(1)' })).rejects.toThrow('Invalid');
});

test('deleteTab removes the tab, and fails for an unknown ID', async () => {
  await store.deleteTab('b');
  expect(fake.store.pinnedTabs.map(t => t.id)).toEqual(['a', 'c']);
  await expect(store.deleteTab('zzz')).rejects.toThrow('Tab not found');
});

test('initializeDefaults keeps existing data', async () => {
  await store.initializeDefaults();
  expect(fake.store.pinnedTabs).toHaveLength(3);
  expect(fake.store.categories).toEqual([{ id: 'work', name: 'Work', icon: '💼' }]);
});

test('migrate translates untouched default category names only', async () => {
  fake.store.categories = [{ id: 'work', name: 'Work', icon: '💼' }, { id: 'tools', name: 'My tools', icon: '🔧' }];
  fake.i18n.getMessage = key => ({ work: 'Travail', tools: 'Outils' })[key] || '';
  await new DataStore().migrate();
  expect(fake.store.categories.map(c => c.name)).toEqual(['Travail', 'My tools']);
});

test('a load that overlaps a change keeps the newer state', async () => {
  const pendingLoad = store.load(false);
  await store.deleteTab('a');
  await pendingLoad;
  expect(store.tabs.map(t => t.id)).toEqual(['b', 'c']);
});

test('initializeDefaults does not overwrite data saved while it was reading', async () => {
  delete fake.store.pinnedTabs;
  const fresh = new DataStore();
  const pendingDefaults = fresh.initializeDefaults();
  await fresh.importAll({ tabs: [{ id: 'x', url: 'https://x.com/' }], categories: [{ id: 'work', name: 'Work' }], settings: {} });
  await pendingDefaults;
  expect(fake.store.pinnedTabs.map(t => t.id)).toEqual(['x']);
});

test('a failed write leaves the in-memory state untouched', async () => {
  fake.storage.local.set = async () => { throw new Error('quota exceeded'); };
  await expect(store.saveTab({ url: 'https://d.com/' })).rejects.toThrow('quota');
  await expect(store.deleteTab('a')).rejects.toThrow('quota');
  expect(store.tabs.map(t => t.id)).toEqual(['a', 'b', 'c']);
});

test('a load that read storage during a write does not replace the newer state', async () => {
  const realGet = fake.storage.local.get;
  let staleRead;
  fake.storage.local.get = async keys => {
    const stale = await realGet(keys);
    await new Promise(resolve => setTimeout(resolve, 20));
    return staleRead ? staleRead : stale;
  };
  const saving = store.saveTab({ url: 'https://d.com/' });
  await store.load(false);
  await saving;
  expect(store.tabs).toHaveLength(4);
});
