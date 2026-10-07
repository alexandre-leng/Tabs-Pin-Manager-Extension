/**
 * Tabs Pin Options Page Script
 * Handles options page functionality and user interactions
 */

'use strict';

// Enhanced animations
function animateElements() {
  // Animate sections with stagger effect
  const sections = document.querySelectorAll('.section');
  sections.forEach((section, index) => {
    section.style.animationDelay = `${index * 0.1}s`;
    section.classList.add('fade-in-up');
  });

  // Animate cards with stagger
  const cards = document.querySelectorAll('.tab-item, .category-item');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${0.3 + (index * 0.05)}s`;
    card.classList.add('fade-in-up');
  });
}

// Page load handler
document.addEventListener('DOMContentLoaded', () => {
  // Start initialization
  setTimeout(() => {
    // Initialize the options manager
    window.optionsManager = new OptionsManager();
    
    // Animate elements after initialization
    setTimeout(() => {
      animateElements();
    }, 100);
  }, 50);
});

// SVG paths of the tab card icons (24x24 viewBox)
const TAB_CARD_ICONS = {
  drag: 'M11,18c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S11,16.9,11,18z M9,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S10.1,10,9,10z M9,4C7.9,4,7,4.9,7,6s0.9,2,2,2s2-0.9,2-2S10.1,4,9,4z M15,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S13.9,8,15,8z M15,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S16.1,10,15,10z M15,16c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S16.1,16,15,16z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  delete: 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z',
  up: 'M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z',
  down: 'M7.41,8.59L12,13.17L16.59,8.59L18,10L12,16L6,10L7.41,8.59Z'
};

class OptionsManager {
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
        this.closeTabModal();
        this.closeCategoryModal();
        this.closeIconPicker();
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

  // Helper method to send messages with retry logic
  async sendMessageWithRetry(message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await browser.runtime.sendMessage(message);
        return response;
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed to communicate with background script after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 100));
      }
    }
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

  createTabCard(tab, index, total) {
    const card = document.createElement('div');
    card.className = 'tab-item';
    card.dataset.tabId = tab.id;
    card.dataset.tabIndex = index;
    card.draggable = true;

    const orderIndicator = document.createElement('div');
    orderIndicator.className = 'tab-order-indicator';
    orderIndicator.textContent = index + 1;

    const category = this.categories.find(c => c.id === tab.category);
    const categoryIcon = category ? category.icon : '📁';

    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.title = browser.i18n.getMessage('dragToReorder') || 'Drag to reorder';
    dragHandle.appendChild(this.createSvgIcon(16, TAB_CARD_ICONS.drag));

    const faviconContainer = document.createElement('div');
    faviconContainer.className = 'tab-favicon-container';
    faviconContainer.appendChild(this.createFaviconElement(tab.url, categoryIcon));

    const cardHeader = document.createElement('div');
    cardHeader.className = 'tab-card-header';
    cardHeader.append(dragHandle, faviconContainer, this.createTabInfo(tab), this.createTabActions(tab, index, total));

    card.append(orderIndicator, cardHeader, this.createCategoryBadge(tab, category));
    return card;
  }

  createTabInfo(tab) {
    const tabInfo = document.createElement('div');
    tabInfo.className = 'tab-info';

    const tabTitle = document.createElement('h3');
    tabTitle.className = 'tab-title';
    tabTitle.textContent = tab.title || this.extractDomain(tab.url);

    const tabUrl = document.createElement('p');
    tabUrl.className = 'tab-url';
    tabUrl.textContent = tab.url;

    tabInfo.append(tabTitle, tabUrl);
    return tabInfo;
  }

  // Move up / move down are a simple alternative to drag and drop
  createTabActions(tab, index, total) {
    const label = (key, fallback) => browser.i18n.getMessage(key) || fallback;
    const tabActions = document.createElement('div');
    tabActions.className = 'tab-actions';
    tabActions.append(
      this.createIconButton('icon-btn move-up', label('moveUp', 'Move up'), TAB_CARD_ICONS.up,
        () => this.moveTab(tab.id, -1), index === 0),
      this.createIconButton('icon-btn move-down', label('moveDown', 'Move down'), TAB_CARD_ICONS.down,
        () => this.moveTab(tab.id, 1), index === total - 1),
      this.createIconButton('icon-btn edit', label('edit', 'Edit'), TAB_CARD_ICONS.edit,
        () => this.editTab(tab)),
      this.createIconButton('icon-btn danger delete', label('delete', 'Delete'), TAB_CARD_ICONS.delete,
        () => this.deleteTab(tab))
    );
    return tabActions;
  }

  createCategoryBadge(tab, category) {
    const badge = document.createElement('div');
    badge.className = 'tab-category';
    badge.title = browser.i18n.getMessage('changeCategoryTooltip') || 'Change category';

    const iconSpan = document.createElement('span');
    iconSpan.textContent = category ? category.icon : '📁';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = category ? category.name : (browser.i18n.getMessage('uncategorized') || 'Uncategorized');
    badge.append(iconSpan, nameSpan);

    badge.addEventListener('click', (e) => {
      e.stopPropagation(); // Keep the click away from the card (drag handling)
      this.openCategoryQuickEdit(e.currentTarget, tab);
    });
    return badge;
  }

  createIconButton(className, label, pathData, onClick, disabled = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.disabled = disabled;
    button.appendChild(this.createSvgIcon(12, pathData));
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return button;
  }

  createSvgIcon(size, pathData) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    svg.appendChild(path);
    return svg;
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
      (browser.i18n.getMessage('tabPlural') || 'tabs') :
      (browser.i18n.getMessage('tabSingular') || 'tab');
    
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
    card.addEventListener('click', (e) => {
      this.editCategory(category);
    });
    
    return card;
  }

  // Hide an overlay once its fade-out is done. A timer is used instead of a one-shot
  // 'transitionend' listener: that event bubbles up from child elements, and a listener
  // left behind when closing an already-closed modal would hide the modal on its next opening.
  hideOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => {
      if (!overlay.classList.contains('show')) {
        overlay.style.display = 'none';
      }
    }, 350);
  }

  // Utility methods
  isValidUrl(url) {
    return UiUtils.isValidUrl(url);
  }

  extractDomain(url) {
    return UiUtils.extractDomain(url);
  }

  getFaviconUrl(domain, fallbackIcon = '🌐') {
    // Return a data URL with a fallback icon if no domain
    if (!domain) {
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-size="12">${fallbackIcon}</text>
        </svg>
      `)}`;
    }
    
    return UiUtils.getFaviconServices(domain)[0];
  }

  createFaviconElement(url, fallbackIcon = '🌐') {
    const domain = this.extractDomain(url);
    
    // Create favicon img element
    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.alt = 'Favicon';
    
    // Create fallback element
    const fallback = document.createElement('span');
    fallback.className = 'tab-favicon-fallback';
    fallback.textContent = fallbackIcon;
    fallback.style.display = 'none';
    fallback.style.fontSize = '16px';
    fallback.style.lineHeight = '16px';
    fallback.style.width = '16px';
    fallback.style.height = '16px';
    fallback.style.textAlign = 'center';
    
    if (!domain) {
      favicon.src = this.getFaviconUrl(domain);
    }
    UiUtils.loadFavicon(favicon, domain, {
      onLoad: () => {
        fallback.style.display = 'none';
        favicon.style.display = 'inline-block';
      },
      onFail: () => {
        favicon.style.display = 'none';
        fallback.style.display = 'inline-block';
      }
    });
    
    // Create a fragment to return both elements
    const fragment = document.createDocumentFragment();
    fragment.appendChild(favicon);
    fragment.appendChild(fallback);
    
    return fragment;
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
