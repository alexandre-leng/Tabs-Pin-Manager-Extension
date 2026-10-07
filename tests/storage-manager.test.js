import { StorageManager } from '../lib/storage-manager.js';

/**
 * Tests for StorageManager
 * Verifies core logic without browser.storage API.
 */

globalThis.browser = {};
const browser = globalThis.browser;
browser.storage = {
  local: {
    _store: {},
    async get(keys) {
      return this._store;
    },
    async set(data) {
      Object.assign(this._store, data);
    },
    async remove(key) {
      delete this._store[key];
    },
    async clear() {
      this._store = {};
    },
  },
};


describe('StorageManager', () => {
  let storage;

  beforeEach(() => {
    browser.storage.local._store = {};
    storage = new StorageManager();
  });

  test('initializes with empty cache', () => {
    expect(storage.cache).toBeDefined();
    expect(storage.cache.size).toBe(0);
  });

  test('get returns data from storage', async () => {
    browser.storage.local._store = {
      pinnedTabs: [{ url: 'https://example.com', title: 'Test' }],
      settings: { theme: 'auto' },
    };

    const result = await storage.get(['pinnedTabs', 'settings']);
    expect(result.pinnedTabs).toBeDefined();
    expect(result.settings.theme).toBe('auto');
  });

  test('get caches results', async () => {
    browser.storage.local._store = { test: 'value' };
    await storage.get(['test']);
    await storage.get(['test']);
    expect(storage.cache.size).toBeGreaterThan(0);
  });

  test('set stores data and updates cache', async () => {
    await storage.set({ newKey: 'newValue' });
    expect(browser.storage.local._store.newKey).toBe('newValue');
  });

  test('healthCheck reports healthy when storage round-trips', async () => {
    const result = await storage.healthCheck();
    expect(result.healthy).toBe(true);
    expect(browser.storage.local._store.__storage_health_test__).toBeUndefined();
  });

  test('healthCheck reports unhealthy when reads do not match writes', async () => {
    const originalGet = browser.storage.local.get;
    browser.storage.local.get = async () => ({});
    const result = await storage.healthCheck();
    browser.storage.local.get = originalGet;
    expect(result.healthy).toBe(false);
  });

  test('cached reads return copies that callers can mutate safely', async () => {
    browser.storage.local._store = { pinnedTabs: [{ id: 'a' }] };
    const first = await storage.get(['pinnedTabs']);
    first.pinnedTabs.push({ id: 'b' });
    const second = await storage.get(['pinnedTabs']);
    expect(second.pinnedTabs).toEqual([{ id: 'a' }]);
  });

  test('retries transient failures', async () => {
    storage.retryDelay = 1;
    const originalSet = browser.storage.local.set;
    let calls = 0;
    browser.storage.local.set = async (data) => {
      calls++;
      if (calls === 1) throw new Error('temporary failure');
      return originalSet.call(browser.storage.local, data);
    };
    await storage.set({ key: 'value' });
    browser.storage.local.set = originalSet;
    expect(calls).toBe(2);
    expect(browser.storage.local._store.key).toBe('value');
  });

  test('does not retry critical failures', async () => {
    const originalSet = browser.storage.local.set;
    let calls = 0;
    browser.storage.local.set = async () => { calls++; throw new Error('QUOTA_BYTES quota exceeded'); };
    await expect(storage.set({ key: 'value' })).rejects.toThrow('quota');
    browser.storage.local.set = originalSet;
    expect(calls).toBe(1);
  });
});

test('a read overlapping a write does not cache stale data', async () => {
  const storage = new StorageManager();
  storage.throttleDelay = 0;
  browser.storage.local._store = { key: 'old' };
  let releaseRead;
  const originalGet = browser.storage.local.get;
  browser.storage.local.get = function () {
    const snapshot = { ...this._store };
    return new Promise(resolve => { releaseRead = () => resolve(snapshot); });
  };
  const staleRead = storage.get(['key']);
  await new Promise(resolve => setTimeout(resolve, 0));
  browser.storage.local.get = originalGet;
  await storage.set({ key: 'new' });
  releaseRead();
  expect((await staleRead).key).toBe('old');
  expect((await storage.get(['key'])).key).toBe('new');
});
