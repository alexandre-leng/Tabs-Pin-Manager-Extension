/**
 * Container Utils for Firefox Multi-Account Containers Support
 * Provides utilities for working with Firefox containers
 */

'use strict';

class ContainerUtils {
  constructor() {
    this.containersSupported = false;
    this.initializationPromise = this.initialize();
  }

  /**
   * Initialize the ContainerUtils
   * @returns {Promise<void>}
   */
  async initialize() {
    this.containersSupported = await this.checkContainerSupport();
    return this.containersSupported;
  }

  /**
   * Check if Firefox Multi-Account Containers are supported
   * @returns {Promise<boolean>} - True if containers are supported
   */
  async checkContainerSupport() {
    try {
      if (typeof browser === 'undefined' || !browser.contextualIdentities) {
        return false;
      }
      
      // Test if we can actually use the API
      await browser.contextualIdentities.query({});
      return true;
    } catch (error) {
      console.warn('Container support check failed:', error);
      return false;
    }
  }

  /**
   * Get all available containers
   * @returns {Promise<Array>} - Array of container objects
   */
  async getContainers() {
    if (!this.containersSupported) {
      return [];
    }

    try {
      const containers = await browser.contextualIdentities.query({});
      return containers.map(container => ({
        cookieStoreId: container.cookieStoreId,
        name: container.name,
        color: container.color,
        icon: container.icon,
        iconUrl: container.iconUrl
      }));
    } catch (error) {
      console.warn('Failed to get containers:', error);
      return [];
    }
  }

  /**
   * Check if a tab is in a container
   * @param {object} tab - The tab object
   * @returns {boolean} - True if tab is in a container
   */
  isTabInContainer(tab) {
    return tab && 
           tab.cookieStoreId && 
           tab.cookieStoreId !== 'firefox-default';
  }

  /**
   * Get container info for a tab
   * @param {object} tab - The tab object
   * @returns {Promise<object|null>} - Container info or null
   */
  async getTabContainer(tab) {
    if (!this.isTabInContainer(tab) || !this.containersSupported) {
      return null;
    }

    try {
      const container = await browser.contextualIdentities.get(tab.cookieStoreId);
      return {
        cookieStoreId: container.cookieStoreId,
        name: container.name,
        color: container.color,
        icon: container.icon,
        iconUrl: container.iconUrl
      };
    } catch (error) {
      console.warn(`Failed to get container info for ${tab.cookieStoreId}:`, error);
      return null;
    }
  }

  /**
   * Updates a tab with container support and error handling
   * @param {number} tabId - The tab ID to update
   * @param {object} updateProperties - Properties to update (e.g., {pinned: true})
   * @returns {Promise<object>} - The updated tab object
   */
  async updateTabWithContainer(tabId, updateProperties) {
    try {
      // First verify the tab exists and is accessible
      let tab;
      try {
        tab = await browser.tabs.get(tabId);
      } catch (error) {
        if (error.message && error.message.includes('Invalid tab ID')) {
          throw new Error(`Tab ID ${tabId} is no longer valid or accessible`);
        }
        if (error.message && error.message.includes('Missing host permission')) {
          throw new Error(`Missing host permission for the tab`);
        }
        throw error;
      }

      // If updating pinned state and tab is in a container, add delay for safety
      if (updateProperties.pinned !== undefined && tab.cookieStoreId && tab.cookieStoreId !== 'firefox-default') {
        await this.delay(150); // Wait for container to stabilize
      }

      // Attempt the update
      const updatedTab = await browser.tabs.update(tabId, updateProperties);
      
      return updatedTab;
    } catch (error) {
      // Don't log permission errors as much detail since they're expected with activeTab
      if (error.message && error.message.includes('Missing host permission')) {
        throw error; // Re-throw as-is for handling in background script
      }
      
      // Enhanced error logging for other errors
      console.error(`❌ Failed to update tab ${tabId}:`, {
        error: error.message,
        updateProperties,
        containersSupported: this.containersSupported
      });
      
      // Re-throw with more context
      throw new Error(`Tab update failed: ${error.message}`);
    }
  }

