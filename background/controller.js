/**
 * Background controller: wires browser events to the data store and tab actions,
 * and answers the messages sent by the popup and options pages.
 */

import { browser } from '../lib/browser-api.js';
import { DataStore } from './data-store.js';
import { log } from './log.js';
import { TabActions } from './tab-actions.js';

export class TabsPinBackground {
  constructor({ store = new DataStore(), tabActions = new TabActions() } = {}) {
    this.store = store;
    this.tabActions = tabActions;
    this.runningOperations = new Set();
    this.ready = null;

    // Message handlers, by action name; each returns the response payload
    this.handlers = {
      ping: () => ({ message: 'pong' }),
      getTabsData: async ({ force }) => {
        await this.store.load(force !== true);
        return { data: this.store.snapshot() };
      },
      openAllTabs: ({ windowId }) => this.exclusive('openAllTabs', () => this.openAllTabs(windowId)),
      openCategoryTabs: ({ categoryId, windowId }) =>
        this.exclusive('openCategoryTabs', () => this.openCategoryTabs(categoryId, windowId)),
      closeCategoryTabs: ({ categoryId, windowId }) =>
        this.exclusive('closeCategoryTabs', () => this.closeCategoryTabs(categoryId, windowId)),
      saveTab: async ({ tab }) => ({ tab: await this.store.saveTab(tab) }),
      deleteTab: async ({ tabId }) => { await this.store.deleteTab(tabId); return {}; },
      reorderTabs: async ({ tabIds }) => ({ tabs: await this.store.reorderTabs(tabIds) }),
      saveCategories: async ({ categories }) => ({ categories: await this.store.saveCategories(categories) }),
      importAllData: ({ data }) => this.store.importAll(data)
    };
  }

  /**
   * Registers the listeners, then loads the data. Listeners must be registered
   * synchronously: a MV3 service worker woken up by an event only dispatches it to
   * listeners that exist after the first run of the script.
   */
  start() {
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request).then(sendResponse);
      return true; // the response is sent asynchronously
    });
    browser.runtime.onInstalled.addListener(details => this.handleInstalled(details));
    browser.runtime.onStartup.addListener(() => this.handleStartup());

    this.ready = this.initialize();
    this.ready.catch(error => console.error('Failed to initialize background script:', error));
    return this;
  }

  async initialize() {
    const health = await this.store.storage.healthCheck();
    if (!health.healthy) {
      console.warn('Storage health check failed:', health.error);
    }
    await this.store.load();
  }

  /** Runs the handler of `request.action`; never rejects. */
  async handleMessage(request) {
    const handler = this.handlers[request && request.action];
    if (!handler) {
      console.warn('Unknown action:', request && request.action);
      return { success: false, error: 'Unknown action' };
    }
    try {
      await this.ready;
      const result = await handler(request);
      return { success: true, ...result };
    } catch (error) {
      console.error(`Error handling "${request.action}":`, error);
      return { success: false, error: error.message };
    }
  }

  /** Rejects a second call of the same operation while the first one runs. */
  async exclusive(name, operation) {
    if (this.runningOperations.has(name)) {
      throw new Error(`${name} is already in progress. Please wait.`);
    }
    this.runningOperations.add(name);
    try {
      return await operation();
    } finally {
      this.runningOperations.delete(name);
    }
  }

  async openAllTabs(windowId) {
    if (this.store.tabs.length === 0) {
      throw new Error('No tabs configured');
    }
    const result = await this.tabActions.openTabs(this.store.enabledTabs(), windowId);
    await this.store.recordLastOpened();
    return result;
  }

  async openCategoryTabs(categoryId, windowId) {
    const configs = this.store.enabledTabs(categoryId);
    if (configs.length === 0) {
      throw new Error('No tabs in this category');
    }
    return this.tabActions.openTabs(configs, windowId);
  }

  async closeCategoryTabs(categoryId, windowId) {
    const configs = this.store.enabledTabs(categoryId);
    if (configs.length === 0) {
      throw new Error('No tabs in this category');
    }
    const result = await this.tabActions.closePinnedTabs(configs, windowId);
    if (!result.success && result.error) {
      throw new Error(result.error);
    }
    return result;
  }

  async handleInstalled(details) {
    try {
      await this.ready;
      log('Extension installed/updated:', details.reason);
      if (details.reason === 'install') {
        await this.store.initializeDefaults();
      } else if (details.reason === 'update') {
        await this.store.migrate();
      }
    } catch (error) {
      console.error('Error handling installation:', error);
    }
  }

  async handleStartup() {
    try {
      await this.ready;
      await this.store.load();
    } catch (error) {
      console.error('Error handling startup:', error);
    }
  }
}
