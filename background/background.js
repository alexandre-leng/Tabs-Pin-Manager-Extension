/**
 * Tabs Pin Background Script for Firefox
 * Handles core extension functionality and tab management
 * Uses a resilient storage layer (retries, cache, health check)
 */

'use strict';

// Load dependencies for Service Worker context (Chrome & Firefox MV3)
if (typeof importScripts === 'function') {
  importScripts(
    '../lib/browser-polyfill.js',
    '../lib/default-categories.js',
    '../lib/storage-manager.js',
    '../lib/domain-utils.js'
  );
}

// Verbose diagnostics are opt-in: set to true while debugging
const DEBUG = false;
const log = (...args) => { if (DEBUG) console.log(...args); };

class TabsPinBackground {
  constructor() {
    this.tabs = [];
    this.categories = [];
    this.settings = {};
    this.storage = new StorageManager();
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Track tab URLs by ID for cleanup
    this.tabUrlsById = new Map();
    

    // Locks to prevent concurrent tab opening operations
    this.isOpeningAllTabsInProgress = false;
    this.isOpeningCategoryTabsInProgress = false;
    this.isClosingCategoryTabsInProgress = false;
    
    // Cache for URLs recently decided to be opened/pinned to handle rapid successive calls
    this.recentlyOpenedUrls = new Map(); // Stores normalizedUrl -> timestamp
    
    // Listeners must be registered synchronously: a MV3 service worker woken up by an
    // event (message, install, startup) only dispatches it to listeners that exist
    // after the first run of the script. Handlers wait for initialization themselves.
    this.setupEventListeners();
    
    this.init().catch(() => {
      // Already logged in init(); handleMessage reports the failure to callers
    });
  }

  async init() {
    try {
      log('🚀 Starting TabsPinBackground initialization...');
      
      // Store the initialization promise
      this.initializationPromise = this.performInitialization();
      await this.initializationPromise;
      
      this.isInitialized = true;
      log('✅ TabsPin background script initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize background script:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async performInitialization() {
    // Wait for storage manager to be ready
    const healthCheck = await this.storage.healthCheck();
    log('📊 Storage health check:', healthCheck);
    
    
    // Load initial data
    await this.loadData();
    
    log('Storage system:', healthCheck.healthy ? '✅ Healthy' : '❌ Issues detected');

    // Return initialization status
    return {
      healthy: healthCheck.healthy,
      dataLoaded: true
    };
  }

  async loadData(useCache = true) {
    try {
      const result = await this.storage.get(['pinnedTabs', 'categories', 'settings'], useCache);
      
      this.tabs = result.pinnedTabs || [];
      this.categories = result.categories || this.getDefaultCategories();
      this.settings = { ...result.settings };
      
    } catch (error) {
      console.error('Error loading background data:', error);
      throw error;
    }
  }

  getDefaultCategories() {
    return DefaultCategories.getDefaultCategories(browser.i18n);
  }

  setupEventListeners() {
    // Message listener for popup communications
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse)
        .then(result => {
          sendResponse(result);
        })
        .catch(error => {
          console.error('Error in message handler:', error);
          sendResponse({ success: false, error: error.message });
        });
      
      // Return true to indicate we will respond asynchronously
      return true;
    });

    // Installation and startup listeners
    browser.runtime.onInstalled.addListener((details) => {
      this.handleInstalled(details);
    });

    browser.runtime.onStartup.addListener(() => {
      this.handleStartup();
    });