  /**
   * Creates a new tab with container support and error handling
   * @param {object} createOptions - Tab creation options
   * @returns {Promise<object>} - The created tab object
   */
  async createTabWithContainer(createOptions) {
    try {
      // Validate container if specified
      if (createOptions.cookieStoreId && createOptions.cookieStoreId !== 'firefox-default') {
        if (!this.containersSupported) {
          console.warn('Container specified but containers not supported, using default');
          delete createOptions.cookieStoreId;
        } else {
          // Verify container exists
          try {
            const containers = await this.getContainers();
            const containerExists = containers.some(container => 
              container.cookieStoreId === createOptions.cookieStoreId
            );
            
            if (!containerExists) {
              console.warn(`Container ${createOptions.cookieStoreId} not found, using default`);
              delete createOptions.cookieStoreId;
            }
          } catch (error) {
            console.warn('Failed to verify container, using default:', error.message);
            delete createOptions.cookieStoreId;
          }
        }
      }

      // Create the tab
      const newTab = await browser.tabs.create(createOptions);
      
      // If pinned and in container, verify the pin status after a delay
      if (createOptions.pinned && createOptions.cookieStoreId && createOptions.cookieStoreId !== 'firefox-default') {
        // Small delay to allow container tab to settle
        await this.delay(100);
        
        try {
          // Verify the tab was actually pinned
          const verifyTab = await browser.tabs.get(newTab.id);
          if (!verifyTab.pinned) {
            await browser.tabs.update(newTab.id, { pinned: true });
          }
        } catch (error) {
          console.warn(`Could not verify pin status for tab ${newTab.id}:`, error.message);
        }
      }
      
      return newTab;
    } catch (error) {
      console.error('❌ Failed to create tab:', {
        error: error.message,
        createOptions,
        containersSupported: this.containersSupported
      });
      
      throw new Error(`Tab creation failed: ${error.message}`);
    }
  }

  /**
   * Get container display name with fallback
   * @param {string} cookieStoreId - The container ID
   * @returns {Promise<string>} - Display name for the container
   */
  async getContainerDisplayName(cookieStoreId) {
    if (!cookieStoreId || cookieStoreId === 'firefox-default') {
      return browser.i18n.getMessage('defaultContainer') || 'Default';
    }

    try {
      const container = await this.getTabContainer({ cookieStoreId });
      return container ? container.name : cookieStoreId;
    } catch (error) {
      return cookieStoreId;
    }
  }

  /**
   * Filter tabs by container
   * @param {Array} tabs - Array of tabs
   * @param {string} cookieStoreId - Container ID to filter by
   * @returns {Array} - Filtered tabs
   */
  filterTabsByContainer(tabs, cookieStoreId) {
    if (!cookieStoreId) {
      return tabs;
    }

    return tabs.filter(tab => {
      const tabContainer = tab.cookieStoreId || 'firefox-default';
      return tabContainer === cookieStoreId;
    });
  }

  /**
   * Group tabs by container
   * @param {Array} tabs - Array of tabs
   * @returns {Object} - Tabs grouped by container
   */
  groupTabsByContainer(tabs) {
    const grouped = {};
    
    for (const tab of tabs) {
      const containerId = tab.cookieStoreId || 'firefox-default';
      if (!grouped[containerId]) {
        grouped[containerId] = [];
      }
      grouped[containerId].push(tab);
    }
    
    return grouped;
  }

  /**
   * Delay for a specified amount of milliseconds
   * @param {number} ms - The delay in milliseconds
   * @returns {Promise<void>} - A promise that resolves after the delay
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContainerUtils;
} else {
  const scope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : self);
  scope.ContainerUtils = ContainerUtils;
} 