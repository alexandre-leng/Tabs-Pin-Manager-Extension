/**
 * Tabs Pin Options Page Script
 * Handles options page functionality and user interactions
 */

import { browser } from '../lib/browser-api.js';
import { I18nHelper } from '../lib/i18n-helper.js';
import { UiUtils } from '../lib/ui-utils.js';
import { mixin } from '../lib/mixins.js';
import { categoryEditor } from './category-editor.js';
import { iconPicker } from './icon-picker.js';
import { importExport } from './import-export.js';
import { tabCards } from './tab-cards.js';
import { tabEditor } from './tab-editor.js';
import { tabOrdering } from './tab-ordering.js';

export class OptionsManager {
  constructor() {
    this.tabs = [];
    this.categories = [];
    this.settings = {};
    
    this.currentEditingTab = null;
    this.iconPickerOpen = false;
    this.currentIconInput = null;
    this.isDataLoading = false; // Flag to prevent unnecessary operations during data load
    this.activeQuickEditPopover = null; // To keep track of the currently open popover
    
    this.elements = this.getElements();
    this.init();
  }

  getElements() {
    return {
      // Main container elements
      tabsGrid: document.getElementById('tabsGrid'),
      emptyTabs: document.getElementById('emptyTabs'),
      categoriesGrid: document.getElementById('categoriesGrid'),
      
      // Action buttons
      addTabBtn: document.getElementById('addTabBtn'),
      addFirstTabBtn: document.getElementById('addFirstTabBtn'),
      resetCategoriesBtn: document.getElementById('resetCategoriesBtn'),
      exportBtn: document.getElementById('exportBtn'),
      importBtn: document.getElementById('importBtn'),
      importFileInput: document.getElementById('importFileInput'),
      
      // Settings
      
      // Tab Modal elements
      tabModalOverlay: document.getElementById('tabModalOverlay'),
      tabModal: document.getElementById('tabModal'),
      closeTabModal: document.getElementById('closeTabModal'),
      tabModalTitle: document.getElementById('tabModalTitle'),
      tabForm: document.getElementById('tabForm'),
      tabUrl: document.getElementById('tabUrl'),
      tabTitle: document.getElementById('tabTitle'),
      tabCategory: document.getElementById('tabCategory'),
      saveTabBtn: document.getElementById('saveTabBtn'),
      cancelTabBtn: document.getElementById('cancelTabBtn'),
      
      // Category Modal elements
      categoryModalOverlay: document.getElementById('categoryModalOverlay'),
      categoryModal: document.getElementById('categoryModal'),
      closeCategoryModal: document.getElementById('closeCategoryModal'),
      categoryModalTitle: document.getElementById('categoryModalTitle'),
      categoryForm: document.getElementById('categoryForm'),
      categoryName: document.getElementById('categoryName'),
      selectedIcon: document.getElementById('selectedIcon'),
      iconSelectorBtn: document.getElementById('iconSelectorBtn'),
      saveCategoryBtn: document.getElementById('saveCategoryBtn'),
      cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
      
      // Icon Picker elements
      iconPickerOverlay: document.getElementById('iconPickerOverlay'),
      iconPickerModal: document.getElementById('iconPickerModal'),
      closeIconPicker: document.getElementById('closeIconPicker'),
      iconSearchInput: document.getElementById('iconSearchInput'),
      iconGrid: document.getElementById('iconGrid'),
      
      // Toast elements
      toast: document.getElementById('toast'),
      toastIcon: document.getElementById('toastIcon'),
      toastMessage: document.getElementById('toastMessage')
    };
  }

  async init() {
    try {
      this.setupI18n();
      this.setupEventListeners();
      this.setupDataChangeListener();
      await this.loadDataWithRetry();
      this.render();
    } catch (error) {
      console.error('Failed to initialize options page:', error);
      // Still render with empty data so the UI is usable
      this.render();
    }
    // Marks the page as interactive (used by the end-to-end tests)
    document.body.dataset.ready = 'true';
  }

