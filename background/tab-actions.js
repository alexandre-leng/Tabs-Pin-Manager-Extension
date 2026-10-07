/**
 * Opening, pinning and closing browser tabs for saved tab configurations.
 */

import { browser } from '../lib/browser-api.js';
import { getDomainMatchKey, isSameDomainOrSubdomain } from '../lib/domain-utils.js';
import { normalizeUrl } from './tab-utils.js';

// A URL opened less than this long ago is assumed to be still loading
const RECENTLY_OPENED_EXPIRY_MS = 2000;

export class TabActions {
  constructor() {
    // normalized URL -> time it was opened or found, to absorb rapid repeated clicks
    this.recentlyOpenedUrls = new Map();
    // tab ID -> URL of the tabs opened here: right after creation, the browser may not
    // report any address for a tab yet
    this.openedTabUrls = new Map();
  }

  /** Address of a tab, including one still loading (pendingUrl) or just created here. */
  urlOf(tab) {
    return tab.url || tab.pendingUrl || this.openedTabUrls.get(tab.id) || '';
  }

  /** Lists the tabs (of a window) and forgets the opened tabs that are gone. */
  async queryTabs(windowId) {
    const tabs = await browser.tabs.query(windowId ? { windowId } : {});
    if (!windowId) {
      const ids = new Set(tabs.map(tab => tab.id));
      for (const id of this.openedTabUrls.keys()) {
        if (!ids.has(id)) this.openedTabUrls.delete(id);
      }
    }
    return tabs;
  }

  /**
   * Opens the given configs as pinned tabs, pins the ones already open but unpinned and
   * skips the ones already open and pinned.
   * @returns {Promise<{success: true, opened: number, pinned: number, skipped: number, failed: number}>}
   */
  async openTabs(configs, windowId = null) {
    const now = Date.now();
    for (const [url, time] of this.recentlyOpenedUrls) {
      if (now - time > RECENTLY_OPENED_EXPIRY_MS) this.recentlyOpenedUrls.delete(url);
    }

    const existingTabs = await this.queryTabs(windowId);
    const { tabsToOpen, tabsToPin, alreadyOpenCount } = this.planTabOpening(configs, existingTabs, now);

    let pinned = 0;
    for (const { config, existingTab } of tabsToPin) {
      if (await this.pinTab(existingTab.id, config.url)) pinned++;
    }

    let opened = 0;
    for (const config of tabsToOpen) {
      try {
        const createOptions = { url: config.url, pinned: true, active: false };
        if (windowId) createOptions.windowId = windowId;
        const tab = await browser.tabs.create(createOptions);
        this.openedTabUrls.set(tab.id, config.url);
        opened++;
      } catch (error) {
        console.error(`Failed to open tab ${config.url}:`, error);
        this.recentlyOpenedUrls.delete(normalizeUrl(config.url));
      }
    }

    return {
      success: true,
      opened,
      pinned,
      skipped: alreadyOpenCount,
      failed: tabsToOpen.length - opened
    };
  }

  /**
   * Decides, for each config, whether its tab is already open and pinned, open but
   * unpinned (to pin), or missing (to open). Updates the recently-opened cache.
   */
  planTabOpening(configs, existingTabs, now) {
    const tabsToOpen = [];
    const tabsToPin = [];
    let alreadyOpenCount = 0;
    const processed = new Set();

    for (const config of configs) {
      const normalizedUrl = normalizeUrl(config.url);
      if (processed.has(normalizedUrl)) continue;
      processed.add(normalizedUrl);

      const matches = existingTabs.filter(tab => normalizeUrl(this.urlOf(tab)) === normalizedUrl);
      const pinnedTab = matches.find(tab => tab.pinned);
      const unpinnedTab = matches.find(tab => !tab.pinned);
      const recentlyOpenedAt = this.recentlyOpenedUrls.get(normalizedUrl);

      if (pinnedTab) {
        alreadyOpenCount++;
        this.recentlyOpenedUrls.set(normalizedUrl, now);
      } else if (unpinnedTab) {
        tabsToPin.push({ config, existingTab: unpinnedTab });
        this.recentlyOpenedUrls.set(normalizedUrl, now);
      } else if (recentlyOpenedAt !== undefined && now - recentlyOpenedAt < RECENTLY_OPENED_EXPIRY_MS) {
        // A previous, very recent call is already creating this tab
        alreadyOpenCount++;
      } else {
        tabsToOpen.push(config);
        this.recentlyOpenedUrls.set(normalizedUrl, now);
      }
    }
    return { tabsToOpen, tabsToPin, alreadyOpenCount };
  }

  /** Pins an open tab; returns false (and logs) when it is gone or not allowed. */
  async pinTab(tabId, url) {
    try {
      await browser.tabs.update(tabId, { pinned: true });
      return true;
    } catch (error) {
      // Expected for some pages with the activeTab permission only
      if (!String(error.message).includes('Missing host permission')) {
        console.error(`Failed to pin existing tab ${url}:`, error);
      }
      return false;
    }
  }

  /**
   * Closes the pinned tabs whose domain matches one of the given configs.
   * @returns {Promise<{success: boolean, closed: number, failed: number, skipped: number}>}
   */
  async closePinnedTabs(configs, windowId = null) {
    const domainKeys = new Set(configs.map(config => getDomainMatchKey(config.url)).filter(Boolean));
    if (domainKeys.size === 0) {
      return { success: false, error: 'No valid domains in this category' };
    }

    const existingTabs = await this.queryTabs(windowId);
    const tabsToClose = existingTabs.filter(tab =>
      tab && tab.id && tab.pinned === true && isSameDomainOrSubdomain(this.urlOf(tab), domainKeys));

    let closed = 0;
    for (const tab of tabsToClose) {
      try {
        await browser.tabs.remove(tab.id);
        this.openedTabUrls.delete(tab.id);
        closed++;
      } catch (error) {
        console.error(`Failed to close pinned category tab ${this.urlOf(tab)}:`, error);
      }
    }

    const failed = tabsToClose.length - closed;
    return { success: failed === 0, closed, failed, skipped: existingTabs.length - tabsToClose.length };
  }
}
