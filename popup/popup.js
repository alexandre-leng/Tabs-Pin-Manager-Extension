/**
 * Tabs Pin Popup Script
 * Handles popup interface and user interactions
 */

'use strict';

class PopupManager {
  constructor() {
    this.tabs = [];
    this.categories = [];
    this.settings = {};
    this.currentCategory = 'all';
    this.isLoading = false;
    this.storage = new StorageManager();
    this.currentTab = null;
    this.isOpeningTabs = false; // Prevent multiple simultaneous calls to openAllTabs
    
    this.elements = {
      // States
      loadingState: document.getElementById('loadingState'),
      emptyState: document.getElementById('emptyState'),
      quickActions: document.getElementById('quickActions'),
      categoriesSection: document.getElementById('categoriesSection'),
      activitySection: document.getElementById('activitySection'),
      
      // Actions
      openAllBtn: document.getElementById('openAllBtn'),
      pinCurrentMainBtn: document.getElementById('pinCurrentMainBtn'),
      openOptionsMainBtn: document.getElementById('openOptionsMainBtn'),
      openOptionsFromEmpty: document.getElementById('openOptionsFromEmpty'),
      pinCurrentFromEmpty: document.getElementById('pinCurrentFromEmpty'),
      refreshBtn: document.getElementById('refreshBtn'),
      
      // Info displays
      tabCount: document.getElementById('tabCount'),
      statusText: document.getElementById('statusText'),
      statusInfo: document.getElementById('statusInfo'),
      pinnedTabsCount: document.getElementById('pinnedTabsCount'),
      categoriesCount: document.getElementById('categoriesCount'),
      categoriesList: document.getElementById('categoriesList'),
      versionInfo: document.getElementById('versionInfo'),
      
      // Category Selection Modal
      categorySelectionOverlay: document.getElementById('categorySelectionOverlay'),
      categorySelectionModal: document.getElementById('categorySelectionModal'),
      closeCategorySelection: document.getElementById('closeCategorySelection'),
      cancelCategorySelection: document.getElementById('cancelCategorySelection'),
      categorySelectionList: document.getElementById('categorySelectionList'),
      previewFavicon: document.getElementById('previewFavicon'),
      previewTitle: document.getElementById('previewTitle'),
      previewUrl: document.getElementById('previewUrl'),
      
      // Toast
      toast: document.getElementById('toast'),
      toastIcon: document.getElementById('toastIcon'),
      toastMessage: document.getElementById('toastMessage')
    };
    
    this.init();
  }

