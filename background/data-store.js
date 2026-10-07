/**
 * Saved tabs, categories and settings: in-memory state backed by storage.
 * Every change is persisted and broadcast to the open extension pages.
 */

import { browser } from '../lib/browser-api.js';
import { getDefaultCategories } from '../lib/default-categories.js';
import { StorageManager } from '../lib/storage-manager.js';
import { sanitizeImportData } from './import-sanitizer.js';
import { log } from './log.js';
import { generateTabId, isValidUrl, sortTabConfigs } from '../lib/tab-utils.js';

const DATA_KEYS = ['pinnedTabs', 'categories', 'settings'];

export class DataStore {
  constructor(storage = new StorageManager()) {
    this.storage = storage;
    this.tabs = [];
    this.categories = [];
    this.settings = {};
    // Incremented by every change, so a load that overlaps a change keeps the newer state
    this.revision = 0;
    // Changes run one at a time: each one reads and writes the state left by the previous
    this.queue = Promise.resolve();
  }

  /** Runs `operation` after every change queued before it. */
  serialize(operation) {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => {});
    return result;
  }

  async load(useCache = true) {
    const revision = this.revision;
    const result = await this.storage.get(DATA_KEYS, useCache);
    if (revision !== this.revision) return;
    this.tabs = result.pinnedTabs || [];
    this.categories = result.categories || getDefaultCategories(browser.i18n);
    this.settings = { ...result.settings };
  }

  snapshot() {
    return { tabs: this.tabs, categories: this.categories, settings: this.settings };
  }

  /** Enabled tabs, optionally of one category, in display order. */
  enabledTabs(categoryId = null) {
    return sortTabConfigs(this.tabs.filter(tab =>
      tab.enabled !== false && (categoryId === null || tab.category === categoryId)));
  }

  saveTab(tab) {
    return this.serialize(async () => {
      if (!tab || !tab.url || !isValidUrl(tab.url)) {
        throw new Error('Invalid tab data or URL');
      }
      const saved = {
        ...tab,
        id: tab.id || generateTabId(),
        dateAdded: tab.dateAdded || new Date().toISOString(),
        enabled: tab.enabled !== false,
        category: tab.category || this.categories[0]?.id || 'work'
      };

      const index = this.tabs.findIndex(t => t.id === saved.id);
      const merged = index >= 0 ? { ...this.tabs[index], ...saved } : saved;
      const tabs = index >= 0
        ? this.tabs.map((t, i) => (i === index ? merged : t))
        : [...this.tabs, merged];
      await this.persist({ pinnedTabs: tabs }, 'tabsChanged', () => { this.tabs = tabs; });
      return merged;
    });
  }

  deleteTab(tabId) {
    return this.serialize(async () => {
      const remaining = this.tabs.filter(tab => tab.id !== tabId);
      if (remaining.length === this.tabs.length) {
        throw new Error('Tab not found');
      }
      await this.persist({ pinnedTabs: remaining }, 'tabsChanged', () => { this.tabs = remaining; });
    });
  }

  /**
   * Assigns a contiguous order (0..n-1) following the given ID list. Tabs missing from
   * the list keep their relative position after the listed ones.
   */
  reorderTabs(tabIds) {
    return this.serialize(async () => {
      if (!Array.isArray(tabIds)) {
        throw new Error('tabIds must be an array');
      }
      const byId = new Map(this.tabs.map(tab => [tab.id, tab]));
      const listed = [...new Set(tabIds)].filter(id => byId.has(id)).map(id => byId.get(id));
      const listedIds = new Set(listed.map(tab => tab.id));
      const remaining = sortTabConfigs(this.tabs.filter(tab => !listedIds.has(tab.id)));

      const orderById = new Map([...listed, ...remaining].map((tab, index) => [tab.id, index]));
      const tabs = this.tabs.map(tab => ({ ...tab, order: orderById.get(tab.id) }));
      await this.persist({ pinnedTabs: tabs }, 'tabsChanged', () => { this.tabs = tabs; });
      return tabs;
    });
  }

  saveCategories(categories) {
    return this.serialize(async () => {
      if (!Array.isArray(categories) || categories.some(c => !c.id || !c.name || !c.icon)) {
        throw new Error('Invalid category data');
      }
      await this.persist({ categories }, 'categoriesChanged', () => { this.categories = categories; });
      return categories;
    });
  }

  recordLastOpened() {
    return this.serialize(async () => {
      const settings = { ...this.settings, lastOpened: new Date().toISOString() };
      await this.write({ settings }, () => { this.settings = settings; });
    });
  }

  /** Replaces everything with a validated backup. */
  importAll(data) {
    return this.serialize(async () => {
      const sanitized = sanitizeImportData(data);
      const settings = { ...this.settings, ...sanitized.settings };
      await this.persist(
        { pinnedTabs: sanitized.tabs, categories: sanitized.categories, settings },
        'dataChanged',
        () => {
          this.tabs = sanitized.tabs;
          this.categories = sanitized.categories;
          this.settings = settings;
        }
      );
      return { imported: sanitized.tabs.length, skipped: sanitized.skipped };
    });
  }

  /** First install: create defaults, but never overwrite existing (restored or synced) data. */
  initializeDefaults() {
    return this.serialize(async () => {
      const revision = this.revision;
      const existing = await this.storage.get(DATA_KEYS, false);
      // Data saved meanwhile (e.g. an import right after install) must not be overwritten
      if (revision !== this.revision) return;
      const defaults = {};
      if (!Array.isArray(existing.pinnedTabs)) defaults.pinnedTabs = [];
      if (!Array.isArray(existing.categories) || existing.categories.length === 0) {
        defaults.categories = getDefaultCategories(browser.i18n);
      }
      if (!existing.settings) defaults.settings = {};

      if (Object.keys(defaults).length > 0) {
        await this.write(defaults);
        await this.load(false);
      }
    });
  }

  /** Extension update: translate untouched default category names, fill missing tab fields. */
  migrate() {
    return this.serialize(async () => {
      await this.load();

      const translated = getDefaultCategories(browser.i18n);
      const english = getDefaultCategories(null);
      let categoriesChanged = false;
      this.categories = this.categories.map(category => {
        const target = translated.find(c => c.id === category.id);
        const original = english.find(c => c.id === category.id);
        // Only names never customized by the user are translated
        if (target && original && category.name === original.name && category.name !== target.name) {
          categoriesChanged = true;
          return { ...category, name: target.name };
        }
        return category;
      });
      if (categoriesChanged) {
        await this.write({ categories: this.categories });
      }

      let tabsChanged = false;
      this.tabs = this.tabs.map(tab => {
        if (tab.id && tab.enabled !== undefined && tab.dateAdded) return tab;
        tabsChanged = true;
        return {
          ...tab,
          id: tab.id || generateTabId(),
          enabled: tab.enabled !== undefined ? tab.enabled : true,
          dateAdded: tab.dateAdded || new Date().toISOString()
        };
      });
      if (tabsChanged) {
        await this.write({ pinnedTabs: this.tabs });
      }
    });
  }

  /** Saves, applies the change to the in-memory state and tells the open pages. */
  async persist(data, changeType, apply) {
    await this.write(data, apply);
    this.notifyDataChange(changeType);
  }

  /**
   * Writes to storage, then applies the change to memory: a failed write leaves the
   * in-memory state untouched. The revision moves before and after the write, so a load
   * that read storage at any point during it is discarded.
   */
  async write(data, apply) {
    this.revision++;
    try {
      await this.storage.set(data);
    } finally {
      this.revision++;
    }
    if (apply) apply();
  }

  /** Tells the open popup / options pages to refresh. */
  notifyDataChange(changeType) {
    browser.runtime.sendMessage({ action: 'dataChanged', changeType, data: this.snapshot() })
      .catch(() => log('No receivers for data change notification'));
  }
}
