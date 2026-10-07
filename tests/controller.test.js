import { TabsPinBackground } from '../background/controller.js';
import { installFakeBrowser, uninstallFakeBrowser } from './helpers/fake-browser.js';

let fake;

async function startedBackground() {
  const background = new TabsPinBackground().start();
  await background.ready;
  return background;
}

beforeEach(() => {
  fake = installFakeBrowser();
  fake.store.pinnedTabs = [
    { id: 'a', url: 'https://a.com/', category: 'work' },
    { id: 'b', url: 'https://b.com/', category: 'tools', enabled: false }
  ];
  fake.store.categories = [{ id: 'work', name: 'Work', icon: '💼' }];
});

afterEach(uninstallFakeBrowser);

test('answers ping', async () => {
  const background = await startedBackground();
  expect(await background.handleMessage({ action: 'ping' })).toEqual({ success: true, message: 'pong' });
});

test('returns the saved data', async () => {
  const background = await startedBackground();
  const response = await background.handleMessage({ action: 'getTabsData' });
  expect(response.success).toBe(true);
  expect(response.data.tabs.map(t => t.id)).toEqual(['a', 'b']);
});

test('opens only enabled tabs and records the time', async () => {
  const background = await startedBackground();
  const response = await background.handleMessage({ action: 'openAllTabs' });
  expect(response).toMatchObject({ success: true, opened: 1 });
  expect(fake.created.map(t => t.url)).toEqual(['https://a.com/']);
  expect(fake.store.settings.lastOpened).toEqual(expect.any(String));
});

test('reports errors instead of throwing', async () => {
  const background = await startedBackground();
  expect(await background.handleMessage({ action: 'openCategoryTabs', categoryId: 'none' }))
    .toEqual({ success: false, error: 'No tabs in this category' });
  expect(await background.handleMessage({ action: 'nope' }))
    .toEqual({ success: false, error: 'Unknown action' });
});

test('rejects a second open while the first one runs', async () => {
  const background = await startedBackground();
  let release;
  fake.tabs.query = () => new Promise(resolve => { release = () => resolve([]); });
  const first = background.handleMessage({ action: 'openAllTabs' });
  await new Promise(resolve => setTimeout(resolve, 0));
  const second = await background.handleMessage({ action: 'openAllTabs' });
  release();
  expect(second).toMatchObject({ success: false, error: expect.stringContaining('already in progress') });
  expect(await first).toMatchObject({ success: true });
});

test('reports an initialization failure to callers', async () => {
  fake.storage.local.get = async () => { throw new Error('quota exceeded'); };
  const background = new TabsPinBackground().start();
  await background.ready.catch(() => {});
  const response = await background.handleMessage({ action: 'getTabsData' });
  expect(response.success).toBe(false);
});

test('retries the initialization after a failure', async () => {
  const realGet = fake.storage.local.get;
  fake.storage.local.get = async () => { throw new Error('quota exceeded'); };
  const background = new TabsPinBackground().start();
  await background.ready.catch(() => {});
  expect((await background.handleMessage({ action: 'getTabsData' })).success).toBe(false);
  fake.storage.local.get = realGet;
  expect((await background.handleMessage({ action: 'getTabsData' })).success).toBe(true);
});
