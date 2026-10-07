import { TabActions } from '../background/tab-actions.js';
import { installFakeBrowser, uninstallFakeBrowser } from './helpers/fake-browser.js';

afterEach(uninstallFakeBrowser);

describe('TabActions.openTabs', () => {
  test('opens missing tabs as pinned, in the background', async () => {
    const fake = installFakeBrowser();
    const result = await new TabActions().openTabs([{ url: 'https://a.com/' }, { url: 'https://b.com/' }]);

    expect(fake.created.map(t => [t.url, t.pinned, t.active])).toEqual([
      ['https://a.com/', true, false], ['https://b.com/', true, false]
    ]);
    expect(result).toEqual({ success: true, opened: 2, pinned: 0, skipped: 0, failed: 0 });
  });

  test('skips tabs already open and pinned', async () => {
    const fake = installFakeBrowser({ openTabs: [{ id: 1, url: 'https://a.com/', pinned: true }] });
    const result = await new TabActions().openTabs([{ url: 'https://a.com/' }]);

    expect(fake.created).toHaveLength(0);
    expect(result).toMatchObject({ opened: 0, skipped: 1 });
  });

  test('pins an open unpinned tab instead of opening a duplicate', async () => {
    const fake = installFakeBrowser({ openTabs: [{ id: 7, url: 'https://a.com/', pinned: false }] });
    const result = await new TabActions().openTabs([{ url: 'https://a.com/' }]);

    expect(fake.created).toHaveLength(0);
    expect(fake.updated).toEqual([{ id: 7, props: { pinned: true } }]);
    expect(result).toMatchObject({ opened: 0, pinned: 1 });
  });

  test('opens a URL once even when configured twice', async () => {
    const fake = installFakeBrowser();
    await new TabActions().openTabs([{ url: 'https://a.com/' }, { url: 'https://a.com/' }]);
    expect(fake.created).toHaveLength(1);
  });

  test('does not reopen a tab created a moment ago by a previous click', async () => {
    const fake = installFakeBrowser();
    const actions = new TabActions();
    await actions.openTabs([{ url: 'https://a.com/' }]);
    const second = await actions.openTabs([{ url: 'https://a.com/' }]);
    expect(fake.created).toHaveLength(1);
    expect(second).toMatchObject({ opened: 0, skipped: 1 });
  });

  test('counts tabs that failed to open', async () => {
    const fake = installFakeBrowser();
    fake.tabs.create = async () => { throw new Error('blocked'); };
    const result = await new TabActions().openTabs([{ url: 'https://a.com/' }]);
    expect(result).toMatchObject({ opened: 0, failed: 1 });
  });
});

describe('TabActions.closePinnedTabs', () => {
  test('closes pinned tabs of the configured domains only', async () => {
    const fake = installFakeBrowser({
      openTabs: [
        { id: 1, url: 'https://www.github.com/org', pinned: true },
        { id: 2, url: 'https://github.com/other', pinned: false },
        { id: 3, url: 'https://example.com/', pinned: true }
      ]
    });
    const result = await new TabActions().closePinnedTabs([{ url: 'https://github.com/' }]);

    expect(fake.removed).toEqual([1]);
    expect(result).toEqual({ success: true, closed: 1, failed: 0, skipped: 2 });
  });
});
