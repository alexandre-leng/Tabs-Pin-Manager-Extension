/**
 * Tabs Pin Background Script for Firefox
 * Handles core extension functionality and tab management
 * Enhanced with Firefox Multi-Account Containers support and robust storage management
 */

'use strict';

// Load dependencies for Service Worker context (Chrome & Firefox MV3)
if (typeof importScripts === 'function') {
  importScripts(
    '../lib/browser-polyfill.js',
    '../lib/default-categories.js',
    '../lib/storage-manager.js',
    '../lib/container-utils.js',
    '../lib/domain-utils.js'
  );
}


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
    
    // Initialize container utilities
    this.containerUtils = new ContainerUtils();

    // Locks to prevent concurrent tab opening operations
    this.isOpeningAllTabsInProgress = false;
    this.isOpeningCategoryTabsInProgress = false;
    this.isClosingCategoryTabsInProgress = false;
    
    // Cache for URLs recently decided to be opened/pinned to handle rapid successive calls
    this.recentlyOpenedUrls = new Map(); // Stores normalizedUrl -> timestamp
    
    this.init();
  }

  async init() {
    try {
      console.log('🚀 Starting TabsPinBackground initialization...');
      
      // Store the initialization promise
      this.initializationPromise = this.performInitialization();
      await this.initializationPromise;
      
      this.isInitialized = true;
      console.log('✅ TabsPin background script initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize background script:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async performInitialization() {
    // Wait for storage manager to be ready
    const healthCheck = await this.storage.healthCheck();
    console.log('📊 Storage health check:', healthCheck);
    
    // Wait for container utils to be ready
    await this.containerUtils.initializationPromise;
    console.log('🔒 Container support:', this.containerUtils.containersSupported);
    
    // Load initial data
    await this.loadData();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('Storage system:', healthCheck.healthy ? '✅ Healthy' : '❌ Issues detected');

    // Return initialization status
    return {
      healthy: healthCheck.healthy,
      containersSupported: this.containerUtils.containersSupported,
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
    console.log(`Cleaned up invalid tab reference: ${tabId}`);
  }

  /**
   * Safely updates a tab with error handling for containers
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

      // Use containerUtils for better container handling
      const updatedTab = await this.containerUtils.updateTabWithContainer(tabId, updateProperties);
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
    console.log(`Tab ${tabId} was removed, cleaning up references`);
    this.cleanupInvalidTab(tabId);
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      // Wait for initialization to complete if it's still in progress
      if (!this.isInitialized && this.initializationPromise) {
        console.log('⏳ Waiting for background script initialization to complete...');
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
          
        case 'updateSettings':
          result = await this.updateSettings(request.settings);
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
          
        case 'updateTab':
          result = await this.updateTab(request.tab);
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

  async openAllTabs(windowId = null) {
    if (this.isOpeningAllTabsInProgress) {
      console.warn('🔒 openAllTabs: Call rejected, operation already in progress.');
      return { success: false, error: 'Tab opening (all) is already in progress. Please wait.', alreadyInProgress: true };
    }
    this.isOpeningAllTabsInProgress = true;
    console.log('🔑 openAllTabs: Operation lock acquired.');

    const RECENTLY_OPENED_EXPIRY_MS = 2000; // Was 15000 (15 seconds), now 2 seconds

    try {
      const now = Date.now();
      console.log(`🧹 Cleaning recentlyOpenedUrls cache. Current size: ${this.recentlyOpenedUrls.size}`);
      for (const [url, time] of this.recentlyOpenedUrls.entries()) {
        if (now - time > RECENTLY_OPENED_EXPIRY_MS) {
          this.recentlyOpenedUrls.delete(url);
          console.log(`  🗑️ Removed ${url} from recentlyOpenedUrls cache (expired).`);
        }
      }
      console.log(`🧹 Finished cleaning recentlyOpenedUrls cache. New size: ${this.recentlyOpenedUrls.size}`);

      if (this.tabs.length === 0) {
        return { success: false, error: 'No tabs configured' };
      }

      const sortedTabs = [...this.tabs].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
      });
      
      const queryOptions = windowId ? { windowId: windowId } : {};
      const existingTabsFromQuery = await browser.tabs.query(queryOptions);
      
      const tabsToOpen = [];
      const alreadyOpenTabs = [];
      const tabsToPin = [];
      const urlsProcessedInThisSpecificCall = new Set(); 
      
      for (const tabConfig of sortedTabs) {
        if (tabConfig.enabled === false) continue;
        
        console.log(`\n🔄 Processing tab: ${tabConfig.url}`);
        const normalizedConfigUrl = this.normalizeUrl(tabConfig.url);
        console.log(`  🔍 Normalized config URL: ${normalizedConfigUrl}`);

        if (urlsProcessedInThisSpecificCall.has(normalizedConfigUrl)) {
          console.log(`  ⏭️ Already decided action for ${normalizedConfigUrl} in this specific run, skipping.`);
          // This ensures we don't re-process a normalized URL if multiple raw URLs map to it
          // and one has already been handled (e.g., added to tabsToOpen or tabsToPin).
          continue;
        }

        let foundPinnedTab = null;
        let foundUnpinnedTab = null;

        for (const queriedTab of existingTabsFromQuery) {
          const normalizedQueriedTabUrl = this.normalizeUrl(queriedTab.url);
          if (normalizedQueriedTabUrl === normalizedConfigUrl) {
            if (queriedTab.pinned) {
              console.log(`  ✨ Found a MATCHING PINNED existing tab in browser: ${queriedTab.url} (ID: ${queriedTab.id})`);
              foundPinnedTab = queriedTab;
              break; 
            } else {
              console.log(`  ✨ Found a MATCHING UNPINNED existing tab in browser: ${queriedTab.url} (ID: ${queriedTab.id})`);
              if (!foundUnpinnedTab) foundUnpinnedTab = queriedTab;
            }
          }
        }

        if (foundPinnedTab) {
          console.log(`  ✅ Tab already open and pinned in browser: ${tabConfig.url} (ID: ${foundPinnedTab.id})`);
          alreadyOpenTabs.push(tabConfig);
          urlsProcessedInThisSpecificCall.add(normalizedConfigUrl);
          // Refresh timestamp in recentlyOpenedUrls as it's confirmed to be active
          this.recentlyOpenedUrls.set(normalizedConfigUrl, now); 
        } else if (foundUnpinnedTab) {
          console.log(`  📌 Tab open in browser but not pinned, will pin: ${tabConfig.url} (ID: ${foundUnpinnedTab.id})`);
          tabsToPin.push({ config: tabConfig, existingTab: foundUnpinnedTab });
          urlsProcessedInThisSpecificCall.add(normalizedConfigUrl);
          this.recentlyOpenedUrls.set(normalizedConfigUrl, now);
        } else {
          // Tab does not exist in the browser (neither pinned nor unpinned)
          // Now, check the recentlyOpenedUrls cache to prevent rapid re-creation by concurrent/fast successive calls
          const timeSinceLastProcessed = now - (this.recentlyOpenedUrls.get(normalizedConfigUrl) || 0);
          if (this.recentlyOpenedUrls.has(normalizedConfigUrl) && timeSinceLastProcessed < RECENTLY_OPENED_EXPIRY_MS) {
            console.log(`  ⏭️ Tab not in browser, but ${normalizedConfigUrl} was processed globally ${Math.round(timeSinceLastProcessed/1000)}s ago. Assuming it's being created or state is pending. Skipping.`);
            // We add it to alreadyOpenTabs for stats, assuming it was successfully opened/pinned by the previous call
            // that put it in recentlyOpenedUrls.
            alreadyOpenTabs.push(tabConfig); 
            urlsProcessedInThisSpecificCall.add(normalizedConfigUrl); 
            // DO NOT update recentlyOpenedUrls here; the previous call's timestamp is the one that matters for its expiry.
          } else {
            console.log(`  🆕 Tab not found in browser AND not in recent global cache (or expired). Will create: ${tabConfig.url}`);
            tabsToOpen.push(tabConfig);
            urlsProcessedInThisSpecificCall.add(normalizedConfigUrl);
            this.recentlyOpenedUrls.set(normalizedConfigUrl, now); // Add/update timestamp as we're deciding to open it now
          }
        }
      }
      
      // Épingler les onglets existants qui ne sont pas encore épinglés
      const pinResults = [];
      if (tabsToPin.length > 0) {
        console.log(`\n🎗️ Pinning ${tabsToPin.length} tabs that were found open but unpinned...`);
        for (const { config, existingTab } of tabsToPin) {
          console.log(`  Attempting to pin existing tab: ${config.url} (ID: ${existingTab.id})`);
          const pinResult = await this.safeTabUpdate(existingTab.id, { pinned: true });
          if (pinResult.success) {
            pinResults.push({ success: true, tab: pinResult.tab, config });
            console.log(`    Successfully pinned existing tab: ${config.url}`);
          } else {
            if (pinResult.permissionError) {
              console.log(`    Skipped pinning tab ${config.url} due to permission restrictions (normal with activeTab)`);
            } else {
              console.error(`    Failed to pin existing tab ${config.url}:`, pinResult.error);
            }
            pinResults.push({ success: false, error: pinResult.error, config, permissionError: pinResult.permissionError });
          }
        }
      }
      
      if (tabsToOpen.length === 0) {
        console.log(`\n🏁 No new tabs to open. Total already open/processed: ${alreadyOpenTabs.length}, Total successfully pinned now: ${pinResults.filter(r=>r.success).length}`);
        const totalPinnedNow = pinResults.filter(r => r.success).length;
        const totalSkippedOrAlreadyOpen = alreadyOpenTabs.length;
        
        this.settings.lastOpened = new Date().toISOString();
        await this.storage.set({ settings: this.settings });

        return {
          success: true,
          skipped: totalSkippedOrAlreadyOpen,
          opened: 0,
          pinned: totalPinnedNow,
          message: totalSkippedOrAlreadyOpen > 0 || totalPinnedNow > 0 ? 
            (totalPinnedNow > 0 ? 'someTabsPinned' : 'allTabsAlreadyOpenOrProcessed') : 'noTabsConfiguredOrAllProcessed'
        };
      }
      
      console.log(`\n🚀 Opening ${tabsToOpen.length} new tabs...`);
      const results = [];
      for (const tab of tabsToOpen) {
        try {
          const createOptions = {
            url: tab.url,
            pinned: true,
            active: false
          };
          if (windowId) createOptions.windowId = windowId;
          if (tab.cookieStoreId && tab.cookieStoreId !== 'firefox-default') {
            createOptions.cookieStoreId = tab.cookieStoreId;
          }
          const newTab = await this.containerUtils.createTabWithContainer(createOptions);
          this.tabUrlsById.set(newTab.id, tab.url);
          results.push({ success: true, tab: newTab, config: tab });
          console.log(`  Opened new pinned tab: ${tab.url} (ID: ${newTab.id})`);
        } catch (error) {
          console.error(`  Failed to open tab ${tab.url}:`, error);
          results.push({ success: false, error: error.message, config: tab });
          const normalizedFailedUrl = this.normalizeUrl(tab.url);
          this.recentlyOpenedUrls.delete(normalizedFailedUrl);
          console.log(`    Removed ${normalizedFailedUrl} from recentlyOpenedUrls due to creation failure.`);
        }
      }

      this.settings.lastOpened = new Date().toISOString();
      await this.storage.set({ settings: this.settings });

      const openedCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      const pinnedNowCount = pinResults.filter(r => r.success).length;

      console.log(`\n📊 openAllTabs summary: Opened: ${openedCount}, Failed: ${failedCount}, Pinned now: ${pinnedNowCount}, Skipped/Already Open: ${alreadyOpenTabs.length}`);
      return {
        success: true,
        results: results,
        pinResults: pinResults,
        opened: openedCount,
        failed: failedCount,
        skipped: alreadyOpenTabs.length,
        pinned: pinnedNowCount,
        message: openedCount > 0 || pinnedNowCount > 0 ? 
                 'tabsOpenedOrPinned' : 
                 (alreadyOpenTabs.length > 0 ? 'allTabsAlreadyOpenOrProcessed' : 'noActionNeeded')
      };
    } catch (error) {
      console.error('❌ Error in openAllTabs:', error);
      return { success: false, error: error.message };
    } finally {
      this.isOpeningAllTabsInProgress = false;
      console.log('🔑 openAllTabs: Operation lock released.');
    }
  }

  async openCategoryTabs(categoryId, windowId = null) {
    if (this.isOpeningCategoryTabsInProgress) {
      console.warn('🔒 openCategoryTabs: Call rejected, operation already in progress.');
      return { success: false, error: 'Tab opening (category) is already in progress. Please wait.', alreadyInProgress: true };
    }
    this.isOpeningCategoryTabsInProgress = true;
    console.log('🔑 openCategoryTabs: Operation lock acquired.');

    const RECENTLY_OPENED_EXPIRY_MS = 2000; // Was 15000 (15 seconds), now 2 seconds

    try {
      const now = Date.now();
      console.log(`🧹 Cleaning recentlyOpenedUrls cache for category. Current size: ${this.recentlyOpenedUrls.size}`);
      for (const [url, time] of this.recentlyOpenedUrls.entries()) {
        if (now - time > RECENTLY_OPENED_EXPIRY_MS) {
          this.recentlyOpenedUrls.delete(url);
          console.log(`  🗑️ Removed ${url} from recentlyOpenedUrls cache (expired).`);
        }
      }
      console.log(`🧹 Finished cleaning recentlyOpenedUrls cache for category. New size: ${this.recentlyOpenedUrls.size}`);
      
      const categoryTabsConfig = this.tabs.filter(tab => 
        tab.category === categoryId && tab.enabled !== false
      ).sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
      });

      if (categoryTabsConfig.length === 0) {
        return { success: false, error: 'No tabs in this category' };
      }

      const queryOptions = windowId ? { windowId: windowId } : {};
      const existingTabsFromQuery = await browser.tabs.query(queryOptions);
      
      const tabsToOpen = [];
      const alreadyOpenTabs = [];
      const tabsToPin = [];
      const urlsProcessedInThisSpecificCall = new Set();
      
      for (const tabConfig of categoryTabsConfig) {
        console.log(`\n🔄 Processing category tab: ${tabConfig.url}`);
        const normalizedConfigUrl = this.normalizeUrl(tabConfig.url);
        console.log(`  🔍 Normalized config URL for category tab: ${normalizedConfigUrl}`);

        if (urlsProcessedInThisSpecificCall.has(normalizedConfigUrl)) {
          console.log(`  ⏭️ Already decided action for ${normalizedConfigUrl} in this category run, skipping.`);
          continue;
        }

        let foundPinnedTab = null;
        let foundUnpinnedTab = null;

        for (const queriedTab of existingTabsFromQuery) {
          const normalizedQueriedTabUrl = this.normalizeUrl(queriedTab.url);
          if (normalizedQueriedTabUrl === normalizedConfigUrl) {
            if (queriedTab.pinned) {
              console.log(`  ✨ Found a MATCHING PINNED existing tab in browser for category: ${queriedTab.url} (ID: ${queriedTab.id})`);
              foundPinnedTab = queriedTab;
              break;
            } else {
              console.log(`  ✨ Found a MATCHING UNPINNED existing tab in browser for category: ${queriedTab.url} (ID: ${queriedTab.id})`);
              if (!foundUnpinnedTab) foundUnpinnedTab = queriedTab;
            }
          }
        }
        
        if (foundPinnedTab) {
          console.log(`  ✅ Category tab already open and pinned in browser: ${tabConfig.url} (ID: ${foundPinnedTab.id})`);
          alreadyOpenTabs.push(tabConfig);
          urlsProcessedInThisSpecificCall.add(normalizedConfigUrl);
          this.recentlyOpenedUrls.set(normalizedConfigUrl, now);
        } else if (foundUnpinnedTab) {
          console.log(`  📌 Category tab open in browser but not pinned, will pin: ${tabConfig.url} (ID: ${foundUnpinnedTab.id})`);
          tabsToPin.push({ config: tabConfig, existingTab: foundUnpinnedTab });
          urlsProcessedInThisSpecificCall.add(normalizedConfigUrl);
          this.recentlyOpenedUrls.set(normalizedConfigUrl, now);
        } else {
          // Tab does not exist in the browser
          const timeSinceLastProcessed = now - (this.recentlyOpenedUrls.get(normalizedConfigUrl) || 0);
          if (this.recentlyOpenedUrls.has(normalizedConfigUrl) && timeSinceLastProcessed < RECENTLY_OPENED_EXPIRY_MS) {
            console.log(`  ⏭️ Category tab not in browser, but ${normalizedConfigUrl} was processed globally ${Math.round(timeSinceLastProcessed/1000)}s ago. Skipping.`);
            alreadyOpenTabs.push(tabConfig);
            urlsProcessedInThisSpecificCall.add(normalizedConfigUrl);
          } else {
            console.log(`  🆕 Category tab not found in browser AND not in recent global cache. Will create: ${tabConfig.url}`);
            tabsToOpen.push(tabConfig);
            urlsProcessedInThisSpecificCall.add(normalizedConfigUrl);
            this.recentlyOpenedUrls.set(normalizedConfigUrl, now);
          }
        }
      }
      
      // Épingler les onglets existants qui ne sont pas encore épinglés
      const pinResults = [];
      if (tabsToPin.length > 0) {
        console.log(`\n🎗️ Pinning ${tabsToPin.length} category tabs that were found open but unpinned...`);
        for (const { config, existingTab } of tabsToPin) {
           console.log(`  Attempting to pin existing category tab: ${config.url} (ID: ${existingTab.id})`);
          const pinResult = await this.safeTabUpdate(existingTab.id, { pinned: true });
          if (pinResult.success) {
            pinResults.push({ success: true, tab: pinResult.tab, config });
            console.log(`    Successfully pinned existing category tab: ${config.url}`);
          } else {
            if (pinResult.permissionError) {
              console.log(`    Skipped pinning category tab ${config.url} due to permission restrictions.`);
            } else {
              console.error(`    Failed to pin existing category tab ${config.url}:`, pinResult.error);
            }
            pinResults.push({ success: false, error: pinResult.error, config, permissionError: pinResult.permissionError });
          }
        }
      }
      
      if (tabsToOpen.length === 0) {
        console.log(`\n🏁 No new category tabs to open. Total already open/processed: ${alreadyOpenTabs.length}, Total successfully pinned now: ${pinResults.filter(r=>r.success).length}`);
        const totalPinnedNow = pinResults.filter(r => r.success).length;
        const totalSkippedOrAlreadyOpen = alreadyOpenTabs.length;
        
        return {
          success: true,
          skipped: totalSkippedOrAlreadyOpen,
          opened: 0,
          pinned: totalPinnedNow,
          message: totalSkippedOrAlreadyOpen > 0 || totalPinnedNow > 0 ?
            (totalPinnedNow > 0 ? 'someCategoryTabsPinned' : 'allCategoryTabsAlreadyOpenOrProcessed') : 'noCategoryTabsConfiguredOrAllProcessed'
        };
      }
      
      console.log(`\n🚀 Opening ${tabsToOpen.length} new category tabs...`);
      const results = [];
      for (const tab of tabsToOpen) {
        try {
          const createOptions = {
            url: tab.url,
            pinned: true,
            active: false
          };
          if (windowId) createOptions.windowId = windowId;
          if (tab.cookieStoreId && tab.cookieStoreId !== 'firefox-default') {
            createOptions.cookieStoreId = tab.cookieStoreId;
          }
          const newTab = await this.containerUtils.createTabWithContainer(createOptions);
          this.tabUrlsById.set(newTab.id, tab.url);
          results.push({ success: true, tab: newTab, config: tab });
          console.log(`  Opened new pinned category tab: ${tab.url} (ID: ${newTab.id})`);
        } catch (error) {
          console.error(`  Failed to open category tab ${tab.url}:`, error);
          results.push({ success: false, error: error.message, config: tab });
          const normalizedFailedUrl = this.normalizeUrl(tab.url);
          this.recentlyOpenedUrls.delete(normalizedFailedUrl);
          console.log(`    Removed ${normalizedFailedUrl} from recentlyOpenedUrls due to category tab creation failure.`);
        }
      }

      const openedCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      const pinnedNowCount = pinResults.filter(r => r.success).length;
      
      console.log(`\n📊 openCategoryTabs summary: Opened: ${openedCount}, Failed: ${failedCount}, Pinned now: ${pinnedNowCount}, Skipped/Already Open: ${alreadyOpenTabs.length}`);
      return {
        success: true,
        results: results,
        pinResults: pinResults,
        opened: openedCount,
        failed: failedCount,
        skipped: alreadyOpenTabs.length,
        pinned: pinnedNowCount,
        message: openedCount > 0 || pinnedNowCount > 0 ?
                 'categoryTabsOpenedOrPinned' :
                 (alreadyOpenTabs.length > 0 ? 'allCategoryTabsAlreadyOpenOrProcessed' : 'noActionNeededForCategory')
      };
    } catch (error) {
      console.error('❌ Error in openCategoryTabs:', error);
      return { success: false, error: error.message };
    } finally {
      this.isOpeningCategoryTabsInProgress = false;
      console.log('🔑 openCategoryTabs: Operation lock released.');
    }
  }

  async closeCategoryTabs(categoryId, windowId = null) {
    if (this.isClosingCategoryTabsInProgress) {
      console.warn('🔒 closeCategoryTabs: Call rejected, operation already in progress.');
      return { success: false, error: 'Tab closing (category) is already in progress. Please wait.', alreadyInProgress: true };
    }
    this.isClosingCategoryTabsInProgress = true;
    console.log('🔑 closeCategoryTabs: Operation lock acquired.');

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
          console.log(`Closed pinned category tab: ${tab.url} (ID: ${tab.id})`);
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
      console.log('🔑 closeCategoryTabs: Operation lock released.');
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
      
      console.log('Tab saved:', tab.title || tab.url);
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
      
      console.log('Tab deleted:', tabId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting tab:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTab(tab) {
    return await this.saveTab(tab);
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
      
      console.log('Categories saved:', categories.length);
      return { success: true, categories: this.categories };
    } catch (error) {
      console.error('Error saving categories:', error);
      return { success: false, error: error.message };
    }
  }

  async updateSettings(settings) {
    try {
      this.settings = { ...this.settings, ...settings };
      await this.storage.set({ settings: this.settings });
      
      // Notify other parts of the extension about the change
      this.notifyDataChange('settingsChanged');
      
      return { success: true, settings: this.settings };
    } catch (error) {
      console.error('Error updating settings:', error);
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
      if (!data || !data.tabs || !data.categories || !data.settings) {
        throw new Error('Invalid import data format');
      }

      console.log('📥 Importing all data...');

      // Update local state
      this.tabs = [...data.tabs];
      this.categories = [...data.categories];
      this.settings = { ...this.settings, ...data.settings };

      // Save everything to storage in one go
      await this.storage.set({
        pinnedTabs: this.tabs,
        categories: this.categories,
        settings: this.settings
      });

      // Notify changes
      this.notifyDataChange('dataChanged', {
        tabs: this.tabs,
        categories: this.categories,
        settings: this.settings
      });

      console.log('✅ Import completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error during data import:', error);
      return { success: false, error: error.message };
    }
  }

  async handleInstalled(details) {
    try {
      console.log('Extension installed/updated:', details.reason);
      
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
      console.log('Extension startup');
      await this.loadData();
    } catch (error) {
      console.error('Error handling startup:', error);
    }
  }

  async initializeDefaultData() {
    try {
      // Initialize with translated categories
      const defaultData = {
        pinnedTabs: [],
        categories: this.getDefaultCategories(),
        settings: {}
      };

      await this.storage.set(defaultData);
      console.log('Default data initialized with translations');
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }

  async migrateData(previousVersion) {
    try {
      console.log('Migrating data from version:', previousVersion);
      
      // Load current data
      await this.loadData();
      
      // Update categories with translations if they exist
      let needsCategoryUpdate = false;
      const defaultCategories = this.getDefaultCategories();
      
      this.categories = this.categories.map(category => {
        const defaultCategory = defaultCategories.find(dc => dc.id === category.id);
        if (defaultCategory && category.name !== defaultCategory.name) {
          needsCategoryUpdate = true;
          return { ...category, name: defaultCategory.name };
        }
        return category;
      });
      
      if (needsCategoryUpdate) {
        await this.storage.set({ categories: this.categories });
        console.log('Categories updated with translations');
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
        console.log('Data migration completed');
      }
    } catch (error) {
      console.error('Error migrating data:', error);
    }
  }

  // Utility functions
  isValidUrl(url) {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  generateTabId() {
    return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
        console.log('No receivers for data change notification');
      });
    } catch (error) {
      console.log('Error sending data change notification:', error);
    }
  }
}

// Initialize the background script
try {
  console.log('🚀 Initializing TabsPinBackground...');
  const tabsPinBackground = new TabsPinBackground();
  
  // Ensure the background script is properly initialized
  const scope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : self);
  scope.tabsPinBackground = tabsPinBackground;
  console.log('✅ TabsPinBackground initialized successfully');
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
