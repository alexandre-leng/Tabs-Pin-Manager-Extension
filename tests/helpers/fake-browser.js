/**
 * Minimal in-memory WebExtension API for unit tests, installed as globalThis.browser.
 */

export function installFakeBrowser({ openTabs = [] } = {}) {
  const fake = {
    created: [],
    updated: [],
    removed: [],
    sentMessages: [],
    store: {},
    tabs: {
      query: async () => openTabs,
      create: async options => {
        const tab = { id: 100 + fake.created.length, ...options };
        fake.created.push(tab);
        return tab;
      },
      update: async (id, props) => {
        fake.updated.push({ id, props });
        return { id, ...props };
      },
      remove: async id => { fake.removed.push(id); }
    },
    i18n: { getMessage: () => '' },
    runtime: {
      sendMessage: async message => { fake.sentMessages.push(message); },
      onMessage: { addListener() {} },
      onInstalled: { addListener() {} },
      onStartup: { addListener() {} }
    },
    storage: {
      local: {
        get: async keys => Object.fromEntries([keys].flat().filter(k => k in fake.store).map(k => [k, fake.store[k]])),
        set: async data => { Object.assign(fake.store, structuredClone(data)); },
        remove: async key => { delete fake.store[key]; }
      }
    }
  };
  globalThis.browser = fake;
  return fake;
}

export function uninstallFakeBrowser() {
  delete globalThis.browser;
}