  async init() {
    // Translate static text first: it must not wait for, or depend on, the background script
    this.setupI18n();
    try {
      // Check connection with background script first. Not fatal: loadData() falls back
      // to direct storage access, and the popup must still render and be usable.
      try {
        await this.checkBackgroundConnection();
      } catch (error) {
        console.warn(error.message);
      }
      
      await this.getCurrentTab();
      await this.loadData();
      this.setupEventListeners();
      this.updateVersionInfo();
      
      // Initial render
      this.render();
      
      // Setup data change listener
      this.setupDataChangeListener();
      
    } catch (error) {
      console.error('Failed to initialize popup:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('failedToInitialize') || 'Failed to initialize popup');
    }
  }

  /**
   * Check if background script is responsive
   * @returns {Promise<boolean>} True if background script responds
   */
  async checkBackgroundConnection() {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await browser.runtime.sendMessage({ action: 'ping' });
        if (response && response.success && response.message === 'pong') {
          return true;
        } else {
          throw new Error('Invalid ping response');
        }
      } catch (error) {
        console.warn(`⚠️ Connection attempt ${attempt}/${maxAttempts} failed:`, error.message);
        if (attempt === maxAttempts) {
          console.error('❌ Background script connection failed after all attempts');
          throw new Error('Background script is not running. Please try reloading the extension.');
        }
        // Wait before retry (increasing delay)
        await new Promise(resolve => setTimeout(resolve, attempt * 300));
      }
    }
  }

  /**
   * Send message to background script with retry mechanism
   * @param {object} message - Message to send
   * @param {number} retries - Number of retries (default: 2)
   * @returns {Promise<object>} Response from background script
   */
  async sendMessageWithRetry(message, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await browser.runtime.sendMessage(message);
        
        if (!response) {
          throw new Error('No response from background script');
        }
        
        // Check if the response indicates an error
        if (response.success === false) {
          console.warn(`⚠️ Background script returned error:`, response.error);
          // Don't retry on background script errors
          throw new Error(response.error || 'Background script operation failed');
        }
        
        return response;
      } catch (error) {
        console.warn(`❌ Message attempt ${attempt + 1} failed:`, {
          action: message.action,
          error: error.message,
          attempt: attempt + 1,
          maxAttempts: retries + 1
        });
        
        if (attempt === retries) {
          // Last attempt failed
          const errorMessage = error.message.includes('Receiving end does not exist') 
            ? 'Background script is not responding. Please reload the extension.'
            : `Could not establish connection after ${retries + 1} attempts: ${error.message}`;
          
          throw new Error(errorMessage);
        }
        
        // Wait before retry with exponential backoff
        const delay = 100 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async getCurrentTab() {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }

  async loadData() {
    try {
      // First try to get data from background script for consistency
      try {
        const response = await this.sendMessageWithRetry({ action: 'getTabsData' });
        if (response && response.success && response.data) {
          this.tabs = response.data.tabs || [];
          this.categories = response.data.categories || this.getDefaultCategories();
          this.settings = response.data.settings || {};
          return;
        }
      } catch (error) {
        console.warn('Failed to load data from background script, falling back to storage:', error);
      }
      
      // Fallback to direct storage access using StorageManager
      const result = await this.storage.get(['pinnedTabs', 'categories', 'settings']);
      this.tabs = result.pinnedTabs || [];
      this.categories = result.categories || this.getDefaultCategories();
      this.settings = result.settings || {};
    } catch (error) {
      console.error('Error loading data:', error);
      // Initialize with defaults if all else fails
      this.tabs = [];
      this.categories = this.getDefaultCategories();
      this.settings = {};
    }
  }

  getDefaultCategories() {
    return DefaultCategories.getDefaultCategories(browser.i18n);
  }

  setupEventListeners() {
    // Main action button
    if (this.elements.openAllBtn) {
      this.elements.openAllBtn.addEventListener('click', () => this.openAllTabs());
    }
    
    // Pin current tab buttons
    if (this.elements.pinCurrentMainBtn) {
      this.elements.pinCurrentMainBtn.addEventListener('click', () => this.pinCurrentTab());
    }
    
    if (this.elements.pinCurrentFromEmpty) {
      this.elements.pinCurrentFromEmpty.addEventListener('click', () => this.pinCurrentTab());
    }
    
    // Options buttons
    this.elements.openOptionsMainBtn?.addEventListener('click', () => this.openOptions());
    this.elements.openOptionsFromEmpty?.addEventListener('click', () => this.openOptions());
    
    // Category management
    document.getElementById('manageCategoriesBtn')?.addEventListener('click', () => this.openOptions());
    
    // Stats interactions
    document.getElementById('pinnedTabsStatBtn')?.addEventListener('click', () => this.openOptions());
    document.getElementById('categoriesStatBtn')?.addEventListener('click', () => this.openOptions());
    
    // Refresh button
    this.elements.refreshBtn?.addEventListener('click', () => this.refresh());
    
    // Footer links (bug report / feature request): open in a new tab, then close the popup
    document.querySelectorAll('.footer-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        browser.tabs.create({ url: link.href });
        window.close();
      });
    });
    
    // Category Selection Modal events
    if (this.elements.closeCategorySelection) {
      this.elements.closeCategorySelection.addEventListener('click', () => this.closeCategorySelectionModal());
    }
    
    if (this.elements.cancelCategorySelection) {
      this.elements.cancelCategorySelection.addEventListener('click', () => this.closeCategorySelectionModal());
    }
    
    if (this.elements.categorySelectionOverlay) {
      this.elements.categorySelectionOverlay.addEventListener('click', (e) => {
        if (e.target === this.elements.categorySelectionOverlay) {
          this.closeCategorySelectionModal();
        }
      });
    }
    
    // Keyboard shortcut for modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.categorySelectionOverlay?.style.display === 'flex') {
        this.closeCategorySelectionModal();
      }
    });
  }

  setupI18n() {
    I18nHelper.localizePage(document);
  }

  updateVersionInfo() {
    if (this.elements.versionInfo) {
      const manifest = browser.runtime.getManifest();
      this.elements.versionInfo.textContent = `v${manifest.version}`;
    }
  }

  render() {
    this.hideLoading();
    
    if (this.tabs.length === 0) {
      this.showEmptyState();
    } else {
      this.showMainInterface();
    }
  }

  showLoading() {
    this.hideAllStates();
    if (this.elements.loadingState) {
      this.elements.loadingState.style.display = 'flex';
    }
  }

  hideLoading() {
    if (this.elements.loadingState) {
      this.elements.loadingState.style.display = 'none';
    }
  }

  showEmptyState() {
    this.hideAllStates();
    if (this.elements.emptyState) {
      this.elements.emptyState.style.display = 'flex';
    }
    this.updatePinButtonState();
  }

  showMainInterface() {
    this.hideAllStates();
    
    // Show main sections
    if (this.elements.quickActions) {
      this.elements.quickActions.style.display = 'flex';
    }
    
    if (this.elements.activitySection) {
      this.elements.activitySection.style.display = 'block';
    }
    
    // Update counts and info
    this.updateTabCount();
    this.updateActivityStats();
    this.updateStatusInfo();
    this.updatePinButtonState();
    
    // Show categories if there are any
    if (this.tabs.length > 0) {
      this.renderCategories();
      if (this.elements.categoriesSection) {
        this.elements.categoriesSection.style.display = 'block';
      }
    }
  }

  hideAllStates() {
    const states = [
      this.elements.loadingState,
      this.elements.emptyState,
      this.elements.quickActions,
      this.elements.categoriesSection,
      this.elements.activitySection
    ];
    
    states.forEach(element => {
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  updateTabCount() {
    if (this.elements.tabCount) {
      this.elements.tabCount.textContent = this.tabs.length;
    }
    
    // Update button text with proper internationalization and grammar
    if (this.elements.openAllBtn) {
      const btnText = this.elements.openAllBtn.querySelector('.btn-text');
      if (btnText) {
        let buttonMessage;
        if (this.tabs.length === 1) {
          // Use singular form
          buttonMessage = browser.i18n.getMessage('openTabsSingular', [this.tabs.length.toString()]);
        } else {
          // Use plural form
          buttonMessage = browser.i18n.getMessage('openTabsPlural', [this.tabs.length.toString()]);
        }
        
        // Fallback to old method if new translations are not available
        if (!buttonMessage) {
          if (this.tabs.length === 1) {
            buttonMessage = browser.i18n.getMessage('openOneTab') || 'Open 1 Tab';
          } else {
            buttonMessage = browser.i18n.getMessage('openTabsCount', [this.tabs.length.toString()]) || 
                           `Open ${this.tabs.length} tabs`;
          }
        }
        
        btnText.textContent = buttonMessage;
      }
    }
  }

  updateActivityStats() {
    if (this.elements.pinnedTabsCount) {
      this.elements.pinnedTabsCount.textContent = this.tabs.length;
    }
    
    if (this.elements.categoriesCount) {
      const usedCategories = new Set(this.tabs.map(tab => tab.category).filter(Boolean));
      this.elements.categoriesCount.textContent = usedCategories.size;
    }
  }

  updateStatusInfo() {
    if (this.elements.statusText) {
      const lastOpened = this.settings.lastOpened;
      if (lastOpened) {
        const date = new Date(lastOpened);
        const timeAgo = this.getTimeAgo(date);
        const prefix = browser.i18n.getMessage('lastOpenedPrefix') || 'Last opened:';
        this.elements.statusText.textContent = `${prefix} ${timeAgo}`;
      } else {
        this.elements.statusText.textContent = browser.i18n.getMessage('readyToOpenTabs') || 'Ready to open tabs';
      }
    }
  }

  updatePinButtonState() {
    const pinButtons = [
      this.elements.pinCurrentMainBtn,
      this.elements.pinCurrentFromEmpty
    ];
    
    const canPin = this.currentTab && this.isValidUrl(this.currentTab.url) && !this.isTabAlreadyPinned(this.currentTab.url);
    
    pinButtons.forEach(button => {
      if (button) {
        button.disabled = !canPin;
        button.style.opacity = canPin ? '1' : '0.6';
        
        // Update tooltip content
        const tooltip = button.querySelector('.btn-tooltip');
        if (tooltip) {
          if (canPin) {
            tooltip.textContent = browser.i18n.getMessage('pinCurrentTab') || 'Pin Current Tab';
          } else if (this.currentTab && this.isTabAlreadyPinned(this.currentTab.url)) {
            tooltip.textContent = browser.i18n.getMessage('tabAlreadyPinned') || 'Tab is already pinned';
          } else {
            tooltip.textContent = browser.i18n.getMessage('currentTabCannotBePinned') || 'Current tab cannot be pinned';
          }
        }
        
        // Update status indicator
        const statusIndicator = button.querySelector('.action-status');
        if (statusIndicator) {
          statusIndicator.textContent = canPin ? '' : '!';
        }
      }
    });
  }

  renderCategories() {
    if (!this.elements.categoriesList) return;
    
    // Clear existing content safely
    while (this.elements.categoriesList.firstChild) {
      this.elements.categoriesList.removeChild(this.elements.categoriesList.firstChild);
    }
    
    const groups = this.groupTabsByCategory();
    
    // Sort categories, with "Development" last by default
    const sortedCategories = this.getSortedCategories();
    
    sortedCategories.forEach(category => {
      const tabsInCategory = groups[category.id] || [];
      if (tabsInCategory.length > 0) {
        const categoryElement = this.createCategoryElement(category, tabsInCategory.length);
        this.elements.categoriesList.appendChild(categoryElement);
      }
    });
  }

  groupTabsByCategory() {
    const groups = {};
    
    // Sort tabs by order before grouping
    const sortedTabs = [...this.tabs].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
    });
    
    sortedTabs.forEach(tab => {
      const categoryId = tab.category || 'uncategorized';
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(tab);
    });
    return groups;
  }

  createCategoryElement(category, count) {
    const element = document.createElement('div');
    element.className = 'category-item';
    element.dataset.categoryId = category.id;
    
    // Get translated tab word (singular/plural)
    const tabWord = count !== 1 ? 
      (browser.i18n.getMessage('tabPlural') || 'tabs') :
      (browser.i18n.getMessage('tabSingular') || 'tab');
    
    // Create elements safely without innerHTML
    const iconDiv = document.createElement('div');
    iconDiv.className = 'category-icon';
    iconDiv.textContent = category.icon;
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'category-info';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'category-name';
    nameDiv.textContent = category.name; // Already escaped by textContent
    
    const countDiv = document.createElement('div');
    countDiv.className = 'category-count';
    countDiv.textContent = `${count} ${tabWord}`;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'category-close-btn';
    const closeLabel = browser.i18n.getMessage('closeCategoryTabsTooltip') || 'Close this category';
    const closeButtonText = browser.i18n.getMessage('closeCategoryTabs') || 'Close';
    closeButton.title = closeLabel;
    closeButton.setAttribute('aria-label', closeLabel);

    const closeIcon = document.createElement('span');
    closeIcon.className = 'category-close-icon';
    closeIcon.setAttribute('aria-hidden', 'true');

    const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeSvg.setAttribute('width', '14');
    closeSvg.setAttribute('height', '14');
    closeSvg.setAttribute('viewBox', '0 0 24 24');
    closeSvg.setAttribute('fill', 'currentColor');

    const closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    closePath.setAttribute('d', 'M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z');
    closeSvg.appendChild(closePath);
    closeIcon.appendChild(closeSvg);

    const closeText = document.createElement('span');
    closeText.className = 'category-close-text';
    closeText.textContent = closeButtonText;

    closeButton.appendChild(closeIcon);
    closeButton.appendChild(closeText);
    
    // Assemble the structure
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(countDiv);
    element.appendChild(iconDiv);
    element.appendChild(infoDiv);
    element.appendChild(closeButton);
    
    // Add click event with feedback
    element.addEventListener('click', async () => {
      element.style.transform = 'scale(0.98)';
      setTimeout(() => {
        element.style.transform = '';
      }, 150);
      
      await this.openCategoryTabs(category.id);
    });

    closeButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await this.closeCategoryTabs(category.id, category.name, count);
    });
    
    // Add hover animations
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateX(4px)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = '';
    });
    
    return element;
  }

  openOptions() {
    browser.runtime.openOptionsPage();
    window.close();
  }

  async refresh() {
    this.showLoading();
    await this.getCurrentTab();
    await this.loadData();
    this.render();
  }

  // Utility functions
  isValidUrl(url) {
    return UiUtils.isValidUrl(url);
  }

  isTabAlreadyPinned(url) {
    if (!url) return false;
    
    // Normalize URL for comparison (remove trailing slash, fragments, etc.)
    const normalizeUrl = (inputUrl) => {
      try {
        const urlObj = new URL(inputUrl);
        // Remove fragment and trailing slash
        const normalized = urlObj.origin + urlObj.pathname.replace(/\/$/, '') + urlObj.search;
        return normalized.toLowerCase();
      } catch (error) {
        return inputUrl.toLowerCase();
      }
    };
    
    const normalizedCurrentUrl = normalizeUrl(url);
    
    return this.tabs.some(tab => {
      if (!tab.url) return false;
      const normalizedTabUrl = normalizeUrl(tab.url);
      return normalizedTabUrl === normalizedCurrentUrl;
    });
  }

  extractDomainFromUrl(url) {
    return UiUtils.extractDomain(url);
  }

  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) {
      const dayUnit = browser.i18n.getMessage('days') || 'day';
      const timeAgo = browser.i18n.getMessage('ago') || 'ago';
      return `${timeAgo} ${days} ${dayUnit}${days !== 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      const hourUnit = browser.i18n.getMessage('hours') || 'hour';
      const timeAgo = browser.i18n.getMessage('ago') || 'ago';
      return `${timeAgo} ${hours} ${hourUnit}${hours !== 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      const minuteUnit = browser.i18n.getMessage('minutes') || 'minute';
      const timeAgo = browser.i18n.getMessage('ago') || 'ago';
      return `${timeAgo} ${minutes} ${minuteUnit}${minutes !== 1 ? 's' : ''}`;
    }
    return browser.i18n.getMessage('justNow') || 'Just now';
  }

  showToast(type, icon, message) {
    UiUtils.showToast(this, type, icon, message, 3000);
  }

  hideToast() {
    UiUtils.hideToast(this);
  }

  setupDataChangeListener() {
    // Listen for data changes from background script
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'dataChanged') {
        // Update local data and re-render
        this.tabs = message.data.tabs || [];
        this.categories = message.data.categories || [];
        this.settings = message.data.settings || {};
        this.render();
      }
    });
  }

  // Category order for the main list
  getSortedCategories() {
    // With no pinned tab yet, use the default order
    if (this.tabs.length === 0) {
      return this.getDefaultCategoryOrder();
    }
    
    // Otherwise, alphabetical order
    return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  // Default order, with "Development" last
  getDefaultCategoryOrder() {
    const developmentCategory = this.categories.find(cat => 
      cat.name.toLowerCase().includes('développement') || 
      cat.name.toLowerCase().includes('development') ||
      cat.name.toLowerCase().includes('dev')
    );
    
    if (!developmentCategory) {
      // Without a "Development" category, alphabetical order
      return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Other categories, alphabetically
    const otherCategories = this.categories
      .filter(cat => cat.id !== developmentCategory.id)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // "Development" goes last
    return [...otherCategories, developmentCategory];
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
