/**
 * Tabs Pin Popup Script
 * Handles popup interface and user interactions
 */

import { browser } from '../lib/browser-api.js';
import { getDefaultCategories } from '../lib/default-categories.js';
import { I18nHelper } from '../lib/i18n-helper.js';
import { StorageManager } from '../lib/storage-manager.js';
import { UiUtils } from '../lib/ui-utils.js';
import { formatTimeAgo } from '../lib/time-format.js';
import { normalizeUrl } from '../lib/url-utils.js';
import { mixin } from '../lib/mixins.js';
import { categoryList } from './category-list.js';
import { categorySelection } from './category-selection.js';
import { tabActions } from './tab-actions.js';

export class PopupManager {
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
      this.showToast('error', '❌', browser.i18n.getMessage('failedToInitialize'));
    }
    // Marks the page as interactive (used by the end-to-end tests)
    document.body.dataset.ready = 'true';
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
   * Send message to background script, retrying while it is unreachable
   * @param {object} message - Message to send
   * @returns {Promise<object>} Successful response from background script
   */
  async sendMessageWithRetry(message) {
    const response = await UiUtils.sendMessage(message);
    // Popup callers treat a background failure as an exception
    if (response.success === false) {
      throw new Error(response.error || 'Background script operation failed');
    }
    return response;
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
    return getDefaultCategories(browser.i18n);
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

  /** Tabs the "open all" action acts on. */
  get enabledTabs() {
    return this.tabs.filter(tab => tab.enabled !== false);
  }

  updateTabCount() {
    const openCount = this.enabledTabs.length;
    if (this.elements.tabCount) {
      this.elements.tabCount.textContent = this.tabs.length;
    }
    
    // Update button text with proper internationalization and grammar
    if (this.elements.openAllBtn) {
      const btnText = this.elements.openAllBtn.querySelector('.btn-text');
      if (btnText) {
        let buttonMessage;
        if (openCount === 1) {
          // Use singular form
          buttonMessage = browser.i18n.getMessage('openTabsSingular', [openCount.toString()]);
        } else {
          // Use plural form
          buttonMessage = browser.i18n.getMessage('openTabsPlural', [openCount.toString()]);
        }
        
        // Fallback to old method if new translations are not available
        if (!buttonMessage) {
          if (openCount === 1) {
            buttonMessage = browser.i18n.getMessage('openOneTab');
          } else {
            buttonMessage = browser.i18n.getMessage('openTabsCount', [openCount.toString()]);
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
        const prefix = browser.i18n.getMessage('lastOpenedPrefix');
        this.elements.statusText.textContent = `${prefix} ${timeAgo}`;
      } else {
        this.elements.statusText.textContent = browser.i18n.getMessage('readyToOpenTabs');
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
            tooltip.textContent = browser.i18n.getMessage('pinCurrentTab');
          } else if (this.currentTab && this.isTabAlreadyPinned(this.currentTab.url)) {
            tooltip.textContent = browser.i18n.getMessage('tabAlreadyPinned');
          } else {
            tooltip.textContent = browser.i18n.getMessage('currentTabCannotBePinned');
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

  /** Same matching as the background script uses to avoid opening duplicates. */
  isTabAlreadyPinned(url) {
    const key = normalizeUrl(url);
    return Boolean(key) && this.tabs.some(tab => normalizeUrl(tab.url) === key);
  }

  extractDomainFromUrl(url) {
    return UiUtils.extractDomain(url);
  }

  getTimeAgo(date) {
    return formatTimeAgo(date, {
      locale: browser.i18n.getUILanguage(),
      justNow: browser.i18n.getMessage('justNow')
    });
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
}

mixin(PopupManager.prototype, categoryList, tabActions, categorySelection);
