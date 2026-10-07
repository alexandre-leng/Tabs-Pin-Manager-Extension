/**
 * Saved tabs, categories and settings: in-memory state backed by storage.
 * Every change is persisted and broadcast to the open extension pages.
 */

import { browser } from '../lib/browser-api.js';
import { getDefaultCategories } from '../lib/default-categories.js';
import { StorageManager } from '../lib/storage-manager.js';
import { sanitizeImportData } from './import-sanitizer.js';
import { log } from './log.js';
import { generateTabId, isValidUrl, sortTabConfigs } from './tab-utils.js';

const DATA_KEYS = ['pinnedTabs', 'categories', 'settings'];

export class DataStore {
  constructor(storage = new StorageManager()) {
    this.storage = storage;
    this.tabs = [];
    this.categories = [];
    this.settings = {};
  }

  async load(useCache = true) {
    const result = await this.storage.get(DATA_KEYS, useCache);
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

  async saveTab(tab) {
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
    if (index >= 0) {
      this.tabs[index] = { ...this.tabs[index], ...saved };
    } else {
      this.tabs.push(saved);
    }
    await this.persist({ pinnedTabs: this.tabs }, 'tabsChanged');
    return saved;
  }

  async deleteTab(tabId) {
    const remaining = this.tabs.filter(tab => tab.id !== tabId);
    if (remaining.length === this.tabs.length) {
      throw new Error('Tab not found');
    }
    this.tabs = remaining;
    await this.persist({ pinnedTabs: this.tabs }, 'tabsChanged');
  }

  /**
   * Assigns a contiguous order (0..n-1) following the given ID list. Tabs missing from
   * the list keep their relative position after the listed ones.
   */
  async reorderTabs(tabIds) {
    if (!Array.isArray(tabIds)) {
      throw new Error('tabIds must be an array');
    }
    const byId = new Map(this.tabs.map(tab => [tab.id, tab]));
    const listed = [...new Set(tabIds)].filter(id => byId.has(id)).map(id => byId.get(id));
    const listedIds = new Set(listed.map(tab => tab.id));
    const remaining = sortTabConfigs(this.tabs.filter(tab => !listedIds.has(tab.id)));

    const orderById = new Map([...listed, ...remaining].map((tab, index) => [tab.id, index]));
    this.tabs = this.tabs.map(tab => ({ ...tab, order: orderById.get(tab.id) }));
    await this.persist({ pinnedTabs: this.tabs }, 'tabsChanged');
    return this.tabs;
  }

  async saveCategories(categories) {
    if (!Array.isArray(categories) || categories.some(c => !c.id || !c.name || !c.icon)) {
      throw new Error('Invalid category data');
    }
    this.categories = categories;
    await this.persist({ categories: this.categories }, 'categoriesChanged');
    return this.categories;
  }

  async recordLastOpened() {
    this.settings.lastOpened = new Date().toISOString();
    await this.storage.set({ settings: this.settings });
  }

  /** Replaces everything with a validated backup. */
  async importAll(data) {
    const sanitized = sanitizeImportData(data);
    this.tabs = sanitized.tabs;
    this.categories = sanitized.categories;
    this.settings = { ...this.settings, ...sanitized.settings };
    await this.persist({ pinnedTabs: this.tabs, categories: this.categories, settings: this.settings }, 'dataChanged');
    return { imported: this.tabs.length, skipped: sanitized.skipped };
  }

  /** First install: create defaults, but never overwrite existing (restored or synced) data. */
  async initializeDefaults() {
    const existing = await this.storage.get(DATA_KEYS, false);
    const defaults = {};
    if (!Array.isArray(existing.pinnedTabs)) defaults.pinnedTabs = [];
    if (!Array.isArray(existing.categories) || existing.categories.length === 0) {
      defaults.categories = getDefaultCategories(browser.i18n);
    }
    if (!existing.settings) defaults.settings = {};

    if (Object.keys(defaults).length > 0) {
      await this.storage.set(defaults);
      await this.load(false);
    }
  }

  /** Extension update: translate untouched default category names, fill missing tab fields. */
  async migrate() {
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
      await this.storage.set({ categories: this.categories });
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
      await this.storage.set({ pinnedTabs: this.tabs });
    }
  }

  async persist(data, changeType) {
    await this.storage.set(data);
    this.notifyDataChange(changeType);
  }

  /** Tells the open popup / options pages to refresh. */
  notifyDataChange(changeType) {
    browser.runtime.sendMessage({ action: 'dataChanged', changeType, data: this.snapshot() })
      .catch(() => log('No receivers for data change notification'));
  }
}