    // Tab listeners for better error handling
    if (browser.tabs.onRemoved) {
      browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
        this.handleTabRemoved(tabId, removeInfo);
      });
    }
  }

  /**
   * Safely checks if a tab exists and is accessible
   * @param {number} tabId - The tab ID to check
   * @returns {Promise<boolean>} - True if tab exists and is accessible
   */
  async isTabValid(tabId) {
    try {
      if (!tabId || typeof tabId !== 'number') {
        return false;
      }
      
      const tab = await browser.tabs.get(tabId);
      return tab !== null && tab !== undefined;
    } catch (error) {
      // Tab doesn't exist or is not accessible
      if (error.message && error.message.includes('Invalid tab ID')) {
        console.warn(`Tab ID ${tabId} is invalid or no longer exists`);
      }
      return false;
    }
  }

  /**
   * Clean up invalid tab references from tracking
   * @param {number} tabId - The invalid tab ID to clean up
   */
  cleanupInvalidTab(tabId) {
    // Remove the tab ID from our mapping
    this.tabUrlsById.delete(tabId);
    log(`Cleaned up invalid tab reference: ${tabId}`);
  }

  /**
   * Updates a tab, reporting failures instead of throwing
   * @param {number} tabId - The tab ID to update
   * @param {object} updateProperties - Properties to update
   * @returns {Promise<object>} - Result object with success status
   */
  async safeTabUpdate(tabId, updateProperties) {
    try {
      // First check if tab is valid
      const isValid = await this.isTabValid(tabId);
      if (!isValid) {
        this.cleanupInvalidTab(tabId);
        throw new Error(`Invalid tab ID: ${tabId}`);
      }

      const updatedTab = await browser.tabs.update(tabId, updateProperties);
      return { success: true, tab: updatedTab };
      
    } catch (error) {
      // Don't log permission errors as they are expected with activeTab permission
      if (error.message && error.message.includes('Missing host permission')) {
        console.warn(`Permission denied for tab ${tabId} - skipping (this is normal with activeTab permission)`);
        return { success: false, error: 'Permission denied', tabId, permissionError: true };
      }
      
      console.error(`Failed to update tab ${tabId}:`, error);
      this.cleanupInvalidTab(tabId);
      return { success: false, error: error.message, tabId };
    }
  }

  handleTabRemoved(tabId, removeInfo) {
    // Clean up any references to removed tabs
    log(`Tab ${tabId} was removed, cleaning up references`);
    this.cleanupInvalidTab(tabId);
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      // Wait for initialization to complete if it's still in progress
      if (!this.isInitialized && this.initializationPromise) {
        log('⏳ Waiting for background script initialization to complete...');
        try {
          await this.initializationPromise;
        } catch (error) {
          console.error('❌ Background script initialization failed:', error);
          return { success: false, error: 'Background script initialization failed: ' + error.message };
        }
      }
      
      // If still not initialized after waiting, return error
      if (!this.isInitialized) {
        console.error('❌ Background script not initialized, cannot handle message:', request.action);
        return { success: false, error: 'Background script not properly initialized' };
      }
      
      let result;
      
      switch (request.action) {
        case 'openAllTabs':
          result = await this.openAllTabs(request.windowId);
          break;
          
        case 'openCategoryTabs':
          result = await this.openCategoryTabs(request.categoryId, request.windowId);
          break;

        case 'closeCategoryTabs':
          result = await this.closeCategoryTabs(request.categoryId, request.windowId);
          break;
          
        case 'getTabsData':
          await this.loadData(request.force === true ? false : true);
          result = {
            success: true,
            data: {
              tabs: this.tabs,
              categories: this.categories,
              settings: this.settings
            }
          };
          break;
          
        case 'saveTab':
          result = await this.saveTab(request.tab);
          break;
          
        case 'deleteTab':
          result = await this.deleteTab(request.tabId);
          break;
          
        case 'importAllData':
          result = await this.importAllData(request.data);
          break;
          
        case 'reorderTabs':
          result = await this.reorderTabs(request.tabIds);
          break;
          
        case 'saveCategories':
          result = await this.saveCategories(request.categories);
          break;

        case 'ping':
          // Simple ping to check if background script is responsive
          result = { success: true, message: 'pong' };
          break;
          
        default:
          console.warn('Unknown action:', request.action);
          result = { success: false, error: 'Unknown action' };
      }
      
      return result;
    } catch (error) {
      console.error('Error handling message:', error);
      return { success: false, error: error.message };
    }
  }

  normalizeUrl(url) {
    if (typeof url !== 'string' || !url) {
      return '';
    }
    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname.toLowerCase(); // Get hostname once
      
      // Special handling for common redirect patterns
      if (host === 'accounts.google.com' && urlObj.pathname.includes('ServiceLogin')) {
        const continueParam = urlObj.searchParams.get('continue');
        if (continueParam) {
          try {
            const targetUrl = new URL(decodeURIComponent(continueParam));
            return targetUrl.origin + targetUrl.pathname.replace(/\/$/, '');
          } catch (e) {
            return host; // Fallback to hostname if 'continue' is malformed
          }
        }
      }
      
      // For specific sensitive hosts, keep query parameters as they might be significant for distinguishing pages
      if (host === 'addons.mozilla.org' || 
          host === 'login.infomaniak.com' || 
          host === 'kdrive.infomaniak.com' || // Added for kDrive as well
          host.endsWith('.infomaniak.com')) { // Broader rule for all infomaniak subdomains
        return (urlObj.origin + urlObj.pathname + urlObj.search).toLowerCase();
      }
      
      // For other URLs, normalize by removing query parameters and fragments
      // but keep important path information and a whitelist of common important params
      let normalized = urlObj.origin + urlObj.pathname.replace(/\/$/, '');
      
      const importantParams = ['view', 'mode', 'hl', 'id', 'q', 'query', 'search_query', 'p', 'article', 'page']; // Expanded whitelist
      const keptParams = new URLSearchParams();
      let hasKeptParams = false;
      for (const [key, value] of urlObj.searchParams) {
        if (importantParams.includes(key.toLowerCase())) {
          keptParams.set(key, value);
          hasKeptParams = true;
        }
      }
      
      if (hasKeptParams) {
        normalized += '?' + keptParams.toString();
      }
      
      return normalized.toLowerCase();
    } catch (error) {
      console.warn(`Failed to normalize URL: ${url}`, error);
      return url.toLowerCase(); // Fallback to original URL (lowercase) if parsing fails
    }
  }

  sortTabConfigs(tabs) {
    return [...tabs].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
    });
  }

  async openAllTabs(windowId = null) {
    if (this.isOpeningAllTabsInProgress) {
      console.warn('openAllTabs: Call rejected, operation already in progress.');
      return { success: false, error: 'Tab opening (all) is already in progress. Please wait.', alreadyInProgress: true };
    }
    this.isOpeningAllTabsInProgress = true;
    try {
      if (this.tabs.length === 0) {
        return { success: false, error: 'No tabs configured' };
      }
      const configs = this.sortTabConfigs(this.tabs).filter(tab => tab.enabled !== false);
      const result = await this.openTabConfigs(configs, windowId, {
        pinned: 'someTabsPinned',
        alreadyOpen: 'allTabsAlreadyOpenOrProcessed',
        none: 'noTabsConfiguredOrAllProcessed',
        opened: 'tabsOpenedOrPinned',
        noAction: 'noActionNeeded'
      });
      this.settings.lastOpened = new Date().toISOString();
      await this.storage.set({ settings: this.settings });
      return result;
    } catch (error) {
      console.error('Error in openAllTabs:', error);
      return { success: false, error: error.message };
    } finally {
      this.isOpeningAllTabsInProgress = false;
    }
  }

  async openCategoryTabs(categoryId, windowId = null) {
    if (this.isOpeningCategoryTabsInProgress) {
      console.warn('openCategoryTabs: Call rejected, operation already in progress.');
      return { success: false, error: 'Tab opening (category) is already in progress. Please wait.', alreadyInProgress: true };
    }
    this.isOpeningCategoryTabsInProgress = true;
    try {
      const configs = this.sortTabConfigs(
        this.tabs.filter(tab => tab.category === categoryId && tab.enabled !== false)
      );
      if (configs.length === 0) {
        return { success: false, error: 'No tabs in this category' };
      }
      return await this.openTabConfigs(configs, windowId, {
        pinned: 'someCategoryTabsPinned',
        alreadyOpen: 'allCategoryTabsAlreadyOpenOrProcessed',
        none: 'noCategoryTabsConfiguredOrAllProcessed',
        opened: 'categoryTabsOpenedOrPinned',
        noAction: 'noActionNeededForCategory'
      });
    } catch (error) {
      console.error('Error in openCategoryTabs:', error);
      return { success: false, error: error.message };
    } finally {
      this.isOpeningCategoryTabsInProgress = false;
    }
  }

  /**
   * Opens (or pins, if already open but unpinned) the given tab configs, skipping the
   * ones already open and pinned. `messages` holds the i18n result keys for the caller.
   */
  async openTabConfigs(configs, windowId, messages) {
    const RECENTLY_OPENED_EXPIRY_MS = 2000;
    const now = Date.now();
    for (const [url, time] of this.recentlyOpenedUrls.entries()) {
      if (now - time > RECENTLY_OPENED_EXPIRY_MS) this.recentlyOpenedUrls.delete(url);
    }

    const existingTabs = await browser.tabs.query(windowId ? { windowId } : {});
    const tabsToOpen = [];
    const tabsToPin = [];
    let alreadyOpenCount = 0;
    const processed = new Set();

    for (const tabConfig of configs) {
      const normalizedUrl = this.normalizeUrl(tabConfig.url);
      if (processed.has(normalizedUrl)) continue;
      processed.add(normalizedUrl);

      let pinnedTab = null;
      let unpinnedTab = null;
      for (const queried of existingTabs) {
        if (this.normalizeUrl(queried.url) !== normalizedUrl) continue;
        if (queried.pinned) { pinnedTab = queried; break; }
        if (!unpinnedTab) unpinnedTab = queried;
      }

      if (pinnedTab) {
        alreadyOpenCount++;
        this.recentlyOpenedUrls.set(normalizedUrl, now);
      } else if (unpinnedTab) {
        tabsToPin.push({ config: tabConfig, existingTab: unpinnedTab });
        this.recentlyOpenedUrls.set(normalizedUrl, now);
      } else if (this.recentlyOpenedUrls.has(normalizedUrl) &&
                 now - this.recentlyOpenedUrls.get(normalizedUrl) < RECENTLY_OPENED_EXPIRY_MS) {
        // A previous, very recent call is already creating this tab
        alreadyOpenCount++;
      } else {
        tabsToOpen.push(tabConfig);
        this.recentlyOpenedUrls.set(normalizedUrl, now);
      }
    }

    const pinResults = [];
    for (const { config, existingTab } of tabsToPin) {
      const pinResult = await this.safeTabUpdate(existingTab.id, { pinned: true });
      if (pinResult.success) {
        pinResults.push({ success: true, tab: pinResult.tab, config });
      } else {
        if (!pinResult.permissionError) {
          console.error(`Failed to pin existing tab ${config.url}:`, pinResult.error);
        }
        pinResults.push({ success: false, error: pinResult.error, config, permissionError: pinResult.permissionError });
      }
    }
    const pinnedNowCount = pinResults.filter(r => r.success).length;

    if (tabsToOpen.length === 0) {
      return {
        success: true,
        skipped: alreadyOpenCount,
        opened: 0,
        pinned: pinnedNowCount,
        message: pinnedNowCount > 0 ? messages.pinned
          : (alreadyOpenCount > 0 ? messages.alreadyOpen : messages.none)
      };
    }

    const results = [];
    for (const tab of tabsToOpen) {
      try {
        const createOptions = { url: tab.url, pinned: true, active: false };
        if (windowId) createOptions.windowId = windowId;
        const newTab = await browser.tabs.create(createOptions);
        this.tabUrlsById.set(newTab.id, tab.url);
        results.push({ success: true, tab: newTab, config: tab });
      } catch (error) {
        console.error(`Failed to open tab ${tab.url}:`, error);
        results.push({ success: false, error: error.message, config: tab });
        this.recentlyOpenedUrls.delete(this.normalizeUrl(tab.url));
      }
    }

    const openedCount = results.filter(r => r.success).length;
    return {
      success: true,
      results,
      pinResults,
      opened: openedCount,
      failed: results.length - openedCount,
      skipped: alreadyOpenCount,
      pinned: pinnedNowCount,
      message: openedCount > 0 || pinnedNowCount > 0 ? messages.opened
        : (alreadyOpenCount > 0 ? messages.alreadyOpen : messages.noAction)
    };
  }

  async closeCategoryTabs(categoryId, windowId = null) {
    if (this.isClosingCategoryTabsInProgress) {
      console.warn('🔒 closeCategoryTabs: Call rejected, operation already in progress.');
      return { success: false, error: 'Tab closing (category) is already in progress. Please wait.', alreadyInProgress: true };
    }
    this.isClosingCategoryTabsInProgress = true;
    log('🔑 closeCategoryTabs: Operation lock acquired.');

    try {
      const categoryTabsConfig = this.tabs.filter(tab =>
        tab.category === categoryId && tab.enabled !== false
      );

      if (categoryTabsConfig.length === 0) {
        return { success: false, error: 'No tabs in this category' };
      }

      const domainKeys = new Set(
        categoryTabsConfig
          .map(tab => DomainUtils.getDomainMatchKey(tab.url))
          .filter(Boolean)
      );

      if (domainKeys.size === 0) {
        return { success: false, error: 'No valid domains in this category' };
      }

      const queryOptions = windowId ? { windowId: windowId } : {};
      const existingTabsFromQuery = await browser.tabs.query(queryOptions);
      const tabsToClose = existingTabsFromQuery.filter(tab =>
        tab &&
        tab.id &&
        tab.pinned === true &&
        DomainUtils.isSameDomainOrSubdomain(tab.url, domainKeys)
      );

      if (tabsToClose.length === 0) {
        return {
          success: true,
          closed: 0,
          failed: 0,
          skipped: existingTabsFromQuery.length,
          message: 'noOpenCategoryPinnedTabs'
        };
      }

      const results = [];
      for (const tab of tabsToClose) {
        try {
          await browser.tabs.remove(tab.id);
          this.cleanupInvalidTab(tab.id);
          results.push({ success: true, tabId: tab.id, url: tab.url });
          log(`Closed pinned category tab: ${tab.url} (ID: ${tab.id})`);
        } catch (error) {
          results.push({ success: false, tabId: tab.id, url: tab.url, error: error.message });
          console.error(`Failed to close pinned category tab ${tab.url}:`, error);
        }
      }

      const closedCount = results.filter(result => result.success).length;
      const failedCount = results.filter(result => !result.success).length;

      return {
        success: failedCount === 0,
        results: results,
        closed: closedCount,
        failed: failedCount,
        skipped: existingTabsFromQuery.length - tabsToClose.length,
        message: closedCount > 0 ? 'categoryPinnedTabsClosed' : 'noOpenCategoryPinnedTabs'
      };
    } catch (error) {
      console.error('❌ Error in closeCategoryTabs:', error);
      return { success: false, error: error.message };
    } finally {
      this.isClosingCategoryTabsInProgress = false;
      log('🔑 closeCategoryTabs: Operation lock released.');
    }
  }

  async saveTab(tab) {
    try {
      // Validate tab data
      if (!tab || !tab.url || !this.isValidUrl(tab.url)) {
        throw new Error('Invalid tab data or URL');
      }

      // Generate ID if not provided
      if (!tab.id) {
        tab.id = this.generateTabId();
      }

      // Set default values
      tab.dateAdded = tab.dateAdded || new Date().toISOString();
      tab.enabled = tab.enabled !== false;
      tab.category = tab.category || this.categories[0]?.id || 'work';

      // Add or update tab
      const existingIndex = this.tabs.findIndex(t => t.id === tab.id);
      if (existingIndex >= 0) {
        this.tabs[existingIndex] = { ...this.tabs[existingIndex], ...tab };
      } else {
        this.tabs.push(tab);
      }

      // Save to storage
      await this.storage.set({ pinnedTabs: this.tabs });
      
      // Notify other parts of the extension about the change
      this.notifyDataChange('tabsChanged');
      
      log('Tab saved:', tab.title || tab.url);
      return { success: true, tab: tab };
    } catch (error) {
      console.error('Error saving tab:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteTab(tabId) {
    try {
      const initialLength = this.tabs.length;
      this.tabs = this.tabs.filter(tab => tab.id !== tabId);
      
      if (this.tabs.length === initialLength) {
        throw new Error('Tab not found');
      }

      await this.storage.set({ pinnedTabs: this.tabs });
      
      // Notify other parts of the extension about the change
      this.notifyDataChange('tabsChanged');
      
      log('Tab deleted:', tabId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting tab:', error);
      return { success: false, error: error.message };
    }
  }


  // Assign a contiguous order (0..n-1) to every tab following the given ID list.
  // Tabs missing from the list keep their relative position after the listed ones.
  async reorderTabs(tabIds) {
    try {
      if (!Array.isArray(tabIds)) {
        throw new Error('tabIds must be an array');
      }

      const byId = new Map(this.tabs.map(tab => [tab.id, tab]));
      const ordered = [];
      const seen = new Set();
      for (const id of tabIds) {
        const tab = byId.get(id);
        if (tab && !seen.has(id)) {
          ordered.push(tab);
          seen.add(id);
        }
      }

      const remaining = this.sortTabConfigs(this.tabs.filter(tab => !seen.has(tab.id)));

      const orderById = new Map();
      [...ordered, ...remaining].forEach((tab, index) => orderById.set(tab.id, index));
      this.tabs = this.tabs.map(tab => ({ ...tab, order: orderById.get(tab.id) }));

      await this.storage.set({ pinnedTabs: this.tabs });
      this.notifyDataChange('tabsChanged');

      return { success: true, tabs: this.tabs };
    } catch (error) {
      console.error('Error reordering tabs:', error);
      return { success: false, error: error.message };
    }
  }

  async saveCategories(categories) {
    try {
      // Validate categories
      if (!Array.isArray(categories)) {
        throw new Error('Categories must be an array');
      }

      for (const category of categories) {
        if (!category.id || !category.name || !category.icon) {
          throw new Error('Invalid category data');
        }
      }

      this.categories = categories;
      await this.storage.set({ categories: this.categories });
      
      // Notify other parts of the extension about the change
      this.notifyDataChange('categoriesChanged');
      
      log('Categories saved:', categories.length);
      return { success: true, categories: this.categories };
    } catch (error) {
      console.error('Error saving categories:', error);
      return { success: false, error: error.message };
    }
  }


  /**
   * Imports all data (tabs, categories, settings) in one operation
   * @param {Object} data - The data to import
   * @returns {Promise<Object>} - Success result
   */
  async importAllData(data) {
    try {
      const sanitized = this.sanitizeImportData(data);

      this.tabs = sanitized.tabs;
      this.categories = sanitized.categories;
      this.settings = { ...this.settings, ...sanitized.settings };

      // Save everything to storage in one go
      await this.storage.set({
        pinnedTabs: this.tabs,
        categories: this.categories,
        settings: this.settings
      });

      // Notify changes
      this.notifyDataChange('dataChanged');

      return { success: true, imported: this.tabs.length, skipped: sanitized.skipped };
    } catch (error) {
      console.error('❌ Error during data import:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validates an imported backup: drops tabs without an http(s) URL and malformed
   * categories, fixes field types and duplicate IDs. Throws if the overall shape is wrong.
   */
  sanitizeImportData(data) {
    const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    if (!isPlainObject(data) || !Array.isArray(data.tabs) || !Array.isArray(data.categories) || !isPlainObject(data.settings)) {
      throw new Error('Invalid import data format');
    }

    const categories = [];
    const categoryIds = new Set();
    for (const category of data.categories) {
      if (!isPlainObject(category) || typeof category.id !== 'string' || !category.id ||
          typeof category.name !== 'string' || categoryIds.has(category.id)) {
        continue;
      }
      categoryIds.add(category.id);
      categories.push({ ...category, icon: typeof category.icon === 'string' ? category.icon : '📁' });
    }
    if (categories.length === 0) {
      throw new Error('Invalid import data format');
    }

    const tabs = [];
    const tabIds = new Set();
    for (const tab of data.tabs) {
      if (!isPlainObject(tab) || typeof tab.url !== 'string' || !this.isValidUrl(tab.url)) {
        continue;
      }
      let id = typeof tab.id === 'string' && tab.id ? tab.id : this.generateTabId();
      while (tabIds.has(id)) id = this.generateTabId();
      tabIds.add(id);

      const clean = {
        ...tab,
        id,
        title: typeof tab.title === 'string' ? tab.title : tab.url,
        category: categoryIds.has(tab.category) ? tab.category : categories[0].id,
        enabled: tab.enabled !== false
      };
      if (!Number.isFinite(clean.order)) delete clean.order;
      if (typeof clean.dateAdded !== 'string') clean.dateAdded = new Date().toISOString();
      // Containers are not supported: older backups may still carry a container ID
      delete clean.cookieStoreId;
      tabs.push(clean);
    }

    return { tabs, categories, settings: data.settings, skipped: data.tabs.length - tabs.length };
  }

  async handleInstalled(details) {
    try {
      await this.initializationPromise;
      log('Extension installed/updated:', details.reason);
      
      if (details.reason === 'install') {
        // First installation - initialize with default data
        await this.initializeDefaultData();
      } else if (details.reason === 'update') {
        // Update - migrate data if needed
        await this.migrateData(details.previousVersion);
      }
    } catch (error) {
      console.error('Error handling installation:', error);
    }
  }

  async handleStartup() {
    try {
      log('Extension startup');
      await this.initializationPromise;
      await this.loadData();
    } catch (error) {
      console.error('Error handling startup:', error);
    }
  }

  async initializeDefaultData() {
    try {
      // Never overwrite data that already exists (e.g. restored or synced storage)
      const existing = await this.storage.get(['pinnedTabs', 'categories', 'settings'], false);
      const defaultData = {};
      if (!Array.isArray(existing.pinnedTabs)) defaultData.pinnedTabs = [];
      if (!Array.isArray(existing.categories) || existing.categories.length === 0) {
        defaultData.categories = this.getDefaultCategories();
      }
      if (!existing.settings) defaultData.settings = {};

      if (Object.keys(defaultData).length === 0) {
        return;
      }

      await this.storage.set(defaultData);
      await this.loadData(false);
      log('Default data initialized with translations');
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }

  async migrateData(previousVersion) {
    try {
      log('Migrating data from version:', previousVersion);
      
      // Load current data
      await this.loadData();
      
      // Update categories with translations if they exist
      let needsCategoryUpdate = false;
      const defaultCategories = this.getDefaultCategories();
      // Untranslated (English) default names: only those get translated, so names
      // customized by the user are not reset on every extension update
      const fallbackCategories = DefaultCategories.getDefaultCategories(null);
      
      this.categories = this.categories.map(category => {
        const defaultCategory = defaultCategories.find(dc => dc.id === category.id);
        const fallbackCategory = fallbackCategories.find(fc => fc.id === category.id);
        if (defaultCategory && fallbackCategory &&
            category.name === fallbackCategory.name &&
            category.name !== defaultCategory.name) {
          needsCategoryUpdate = true;
          return { ...category, name: defaultCategory.name };
        }
        return category;
      });
      
      if (needsCategoryUpdate) {
        await this.storage.set({ categories: this.categories });
        log('Categories updated with translations');
      }
      
      // Add any migration logic here for future versions
      // For now, just ensure all tabs have required fields
      let needsUpdate = false;
      
      this.tabs = this.tabs.map(tab => {
        if (!tab.id) {
          tab.id = this.generateTabId();
          needsUpdate = true;
        }
        if (tab.enabled === undefined) {
          tab.enabled = true;
          needsUpdate = true;
        }
        if (!tab.dateAdded) {
          tab.dateAdded = new Date().toISOString();
          needsUpdate = true;
        }
        return tab;
      });

      if (needsUpdate) {
        await this.storage.set({ pinnedTabs: this.tabs });
        log('Data migration completed');
      }
    } catch (error) {
      console.error('Error migrating data:', error);
    }
  }

  // Utility functions
  isValidUrl(url) {
    try {
      const { protocol } = new URL(url);
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }

  generateTabId() {
    return 'tab_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  }

  // Notify other parts of the extension about data changes
  notifyDataChange(changeType) {
    try {
      // Send message to all extension pages (popup, options) about the change
      browser.runtime.sendMessage({
        action: 'dataChanged',
        changeType: changeType,
        data: {
          tabs: this.tabs,
          categories: this.categories,
          settings: this.settings
        }
      }).catch(() => {
        // Ignore errors if no receivers are listening
        log('No receivers for data change notification');
      });
    } catch (error) {
      log('Error sending data change notification:', error);
    }
  }
}

// Initialize the background script
try {
  log('🚀 Initializing TabsPinBackground...');
  const tabsPinBackground = new TabsPinBackground();
  
  // Ensure the background script is properly initialized
  const scope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : self);
  scope.tabsPinBackground = tabsPinBackground;
  log('✅ TabsPinBackground initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize TabsPinBackground:', error);
  
  // Create a minimal fallback handler to respond to messages
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.error('⚠️ Background script not properly initialized, returning error response');
    sendResponse({ 
      success: false, 
      error: 'Background script initialization failed: ' + error.message 
    });
    return true;
  });
}