  /**
   * Load data with automatic retry and increasing delays.
   * This is important for Chrome where the Service Worker may be asleep.
   */
  async loadDataWithRetry(maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.loadData();
        return; // Success
      } catch (error) {
        console.warn(`Data load attempt ${attempt}/${maxAttempts} failed:`, error.message);
        if (attempt === maxAttempts) {
          throw error;
        }
        // Increasing delay: 200ms, 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, attempt * 300));
      }
    }
  }

  setupI18n() {
    I18nHelper.localizePage(document);
  }

  setupEventListeners() {
    // Tab management
    this.elements.addTabBtn?.addEventListener('click', () => this.openTabModal());
    this.elements.addFirstTabBtn?.addEventListener('click', () => this.openTabModal());
    
    // Category management
    this.elements.resetCategoriesBtn?.addEventListener('click', () => this.resetCategories());
    
    // Import/Export
    this.elements.exportBtn?.addEventListener('click', () => this.exportSettings());
    this.elements.importBtn?.addEventListener('click', () => this.importSettings());
    this.elements.importFileInput?.addEventListener('change', (e) => this.handleFileImport(e));
    
    // Settings - autoOpenTabs listener removed
    
    // Tab Modal
    this.elements.closeTabModal?.addEventListener('click', () => this.closeTabModal());
    this.elements.cancelTabBtn?.addEventListener('click', () => this.closeTabModal());
    this.elements.tabForm?.addEventListener('submit', (e) => this.saveTab(e));
    this.elements.tabModalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.tabModalOverlay) {
        this.closeTabModal();
      }
    });
    
    // Category Modal
    this.elements.closeCategoryModal?.addEventListener('click', () => this.closeCategoryModal());
    this.elements.cancelCategoryBtn?.addEventListener('click', () => this.closeCategoryModal());
    this.elements.categoryForm?.addEventListener('submit', (e) => this.saveCategory(e));
    this.elements.categoryModalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.categoryModalOverlay) {
        this.closeCategoryModal();
      }
    });
    
    // Icon Picker Modal
    this.elements.iconSelectorBtn?.addEventListener('click', () => this.openIconPicker());
    this.elements.closeIconPicker?.addEventListener('click', () => this.closeIconPicker());
    this.elements.iconPickerOverlay?.addEventListener('click', (e) => {
      if (e.target === this.elements.iconPickerOverlay) {
        this.closeIconPicker();
      }
    });
    this.elements.iconSearchInput?.addEventListener('input', (e) => this.searchIcons(e.target.value));
    
    // Icon Category buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('icon-category-btn')) {
        this.switchIconCategory(e.target.dataset.category);
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTopmostDialog();
      }
      // Add F5 for manual refresh
      if (e.key === 'F5') {
        e.preventDefault();
        this.forceRefresh();
      }
    });

    // Close popover on outside click
    document.addEventListener('click', (e) => {
      if (this.activeQuickEditPopover && !this.activeQuickEditPopover.contains(e.target)) {
        // Check if the click was on a category badge, if so, let that handler manage it
        const clickedOnBadge = e.target.closest('.tab-category');
        if (!clickedOnBadge || !this.activeQuickEditPopover.previousElementSibling?.contains(clickedOnBadge)) {
            this.closeCategoryQuickEdit();
        }
      }
    });
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

  async loadData(force = false) {
    try {
      const response = await this.sendMessageWithRetry({
        action: 'getTabsData',
        force: force
      });
      
      if (response && response.success) {
        this.tabs = response.data.tabs || [];
        this.categories = response.data.categories || [];
        this.settings = response.data.settings || {};
      } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToLoadData'));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  // Send a message to the background script, retrying while it is unreachable
  sendMessageWithRetry(message) {
    return UiUtils.sendMessage(message);
  }

  render() {
    this.renderTabs();
    this.renderCategories();
  }

  renderTabs() {
    if (!this.elements.tabsGrid || !this.elements.emptyTabs) return;
    
    if (this.tabs.length === 0) {
      this.elements.tabsGrid.style.display = 'none';
      this.elements.emptyTabs.style.display = 'flex';
      return;
    }
    
    this.elements.tabsGrid.style.display = 'grid';
    this.elements.emptyTabs.style.display = 'none';
    
    // Clear existing content safely
    while (this.elements.tabsGrid.firstChild) {
      this.elements.tabsGrid.removeChild(this.elements.tabsGrid.firstChild);
    }
    
    const sortedTabs = this.getSortedTabs();
    
    sortedTabs.forEach((tab, index) => {
      const tabCard = this.createTabCard(tab, index, sortedTabs.length);
      this.elements.tabsGrid.appendChild(tabCard);
    });
    
    // Enable drag and drop
    this.enableDragAndDrop();
  }

  renderCategories() {
    if (!this.elements.categoriesGrid) return;
    
    // Clear existing content safely
    while (this.elements.categoriesGrid.firstChild) {
      this.elements.categoriesGrid.removeChild(this.elements.categoriesGrid.firstChild);
    }
    
    this.categories.forEach(category => {
      const categoryCard = this.createCategoryCard(category);
      this.elements.categoriesGrid.appendChild(categoryCard);
    });
  }

  createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-item';
    card.dataset.categoryId = category.id;
    
    // Count tabs in this category
    const tabCount = this.tabs.filter(tab => tab.category === category.id).length;
    
    // Get translated tab word (singular/plural)
    const tabWord = tabCount !== 1 ? 
      (browser.i18n.getMessage('tabPlural')) :
      (browser.i18n.getMessage('tabSingular'));
    
    // Create elements safely
    const iconDiv = document.createElement('div');
    iconDiv.className = 'category-icon';
    iconDiv.textContent = category.icon;
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'category-info';
    
    const nameTitle = document.createElement('h3');
    nameTitle.className = 'category-name';
    nameTitle.textContent = category.name;
    
    const countPara = document.createElement('p');
    countPara.className = 'category-count';
    countPara.textContent = `${tabCount} ${tabWord}`;
    
    // Assemble the structure
    infoDiv.appendChild(nameTitle);
    infoDiv.appendChild(countPara);
    card.appendChild(iconDiv);
    card.appendChild(infoDiv);
    
    // Add click event to edit category
    card.addEventListener('click', () => this.editCategory(category));
    UiUtils.makeActivatable(card, () => this.editCategory(category), {
      label: `${browser.i18n.getMessage('editCategory')}: ${category.name}`
    });
    
    return card;
  }

  // Hide an overlay once its fade-out is done. A timer is used instead of a one-shot
  // 'transitionend' listener: that event bubbles up from child elements, and a listener
  // left behind when closing an already-closed modal would hide the modal on its next opening.
  /** Escape closes only the dialog on top (the icon picker sits over the category editor). */
  closeTopmostDialog() {
    const isOpen = overlay => overlay?.classList.contains('show');
    if (this.activeQuickEditPopover) {
      this.closeCategoryQuickEdit();
    } else if (isOpen(this.elements.iconPickerOverlay)) {
      this.closeIconPicker();
    } else if (isOpen(this.elements.categoryModalOverlay)) {
      this.closeCategoryModal();
    } else if (isOpen(this.elements.tabModalOverlay)) {
      this.closeTabModal();
    }
  }

  hideOverlay(overlay) {
    if (overlay) UiUtils.hideDialog(overlay);
  }

  // Utility methods
  isValidUrl(url) {
    return UiUtils.isValidUrl(url);
  }

  extractDomain(url) {
    return UiUtils.extractDomain(url);
  }

  showToast(type, icon, message) {
    UiUtils.showToast(this, type, icon, message, 4000);
  }

  hideToast() {
    UiUtils.hideToast(this);
  }

  // Force refresh of all data
  async forceRefresh() {
    await this.loadData(true);
    this.render();
    this.showToast('success', '✅', browser.i18n.getMessage('dataRefreshed'));
  }
}

mixin(OptionsManager.prototype, tabCards, tabEditor, tabOrdering, categoryEditor, iconPicker, importExport);
