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
    // Apply internationalization to all data-i18n elements
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = browser.i18n.getMessage(key);
      if (message) {
        element.textContent = message;
      }
    });

    // Apply placeholder translations
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const message = browser.i18n.getMessage(key);
      if (message) {
        element.placeholder = message;
      }
    });

    // Apply title translations (tooltips)
    const i18nTitleElements = document.querySelectorAll('[data-i18n-title]');
    i18nTitleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const message = browser.i18n.getMessage(key);
      if (message) {
        element.title = message;
      }
    });
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
    
    // Add order indicator
    const orderIndicator = document.createElement('div');
    orderIndicator.className = 'tab-order-indicator';
    orderIndicator.textContent = index + 1;
    card.appendChild(orderIndicator);
    
    // Get category info
    const category = this.categories.find(c => c.id === tab.category);
    const categoryName = category ? category.name : (browser.i18n.getMessage('uncategorized') || 'Uncategorized');
    const categoryIcon = category ? category.icon : '📁';
    
    // Get translated button labels
    const editLabel = browser.i18n.getMessage('edit') || 'Edit';
    const deleteLabel = browser.i18n.getMessage('delete') || 'Delete';
    const dragLabel = browser.i18n.getMessage('dragToReorder') || 'Drag to reorder';
    const changeCategoryLabel = browser.i18n.getMessage('changeCategoryTooltip') || 'Change category';
    
    // Create card header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'tab-card-header';
    
    // Create drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.title = dragLabel;
    
    // Create SVG for drag handle
    const dragSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dragSvg.setAttribute('width', '16');
    dragSvg.setAttribute('height', '16');
    dragSvg.setAttribute('viewBox', '0 0 24 24');
    dragSvg.setAttribute('fill', 'currentColor');
    
    const dragPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dragPath.setAttribute('d', 'M11,18c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S11,16.9,11,18z M9,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S10.1,10,9,10z M9,4C7.9,4,7,4.9,7,6s0.9,2,2,2s2-0.9,2-2S10.1,4,9,4z M15,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S13.9,8,15,8z M15,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S16.1,10,15,10z M15,16c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S16.1,16,15,16z');
    
    dragSvg.appendChild(dragPath);
    dragHandle.appendChild(dragSvg);
    
    // Create favicon container
    const faviconContainer = document.createElement('div');
    faviconContainer.className = 'tab-favicon-container';
    
    // Create tab info
    const tabInfo = document.createElement('div');
    tabInfo.className = 'tab-info';
    
    const tabTitle = document.createElement('h3');
    tabTitle.className = 'tab-title';
    tabTitle.textContent = tab.title || this.extractDomain(tab.url);
    
    const tabUrl = document.createElement('p');
    tabUrl.className = 'tab-url';
    tabUrl.textContent = tab.url;
    
    tabInfo.appendChild(tabTitle);
    tabInfo.appendChild(tabUrl);
    
    // Create actions
    const tabActions = document.createElement('div');
    tabActions.className = 'tab-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn edit';
    editBtn.title = editLabel;
    
    // Create SVG for edit button
    const editSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    editSvg.setAttribute('width', '12');
    editSvg.setAttribute('height', '12');
    editSvg.setAttribute('viewBox', '0 0 24 24');
    editSvg.setAttribute('fill', 'currentColor');
    
    const editPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    editPath.setAttribute('d', 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z');
    
    editSvg.appendChild(editPath);
    editBtn.appendChild(editSvg);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn danger delete';
    deleteBtn.title = deleteLabel;
    
    // Create SVG for delete button
    const deleteSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    deleteSvg.setAttribute('width', '12');
    deleteSvg.setAttribute('height', '12');
    deleteSvg.setAttribute('viewBox', '0 0 24 24');
    deleteSvg.setAttribute('fill', 'currentColor');
    
    const deletePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    deletePath.setAttribute('d', 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z');
    
    deleteSvg.appendChild(deletePath);
    deleteBtn.appendChild(deleteSvg);
    
    // Move up / move down buttons: simple alternative to drag and drop
    const createMoveButton = (direction, label, pathData, disabled) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `icon-btn move-${direction}`;
      btn.title = label;
      btn.setAttribute('aria-label', label);
      btn.disabled = disabled;
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '12');
      svg.setAttribute('height', '12');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'currentColor');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      svg.appendChild(path);
      btn.appendChild(svg);
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.moveTab(tab.id, direction === 'up' ? -1 : 1);
      });
      return btn;
    };
    
    const moveUpBtn = createMoveButton('up', browser.i18n.getMessage('moveUp') || 'Move up',
      'M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z', index === 0);
    const moveDownBtn = createMoveButton('down', browser.i18n.getMessage('moveDown') || 'Move down',
      'M7.41,8.59L12,13.17L16.59,8.59L18,10L12,16L6,10L7.41,8.59Z', index === total - 1);
    
    tabActions.appendChild(moveUpBtn);
    tabActions.appendChild(moveDownBtn);
    tabActions.appendChild(editBtn);
    tabActions.appendChild(deleteBtn);
    
    // Assemble header
    cardHeader.appendChild(dragHandle);
    cardHeader.appendChild(faviconContainer);
    cardHeader.appendChild(tabInfo);
    cardHeader.appendChild(tabActions);
    
    // Create category badge
    const categoryBadge = document.createElement('div');
    categoryBadge.className = 'tab-category';
    categoryBadge.title = changeCategoryLabel;
    
    const categoryIconSpan = document.createElement('span');
    categoryIconSpan.textContent = categoryIcon;
    
    const categoryNameSpan = document.createElement('span');
    categoryNameSpan.textContent = categoryName;
    
    categoryBadge.appendChild(categoryIconSpan);
    categoryBadge.appendChild(categoryNameSpan);
    
    // Assemble card
    card.appendChild(cardHeader);
    card.appendChild(categoryBadge);
    
    // Add the favicon element to the container
    const faviconElement = this.createFaviconElement(tab.url, categoryIcon);
    faviconContainer.appendChild(faviconElement);
    
    // Add event listeners
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.editTab(tab);
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.deleteTab(tab);
      });
    }
    
    if (categoryBadge) {
      categoryBadge.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click or other parent events
        this.openCategoryQuickEdit(e.currentTarget, tab);
      });
    }
    
    return card;
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


  openTabModal(tab = null) {
    this.currentEditingTab = tab;
    
    // Populate category dropdown FIRST, so its options are available when setting the value.
    this.populateCategoryDropdown();

    if (tab) {
      // Edit mode
      this.elements.tabModalTitle.textContent = browser.i18n.getMessage('editTabTitle') || 'Edit Tab'; // Suggest using a more specific key like editTabTitle
      this.elements.tabUrl.value = tab.url || '';
      this.elements.tabTitle.value = tab.title || '';
      this.elements.tabCategory.value = tab.category || ''; // This should now work reliably
    } else {
      // Add mode
      this.elements.tabModalTitle.textContent = browser.i18n.getMessage('addNewTab') || 'Add New Tab';
      this.elements.tabUrl.value = '';
      this.elements.tabTitle.value = '';
      // Ensure categories are loaded and select the first one, or empty if no categories
      this.elements.tabCategory.value = this.categories.length > 0 ? (this.categories[0]?.id || '') : '';
    }
    
    // Show modal
    this.elements.tabModalOverlay.style.display = 'flex'; // Ensure it is display:flex before adding show
    requestAnimationFrame(() => {
      this.elements.tabModalOverlay.classList.add('show');
    });
    this.elements.tabUrl.focus();
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

  closeTabModal() {
    this.hideOverlay(this.elements.tabModalOverlay);

    this.currentEditingTab = null;
    this.elements.tabForm.reset();
  }

  populateCategoryDropdown() {
    if (!this.elements.tabCategory) return;
    
    // Clear existing content safely
    while (this.elements.tabCategory.firstChild) {
      this.elements.tabCategory.removeChild(this.elements.tabCategory.firstChild);
    }
    
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = `${category.icon} ${category.name}`;
      option.dataset.icon = category.icon;
      option.dataset.name = category.name;
      this.elements.tabCategory.appendChild(option);
    });
  }

  async saveTab(event) {
    event.preventDefault();
    
    const url = this.elements.tabUrl.value.trim();
    const title = this.elements.tabTitle.value.trim();
    const category = this.elements.tabCategory.value;
    
    if (!this.isValidUrl(url)) {
      this.showToast('error', '❌', browser.i18n.getMessage('invalidUrl') || 'Invalid URL');
      return;
    }
    
    const tabData = {
      id: this.currentEditingTab?.id || this.generateTabId(),
      url: url,
      title: title || this.extractDomain(url),
      category: category,
      enabled: this.currentEditingTab ? this.currentEditingTab.enabled !== false : true,
      dateAdded: this.currentEditingTab?.dateAdded || new Date().toISOString()
    };
    
    try {
      const response = await this.sendMessageWithRetry({
        action: 'saveTab',
        tab: tabData
      });
      
      if (response && response.success) {
        const message = this.currentEditingTab ? 
          (browser.i18n.getMessage('tabsSaved') || 'Tab updated successfully!') :
          (browser.i18n.getMessage('tabsSaved') || 'Tab saved successfully!');
        
        await this.loadData();
        this.renderTabs();
        this.renderCategories();
        this.closeTabModal();
        
        this.showToast('success', '✅', message);
    } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToSaveTab'));
      }
    } catch (error) {
      console.error('Error saving tab:', error);
      this.showToast('error', '❌', error.message);
    }
  }

  editTab(tab) {
    this.openTabModal(tab);
  }

  async deleteTab(tab) {
    const confirmMessage = browser.i18n.getMessage('deleteConfirm') || 'Are you sure you want to delete this tab?';
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const response = await this.sendMessageWithRetry({
        action: 'deleteTab',
        tabId: tab.id
      });
      
      if (response && response.success) {
        await this.loadData();
        this.renderTabs();
        this.renderCategories();
        this.showToast('success', '✅', browser.i18n.getMessage('tabDeleted') || 'Tab deleted successfully!');
      } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToDeleteTab'));
      }
    } catch (error) {
      console.error('Error deleting tab:', error);
      this.showToast('error', '❌', error.message);
    }
  }

  // Category management methods
  editCategory(category) {
    this.currentEditingCategory = category;
    
    if (this.elements.categoryModalTitle) {
      this.elements.categoryModalTitle.textContent = browser.i18n.getMessage('editCategory') || 'Edit Category';
    }
    
    if (this.elements.categoryName) {
      this.elements.categoryName.value = category.name || '';
    }
    
    // Set the selected icon in the icon selector
    if (this.elements.selectedIcon) {
      this.elements.selectedIcon.textContent = category.icon || '📁';
    }
    
    if (this.elements.categoryModalOverlay) {
      this.elements.categoryModalOverlay.style.display = 'flex'; // Ensure it is display:flex before adding show
      requestAnimationFrame(() => {
      this.elements.categoryModalOverlay.classList.add('show');
      });
    }
    
    if (this.elements.categoryName) {
      this.elements.categoryName.focus();
    }
    
  }

  closeCategoryModal() {
    this.hideOverlay(this.elements.categoryModalOverlay);
    
    this.currentEditingCategory = null;
    
    if (this.elements.categoryForm) {
      this.elements.categoryForm.reset();
    }
  }

  async saveCategory(event) {
    event.preventDefault();
    
    const name = this.elements.categoryName.value.trim();
    const icon = this.getSelectedIcon();
    
    if (!name) {
      this.showToast('error', '❌', browser.i18n.getMessage('categoryNameRequired') || 'Category name is required');
      return;
    }
    
    if (!icon) {
      this.showToast('error', '❌', browser.i18n.getMessage('categoryIconRequired') || 'Category icon is required');
      return;
    }
    
    // Update the category in the categories array
    if (!this.currentEditingCategory) return;
    
    const updatedCategories = this.categories.map(c =>
      c.id === this.currentEditingCategory.id ? { ...c, name: name, icon: icon } : c
    );
    
    try {
      const response = await this.sendMessageWithRetry({
        action: 'saveCategories',
        categories: updatedCategories
      });
      
      if (response && response.success) {
        await this.loadData();
        this.renderTabs();
        this.renderCategories();
        this.closeCategoryModal();
        this.showToast('success', '✅', browser.i18n.getMessage('categorySaved') || 'Category saved successfully!');
      } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToSaveCategory'));
      }
    } catch (error) {
      console.error('Error saving category:', error);
      this.showToast('error', '❌', error.message);
    }
  }

  async resetCategories() {
    const confirmed = confirm(browser.i18n.getMessage('resetCategoriesConfirm') || 'Are you sure you want to reset all categories? This will restore default names and icons.');
    
    if (!confirmed) return;
    
    try {
      const defaultCategories = DefaultCategories.getDefaultCategories(browser.i18n);
      
      const response = await this.sendMessageWithRetry({
        action: 'saveCategories',
        categories: defaultCategories
      });
      
      if (response && response.success) {
        this.categories = defaultCategories;
        this.render();
        this.showToast('success', '✅', browser.i18n.getMessage('categoriesReset') || 'Categories reset to default!');
      } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToResetCategories'));
      }
    } catch (error) {
      console.error('Error resetting categories:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('failedToResetCategories'));
    }
  }

  // Settings management - autoOpenTabs feature removed
  
  // Import/Export functionality
  exportSettings() {
    try {
      const exportData = {
        tabs: this.tabs,
      categories: this.categories,
      settings: this.settings,
      exportDate: new Date().toISOString(),
        version: browser.runtime.getManifest().version
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `tabsflow-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      
      this.showToast('success', '✅', browser.i18n.getMessage('settingsExported') || 'Settings exported successfully!');
    } catch (error) {
      console.error('Error exporting settings:', error);
      const errorMessage = browser.i18n.getMessage('errorGeneral') || 'Failed to export settings';
      this.showToast('error', '❌', errorMessage);
    }
  }

  importSettings() {
    this.elements.importFileInput.click();
  }

  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data
      if (!Array.isArray(importData.tabs) || !Array.isArray(importData.categories) || !importData.settings) {
        throw new Error('Invalid file format');
      }
      
      // Import data via background script in one operation
      const response = await this.sendMessageWithRetry({ 
        action: 'importAllData', 
        data: importData 
      });
      
      if (!response || !response.success) {
        throw new Error(response?.error || browser.i18n.getMessage('failedToImportData'));
      }
      
      // Reload and render
      await this.loadData();
      this.render();
      
      this.showToast('success', '✅', browser.i18n.getMessage('settingsImported') || 'Settings imported successfully!');
    } catch (error) {
      console.error('Error importing settings:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('invalidFile') || 'Invalid file format');
    }
    
    // Clear file input
    event.target.value = '';
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

  generateTabId() {
    return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

  enableDragAndDrop() {
    const grid = this.elements.tabsGrid;
    const tabItems = grid.querySelectorAll('.tab-item');
    
    // Drag state lives on the instance so the grid-level listeners (registered once)
    // and the per-card listeners (re-registered on every render) share it.
    if (!this.dragState) {
      this.dragState = { draggedElement: null, dropped: false };
    }
    const state = this.dragState;
    
    tabItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        state.draggedElement = item;
        state.dropped = false;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.tabId);
        // Add the classes after the browser captured the drag image
        requestAnimationFrame(() => {
          item.classList.add('dragging');
          grid.classList.add('is-dragging');
        });
      });
      
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        grid.classList.remove('is-dragging');
        const cancelled = !state.dropped;
        state.draggedElement = null;
        state.dropped = false;
        
        // Drag cancelled (Escape, dropped outside the grid): restore the saved order
        if (cancelled) {
          this.renderTabs();
        }
      });
    });
    
    // The grid element persists across renders: only register its listeners once,
    // otherwise every render stacks another handler.
    if (this.gridDragListenersBound) return;
    this.gridDragListenersBound = true;
    
    // The dragged card itself is moved live in the grid (no placeholder): a placeholder
    // adds an extra grid cell, which shifts every card while dragging.
    grid.addEventListener('dragover', (e) => {
      const dragged = state.draggedElement;
      if (!dragged) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const target = this.getDropTarget(e.clientX, e.clientY, dragged);
      if (target !== dragged.nextElementSibling) {
        grid.insertBefore(dragged, target);
      }
    });
    
    grid.addEventListener('drop', (e) => {
      const dragged = state.draggedElement;
      if (!dragged) return;
      e.preventDefault();
      state.dropped = true;
      
      const orderedIds = this.calculateNewOrder();
      if (orderedIds) {
        this.reorderTabs(orderedIds);
      }
    });
  }

  // Returns the card the dragged card must be inserted before (null = at the end),
  // following the grid reading order: rows top to bottom, then columns left to right.
  getDropTarget(x, y, dragged) {
    const cards = Array.from(this.elements.tabsGrid.querySelectorAll('.tab-item'))
      .filter(card => card !== dragged);
    
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      // Pointer above this card's row
      if (y < rect.top) {
        return card;
      }
      // Pointer in this card's row, on its left half
      if (y <= rect.bottom && x < rect.left + rect.width / 2) {
        return card;
      }
    }
    return null;
  }

  // Returns the tab IDs in their new visual order, or null if nothing changed
  calculateNewOrder() {
    const orderedIds = Array.from(this.elements.tabsGrid.querySelectorAll('.tab-item'))
      .map(card => card.dataset.tabId);
    
    const currentIds = this.getSortedTabs().map(t => t.id);
    const unchanged = orderedIds.length === currentIds.length &&
      orderedIds.every((id, i) => id === currentIds[i]);
    
    return unchanged ? null : orderedIds;
  }

  getSortedTabs() {
    // Sort tabs by order (if exists) or by dateAdded
    return [...this.tabs].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
    });
  }

  // Move a tab one position up (delta = -1) or down (delta = 1)
  moveTab(tabId, delta) {
    const orderedIds = this.getSortedTabs().map(t => t.id);
    const index = orderedIds.indexOf(tabId);
    const newIndex = index + delta;
    if (index === -1 || newIndex < 0 || newIndex >= orderedIds.length) return;
    
    [orderedIds[index], orderedIds[newIndex]] = [orderedIds[newIndex], orderedIds[index]];
    this.reorderTabs(orderedIds);
  }

  async reorderTabs(orderedIds) {
    try {
      const response = await this.sendMessageWithRetry({
        action: 'reorderTabs',
        tabIds: orderedIds
      });
      
      if (response && response.success) {
        // Update local data with the normalized orders from the background
        if (Array.isArray(response.tabs)) {
          this.tabs = response.tabs;
        }
        
        this.showToast('success', '↕️', browser.i18n.getMessage('tabReordered') || 'Tab order updated!');
        this.renderTabs();
      } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToReorderTab'));
      }
    } catch (error) {
      console.error('Error reordering tab:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('reorderError') || browser.i18n.getMessage('failedToReorderTab'));
      
      // Reload data to reset state
      await this.loadData();
      this.renderTabs();
    }
  }


  getSelectedIcon() {
    return this.elements.selectedIcon?.textContent || '📁';
  }

  // Category Quick Edit Popover Management
  openCategoryQuickEdit(badgeElement, tab) {
    this.closeCategoryQuickEdit(); // Close any existing popover

    const template = document.getElementById('categoryQuickEditPopoverTemplate');
    if (!template) return;

    const popover = template.cloneNode(true);
    popover.id = 'activeCategoryQuickEditPopover';
    document.body.appendChild(popover);
    this.activeQuickEditPopover = popover;

    const selectElement = popover.querySelector('.popover-category-select');
    
    // Clear existing options safely
    while (selectElement.firstChild) {
      selectElement.removeChild(selectElement.firstChild);
    }
    
    // Add categories with proper icon display
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = `${category.icon} ${category.name}`;
      option.dataset.icon = category.icon;
      option.dataset.name = category.name;
      
      if (category.id === tab.category) {
        option.selected = true;
      }
      
      selectElement.appendChild(option);
    });

    const confirmBtn = popover.querySelector('.popover-confirm-btn');
    const cancelBtn = popover.querySelector('.popover-cancel-btn');

    confirmBtn.onclick = () => this.handleQuickCategoryChange(tab.id, selectElement.value);
    cancelBtn.onclick = () => this.closeCategoryQuickEdit();

    // Positioning
    const badgeRect = badgeElement.getBoundingClientRect();
    popover.style.top = `${badgeRect.bottom + window.scrollY + 5}px`;
    popover.style.left = `${badgeRect.left + window.scrollX}px`;
    
    // Ensure popover doesn't go off screen
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust horizontal position if needed
    if (popoverRect.right > viewportWidth) {
      popover.style.left = `${badgeRect.right + window.scrollX - popoverRect.width}px`;
    }
    
    // Adjust vertical position if needed (show above if not enough space below)
    if (popoverRect.bottom > viewportHeight) {
      popover.style.top = `${badgeRect.top + window.scrollY - popoverRect.height - 5}px`;
    }
    
    // Ensure popover is visible before starting animation
    popover.style.display = 'flex';
    requestAnimationFrame(() => {
        popover.classList.add('show');
    });
    
    selectElement.focus();
  }

  async handleQuickCategoryChange(tabId, newCategoryId) {
    const tab = this.tabs.find(t => t.id === tabId);
    const newCategory = this.categories.find(c => c.id === newCategoryId);
    
    if (tab && newCategory && tab.category !== newCategoryId) {
      // Store old category for potential rollback
      const oldCategoryId = tab.category;
      
      // Update tab category immediately
      tab.category = newCategoryId;
      
      // Find the tab element and update the badge immediately for visual feedback
      const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
      if (tabElement) {
        const categoryBadge = tabElement.querySelector('.tab-category');
        if (categoryBadge) {
          const iconSpan = categoryBadge.querySelector('span:first-child');
          const nameSpan = categoryBadge.querySelector('span:last-child');
          if (iconSpan && nameSpan) {
            iconSpan.textContent = newCategory.icon;
            nameSpan.textContent = newCategory.name;
          }
        }
      }
      
      try {
        const response = await this.sendMessageWithRetry({
          action: 'saveTab',
          tab: tab
        });
        
        if (response && response.success) {
          // Success - reload data to ensure consistency
          await this.loadData();
          this.renderTabs();
          this.renderCategories();
          this.showToast('success', '✅', browser.i18n.getMessage('categoryChanged') || 'Category updated!');
        } else {
          throw new Error(response?.error || browser.i18n.getMessage('failedToUpdateCategory'));
        }
      } catch (error) {
        console.error('Error updating category:', error);
        
        // Rollback the change
        tab.category = oldCategoryId;
        
        // Rollback visual change
        if (tabElement) {
          const categoryBadge = tabElement.querySelector('.tab-category');
          if (categoryBadge) {
            const oldCategory = this.categories.find(c => c.id === oldCategoryId);
            if (oldCategory) {
              const iconSpan = categoryBadge.querySelector('span:first-child');
              const nameSpan = categoryBadge.querySelector('span:last-child');
              if (iconSpan && nameSpan) {
                iconSpan.textContent = oldCategory.icon;
                nameSpan.textContent = oldCategory.name;
              }
            }
          }
        }
        
        this.showToast('error', '❌', error.message);
      }
    }
    this.closeCategoryQuickEdit();
  }

  closeCategoryQuickEdit() {
    const popover = this.activeQuickEditPopover;
    if (popover) {
      this.activeQuickEditPopover = null;
      popover.classList.remove('show');
      setTimeout(() => popover.remove(), 350);
    }
  }
}

// Page ready initialization - moved from beginning for proper order
if (document.readyState === 'loading') {
  // DOMContentLoaded listener already set above
} else {
  // DOM already loaded
  setTimeout(() => {
    window.optionsManager = new OptionsManager();
    setTimeout(() => {
      animateElements();
    }, 100);
  }, 50);
}

// Handle unload to cleanup
window.addEventListener('beforeunload', () => {
  // Cleanup if needed
});

// Icon data for the picker
const ICON_DATA = {
  recent: [],
  objects: [
    { icon: '📁', keywords: ['folder', 'dossier', 'carpeta', 'cartella'] },
    { icon: '📂', keywords: ['open folder', 'dossier ouvert', 'carpeta abierta', 'cartella aperta'] },
    { icon: '📄', keywords: ['document', 'page', 'file', 'documento', 'fichier', 'archivo'] },
    { icon: '📊', keywords: ['chart', 'graph', 'analytics', 'graphique', 'análisis', 'grafico'] },
    { icon: '📈', keywords: ['trending up', 'growth', 'croissance', 'crecimiento', 'crescita'] },
    { icon: '📉', keywords: ['trending down', 'decline', 'déclin', 'declive', 'declino'] },
    { icon: '📋', keywords: ['clipboard', 'presse-papiers', 'portapapeles', 'appunti'] },
    { icon: '📌', keywords: ['pin', 'pushpin', 'épingle', 'chincheta', 'puntina'] },
    { icon: '📍', keywords: ['location', 'pin', 'lieu', 'ubicación', 'posizione'] },
    { icon: '🗂️', keywords: ['folder dividers', 'separateurs', 'separadores', 'divisori'] },
    { icon: '🗃️', keywords: ['file cabinet', 'classeur', 'archivador', 'schedario'] },
    { icon: '🗄️', keywords: ['file cabinet', 'meuble classeur', 'archivero', 'armadietto'] },
    { icon: '📦', keywords: ['box', 'package', 'boîte', 'caja', 'scatola'] },
    { icon: '📮', keywords: ['postbox', 'mail', 'boîte lettres', 'buzón', 'cassetta postale'] },
    { icon: '📭', keywords: ['mailbox', 'empty', 'boîte vide', 'buzón vacío', 'cassetta vuota'] },
    { icon: '📬', keywords: ['mailbox', 'mail', 'courrier', 'correo', 'posta'] },
    { icon: '📪', keywords: ['mailbox', 'closed', 'fermée', 'cerrado', 'chiusa'] },
    { icon: '📫', keywords: ['mailbox', 'flag up', 'drapeau levé', 'bandera arriba', 'bandiera alzata'] },
    { icon: '🗳️', keywords: ['ballot', 'vote', 'scrutin', 'votación', 'voto'] },
    { icon: '📝', keywords: ['memo', 'note', 'writing', 'écriture', 'escritura', 'scrittura'] },
    { icon: '✂️', keywords: ['scissors', 'cut', 'ciseaux', 'tijeras', 'forbici'] },
    { icon: '📐', keywords: ['ruler', 'triangle', 'règle', 'regla', 'righello'] },
    { icon: '📏', keywords: ['ruler', 'straight', 'règle droite', 'regla recta', 'righello dritto'] },
    { icon: '📎', keywords: ['paperclip', 'clip', 'trombone', 'clip papel', 'graffetta'] },
    { icon: '🖇️', keywords: ['paperclips', 'linked', 'trombones liés', 'clips unidos', 'graffette collegate'] },
    { icon: '📙', keywords: ['orange book', 'livre orange', 'libro naranja', 'libro arancione'] },
    { icon: '📗', keywords: ['green book', 'livre vert', 'libro verde', 'libro verde'] },
    { icon: '📘', keywords: ['blue book', 'livre bleu', 'libro azul', 'libro blu'] },
    { icon: '📓', keywords: ['notebook', 'carnet', 'cuaderno', 'quaderno'] },
    { icon: '📔', keywords: ['notebook', 'decorative', 'carnet décoratif', 'cuaderno decorativo', 'quaderno decorativo'] },
    { icon: '📒', keywords: ['ledger', 'grand livre', 'libro mayor', 'registro'] },
    { icon: '📚', keywords: ['books', 'library', 'livres', 'libros', 'libri'] },
    { icon: '🔖', keywords: ['bookmark', 'signet', 'marcador', 'segnalibro'] },
    { icon: '🧷', keywords: ['safety pin', 'épingle sûreté', 'imperdible', 'spilla sicurezza'] },
    { icon: '🔗', keywords: ['link', 'chain', 'lien', 'enlace', 'collegamento'] }
  ],
  symbols: [
    { icon: '⭐', keywords: ['star', 'favorite', 'étoile', 'estrella', 'stella'] },
    { icon: '🌟', keywords: ['glowing star', 'étoile brillante', 'estrella brillante', 'stella brillante'] },
    { icon: '✨', keywords: ['sparkles', 'magic', 'étincelles', 'chispas', 'scintille'] },
    { icon: '💫', keywords: ['dizzy', 'comet', 'vertige', 'mareo', 'vertigini'] },
    { icon: '🔥', keywords: ['fire', 'hot', 'feu', 'fuego', 'fuoco'] },
    { icon: '💎', keywords: ['diamond', 'gem', 'diamant', 'diamante', 'diamante'] },
    { icon: '🏆', keywords: ['trophy', 'award', 'trophée', 'trofeo', 'trofeo'] },
    { icon: '🎯', keywords: ['target', 'bullseye', 'cible', 'objetivo', 'bersaglio'] },
    { icon: '🎪', keywords: ['circus', 'tent', 'cirque', 'circo', 'circo'] },
    { icon: '🎨', keywords: ['art', 'palette', 'artist', 'artiste', 'artista', 'artista'] },
    { icon: '🎭', keywords: ['theater', 'drama', 'théâtre', 'teatro', 'teatro'] },
    { icon: '⚡', keywords: ['lightning', 'electric', 'foudre', 'rayo', 'fulmine'] },
    { icon: '☀️', keywords: ['sun', 'sunny', 'soleil', 'sol', 'sole'] },
    { icon: '🌙', keywords: ['moon', 'night', 'lune', 'luna', 'luna'] },
    { icon: '🌈', keywords: ['rainbow', 'arc-en-ciel', 'arcoíris', 'arcobaleno'] },
    { icon: '🔔', keywords: ['bell', 'notification', 'cloche', 'campana', 'campana'] },
    { icon: '🔕', keywords: ['no bell', 'mute', 'silencieux', 'silencio', 'silenzioso'] },
    { icon: '🔊', keywords: ['speaker', 'volume', 'haut-parleur', 'altavoz', 'altoparlante'] },
    { icon: '🔇', keywords: ['muted', 'silent', 'muet', 'silenciado', 'silenziato'] },
    { icon: '📢', keywords: ['megaphone', 'announcement', 'mégaphone', 'megáfono', 'megafono'] },
    { icon: '📣', keywords: ['cheering', 'megaphone', 'encouragement', 'ánimo', 'incoraggiamento'] },
    { icon: '📯', keywords: ['horn', 'postal', 'cor', 'cuerno', 'corno'] },
    { icon: '🎵', keywords: ['music note', 'note musique', 'nota musical', 'nota musicale'] },
    { icon: '🎶', keywords: ['musical notes', 'notes musique', 'notas musicales', 'note musicali'] },
    { icon: '🎼', keywords: ['musical score', 'partition', 'partitura', 'partitura'] },
    { icon: '🎹', keywords: ['piano', 'keyboard', 'clavier', 'teclado', 'tastiera'] },
    { icon: '🥁', keywords: ['drum', 'tambour', 'tambor', 'tamburo'] },
    { icon: '🎺', keywords: ['trumpet', 'trompette', 'trompeta', 'tromba'] },
    { icon: '🎸', keywords: ['guitar', 'guitare', 'guitarra', 'chitarra'] },
    { icon: '🎻', keywords: ['violin', 'violon', 'violín', 'violino'] },
    { icon: '🎷', keywords: ['saxophone', 'sax', 'saxofón', 'sassofono'] },
    { icon: '🎤', keywords: ['microphone', 'mic', 'micro', 'micrófono', 'microfono'] },
    { icon: '🎧', keywords: ['headphones', 'casque', 'auriculares', 'cuffie'] },
    { icon: '📻', keywords: ['radio', 'broadcast', 'diffusion', 'transmisión', 'trasmissione'] }
  ],
  activities: [
    { icon: '💼', keywords: ['briefcase', 'business', 'work', 'mallette', 'maletín', 'valigetta', 'travail', 'trabajo', 'lavoro'] },
    { icon: '👔', keywords: ['necktie', 'business', 'cravate', 'corbata', 'cravatta'] },
    { icon: '🎯', keywords: ['target', 'goal', 'cible', 'objetivo', 'bersaglio'] },
    { icon: '📊', keywords: ['chart', 'statistics', 'graphique', 'gráfico', 'grafico'] },
    { icon: '💻', keywords: ['laptop', 'computer', 'ordinateur', 'computadora', 'computer'] },
    { icon: '⌨️', keywords: ['keyboard', 'clavier', 'teclado', 'tastiera'] },
    { icon: '🖱️', keywords: ['mouse', 'souris', 'ratón', 'mouse'] },
    { icon: '🖥️', keywords: ['desktop', 'monitor', 'ordinateur bureau', 'computadora escritorio', 'computer desktop'] },
    { icon: '💾', keywords: ['floppy disk', 'save', 'disquette', 'disquete', 'dischetto'] },
    { icon: '💿', keywords: ['optical disk', 'cd', 'disque optique', 'disco óptico', 'disco ottico'] },
    { icon: '📀', keywords: ['dvd', 'disk', 'disque', 'disco', 'disco'] },
    { icon: '💽', keywords: ['minidisc', 'mini disque', 'minidisco', 'minidisco'] },
    { icon: '⚙️', keywords: ['gear', 'settings', 'engrenage', 'configuración', 'impostazioni'] },
    { icon: '🔧', keywords: ['wrench', 'tool', 'clé', 'llave', 'chiave'] },
    { icon: '🔨', keywords: ['hammer', 'marteau', 'martillo', 'martello'] },
    { icon: '⚒️', keywords: ['hammer pick', 'tools', 'outils', 'herramientas', 'strumenti'] },
    { icon: '🛠️', keywords: ['tools', 'repair', 'outils', 'herramientas', 'strumenti'] },
    { icon: '⛏️', keywords: ['pick', 'mining', 'pioche', 'pico', 'piccone'] },
    { icon: '🔩', keywords: ['nut bolt', 'écrou boulon', 'tuerca perno', 'dado bullone'] },
    { icon: '⚡', keywords: ['lightning', 'power', 'foudre', 'rayo', 'fulmine'] },
    { icon: '🔌', keywords: ['plug', 'electric', 'prise', 'enchufe', 'spina'] },
    { icon: '💡', keywords: ['bulb', 'idea', 'ampoule', 'bombilla', 'lampadina'] },
    { icon: '🔦', keywords: ['flashlight', 'torch', 'lampe torche', 'linterna', 'torcia'] },
    { icon: '🕯️', keywords: ['candle', 'bougie', 'vela', 'candela'] },
    { icon: '🧮', keywords: ['abacus', 'calculate', 'boulier', 'ábaco', 'abaco'] },
    { icon: '📐', keywords: ['ruler', 'triangle', 'règle', 'regla', 'righello'] },
    { icon: '📏', keywords: ['ruler', 'straight', 'règle droite', 'regla recta', 'righello dritto'] },
    { icon: '✏️', keywords: ['pencil', 'crayon', 'lápiz', 'matita'] },
    { icon: '✒️', keywords: ['pen', 'black nib', 'plume noire', 'pluma negra', 'penna nera'] },
    { icon: '🖊️', keywords: ['pen', 'stylo', 'bolígrafo', 'penna'] },
    { icon: '🖋️', keywords: ['fountain pen', 'stylo plume', 'pluma estilográfica', 'penna stilografica'] },
    { icon: '📝', keywords: ['memo', 'note', 'mémo', 'nota', 'promemoria'] },
    { icon: '📋', keywords: ['clipboard', 'presse-papiers', 'portapapeles', 'appunti'] },
    { icon: '📊', keywords: ['chart', 'graph', 'graphique', 'gráfico', 'grafico'] },
    { icon: '📈', keywords: ['trending up', 'growth', 'croissance', 'crecimiento', 'crescita'] }
  ],
  nature: [
    { icon: '🌱', keywords: ['seedling', 'plant', 'pousse', 'plántula', 'piantina'] },
    { icon: '🌿', keywords: ['herb', 'leaf', 'herbe', 'hierba', 'erba'] },
    { icon: '🍀', keywords: ['clover', 'luck', 'trèfle', 'trébol', 'trifoglio'] },
    { icon: '🌾', keywords: ['wheat', 'grain', 'blé', 'trigo', 'grano'] },
    { icon: '🌳', keywords: ['tree', 'arbre', 'árbol', 'albero'] },
    { icon: '🌲', keywords: ['evergreen', 'conifer', 'conifère', 'conífera', 'conifera'] },
    { icon: '🌴', keywords: ['palm tree', 'palmier', 'palmera', 'palma'] },
    { icon: '🌵', keywords: ['cactus', 'desert', 'désert', 'desierto', 'deserto'] },
    { icon: '🌷', keywords: ['tulip', 'flower', 'tulipe', 'tulipán', 'tulipano'] },
    { icon: '🌸', keywords: ['cherry blossom', 'spring', 'cerisier', 'cerezo', 'ciliegio'] },
    { icon: '🌺', keywords: ['hibiscus', 'tropical', 'hibiscus', 'hibisco', 'ibisco'] },
    { icon: '🌻', keywords: ['sunflower', 'yellow', 'tournesol', 'girasol', 'girasole'] },
    { icon: '🌹', keywords: ['rose', 'love', 'amour', 'amor', 'amore'] },
    { icon: '🥀', keywords: ['wilted flower', 'sad', 'fleur fanée', 'flor marchita', 'fiore appassito'] },
    { icon: '🌼', keywords: ['daisy', 'flower', 'pâquerette', 'margarita', 'margherita'] },
    { icon: '☘️', keywords: ['shamrock', 'ireland', 'trèfle', 'trébol', 'trifoglio'] },
    { icon: '🍁', keywords: ['maple leaf', 'autumn', 'érable', 'arce', 'acero'] },
    { icon: '🍂', keywords: ['fallen leaves', 'autumn', 'feuilles mortes', 'hojas caídas', 'foglie cadute'] },
    { icon: '🍃', keywords: ['leaf wind', 'nature', 'feuille vent', 'hoja viento', 'foglia vento'] },
    { icon: '🌊', keywords: ['wave', 'ocean', 'vague', 'ola', 'onda'] },
    { icon: '🏔️', keywords: ['mountain', 'snow', 'montagne', 'montaña', 'montagna'] },
    { icon: '⛰️', keywords: ['mountain', 'peak', 'montagne', 'montaña', 'montagna'] },
    { icon: '🌋', keywords: ['volcano', 'volcan', 'volcán', 'vulcano'] },
    { icon: '🗻', keywords: ['mount fuji', 'mountain', 'mont fuji', 'monte fuji', 'monte fuji'] },
    { icon: '🏕️', keywords: ['camping', 'tent', 'campement', 'campamento', 'campeggio'] },
    { icon: '🏞️', keywords: ['park', 'nature', 'parc', 'parque', 'parco'] },
    { icon: '🏜️', keywords: ['desert', 'dry', 'désert', 'desierto', 'deserto'] },
    { icon: '🏝️', keywords: ['island', 'tropical', 'île', 'isla', 'isola'] },
    { icon: '🏖️', keywords: ['beach', 'sand', 'plage', 'playa', 'spiaggia'] },
    { icon: '⛱️', keywords: ['umbrella beach', 'parasol', 'sombrilla', 'ombrellone'] },
    { icon: '🌤️', keywords: ['sun cloud', 'partly cloudy', 'soleil nuage', 'sol nube', 'sole nuvola'] },
    { icon: '⛅', keywords: ['cloud', 'partly cloudy', 'nuage', 'nube', 'nuvola'] }
  ],
  food: [
    { icon: '🍎', keywords: ['apple', 'red', 'pomme', 'manzana', 'mela'] },
    { icon: '🍊', keywords: ['orange', 'citrus', 'agrume', 'cítrico', 'agrume'] },
    { icon: '🍋', keywords: ['lemon', 'yellow', 'citron', 'limón', 'limone'] },
    { icon: '🍌', keywords: ['banana', 'yellow', 'banane', 'plátano', 'banana'] },
    { icon: '🍉', keywords: ['watermelon', 'summer', 'pastèque', 'sandía', 'anguria'] },
    { icon: '🍇', keywords: ['grapes', 'wine', 'raisins', 'uvas', 'uva'] },
    { icon: '🍓', keywords: ['strawberry', 'red', 'fraise', 'fresa', 'fragola'] },
    { icon: '🫐', keywords: ['blueberry', 'blue', 'myrtille', 'arándano', 'mirtillo'] },
    { icon: '🍈', keywords: ['melon', 'cantaloupe', 'melon', 'melón', 'melone'] },
    { icon: '🍒', keywords: ['cherry', 'red', 'cerise', 'cereza', 'ciliegia'] },
    { icon: '🍑', keywords: ['peach', 'orange', 'pêche', 'durazno', 'pesca'] },
    { icon: '🥭', keywords: ['mango', 'tropical', 'mangue', 'mango', 'mango'] },
    { icon: '🍍', keywords: ['pineapple', 'tropical', 'ananas', 'piña', 'ananas'] },
    { icon: '🥥', keywords: ['coconut', 'tropical', 'noix coco', 'coco', 'cocco'] },
    { icon: '🥝', keywords: ['kiwi', 'green', 'kiwi', 'kiwi', 'kiwi'] },
    { icon: '🍅', keywords: ['tomato', 'red', 'tomate', 'tomate', 'pomodoro'] },
    { icon: '🍆', keywords: ['eggplant', 'purple', 'aubergine', 'berenjena', 'melanzana'] },
    { icon: '🥑', keywords: ['avocado', 'green', 'avocat', 'aguacate', 'avocado'] },
    { icon: '🥦', keywords: ['broccoli', 'green', 'brocoli', 'brócoli', 'broccolo'] },
    { icon: '🥬', keywords: ['leafy greens', 'lettuce', 'légumes verts', 'verduras', 'verdure'] },
    { icon: '🥒', keywords: ['cucumber', 'green', 'concombre', 'pepino', 'cetriolo'] },
    { icon: '🌶️', keywords: ['pepper', 'hot', 'piment', 'chile', 'peperoncino'] },
    { icon: '🫑', keywords: ['bell pepper', 'poivron', 'pimiento', 'peperone'] },
    { icon: '🌽', keywords: ['corn', 'yellow', 'maïs', 'maíz', 'mais'] },
    { icon: '🥕', keywords: ['carrot', 'orange', 'carotte', 'zanahoria', 'carota'] },
    { icon: '🫒', keywords: ['olive', 'green', 'olive', 'aceituna', 'oliva'] },
    { icon: '🧄', keywords: ['garlic', 'white', 'ail', 'ajo', 'aglio'] },
    { icon: '🧅', keywords: ['onion', 'oignon', 'cebolla', 'cipolla'] },
    { icon: '🥔', keywords: ['potato', 'pomme terre', 'papa', 'patata'] },
    { icon: '🍠', keywords: ['sweet potato', 'patate douce', 'batata', 'patata dolce'] },
    { icon: '🥐', keywords: ['croissant', 'french', 'français', 'francés', 'francese'] },
    { icon: '🥖', keywords: ['baguette', 'bread', 'pain', 'pan', 'pane'] },
    { icon: '🍞', keywords: ['bread', 'loaf', 'pain', 'pan', 'pane'] },
    { icon: '🥨', keywords: ['pretzel', 'bretzel', 'pretzel', 'pretzel'] },
    { icon: '🥯', keywords: ['bagel', 'bagel', 'bagel', 'bagel'] },
    { icon: '🧀', keywords: ['cheese', 'fromage', 'queso', 'formaggio'] }
  ]
};

// Initialize icon picker functionality
OptionsManager.prototype.initIconData = function() {
  // Load recent icons from storage
  const recentIcons = JSON.parse(localStorage.getItem('recentIcons') || '[]');
  ICON_DATA.recent = recentIcons.slice(0, 16).map(icon => ({ icon, keywords: [] }));
};

OptionsManager.prototype.openIconPicker = function() {
  this.initIconData();
  this.elements.iconPickerOverlay.style.display = 'flex'; // Ensure it is display:flex before adding show
  this.elements.iconSelectorBtn.classList.add('active');
  
  requestAnimationFrame(() => {
    this.elements.iconPickerOverlay.classList.add('show');
  });
  
  // Show recent icons by default
  this.switchIconCategory('objects');
  
  // Focus search input
  setTimeout(() => {
    this.elements.iconSearchInput?.focus();
  }, 200);
};

OptionsManager.prototype.closeIconPicker = function() {
  this.elements.iconSelectorBtn.classList.remove('active');
  this.hideOverlay(this.elements.iconPickerOverlay);
};

OptionsManager.prototype.switchIconCategory = function(category) {
  // Update active category button
  document.querySelectorAll('.icon-category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
  
  // Clear search
  if (this.elements.iconSearchInput) {
    this.elements.iconSearchInput.value = '';
  }
  
  // Render icons for the selected category
  this.renderIconGrid(ICON_DATA[category] || [], category);
};

OptionsManager.prototype.searchIcons = function(query) {
  if (!query.trim()) {
    // If search is empty, show current category
    const activeCategory = document.querySelector('.icon-category-btn.active')?.dataset.category || 'recent';
    this.renderIconGrid(ICON_DATA[activeCategory] || [], activeCategory);
    return;
  }
  
  // Normalize query for better matching
  const normalizedQuery = query.toLowerCase().trim();
  
  // Search through all categories
  const allIconsData = [
    ...ICON_DATA.objects,
    ...ICON_DATA.symbols,
    ...ICON_DATA.activities,
    ...ICON_DATA.nature,
    ...ICON_DATA.food
  ];
  
  // Filter icons based on keywords
  const filteredIcons = allIconsData.filter(iconData => {
    // Check if query matches any keyword
    return iconData.keywords.some(keyword => 
      keyword.toLowerCase().includes(normalizedQuery)
    );
  });
  
  // Render filtered results
  this.renderIconGrid(filteredIcons, 'search');
};

OptionsManager.prototype.renderIconGrid = function(iconsData, category) {
  if (!this.elements.iconGrid) return;
  
  if (iconsData.length === 0) {
    // Clear existing content safely
    while (this.elements.iconGrid.firstChild) {
      this.elements.iconGrid.removeChild(this.elements.iconGrid.firstChild);
    }
    
    // Create empty state container
    const emptyContainer = document.createElement('div');
    emptyContainer.className = 'icon-grid empty';
    
    const emptyText = document.createElement('div');
    emptyText.className = 'icon-empty-text';
    emptyText.textContent = category === 'recent' ? 
            (browser.i18n.getMessage('noRecentIcons') || 'No recent icons') : 
            category === 'search' ?
            (browser.i18n.getMessage('noIconsFound') || 'No icons found') :
      (browser.i18n.getMessage('noIconsFound') || 'No icons found');
    
    emptyContainer.appendChild(emptyText);
    this.elements.iconGrid.appendChild(emptyContainer);
    return;
  }
  
  // Clear existing content safely
  while (this.elements.iconGrid.firstChild) {
    this.elements.iconGrid.removeChild(this.elements.iconGrid.firstChild);
  }
  
  iconsData.forEach(iconData => {
    const icon = iconData.icon || iconData; // Support both formats
    const iconElement = document.createElement('button');
    iconElement.className = 'icon-item';
    iconElement.textContent = icon;
    iconElement.type = 'button';
    iconElement.addEventListener('click', () => this.selectIcon(icon));
    
    // Mark recent icons
    if (category !== 'recent' && ICON_DATA.recent.some(recentData => (recentData.icon || recentData) === icon)) {
      iconElement.classList.add('recent');
    }
    
    this.elements.iconGrid.appendChild(iconElement);
  });
};

OptionsManager.prototype.selectIcon = function(icon) {
  // Update the selected icon display
  if (this.elements.selectedIcon) {
    this.elements.selectedIcon.textContent = icon;
  }
  
  // Add to recent icons
  this.addToRecentIcons(icon);
  
  // Close the picker
  this.closeIconPicker();
  
  // Visual feedback
  this.elements.iconSelectorBtn.style.transform = 'scale(1.05)';
  setTimeout(() => {
    this.elements.iconSelectorBtn.style.transform = '';
  }, 150);
};

OptionsManager.prototype.addToRecentIcons = function(icon) {
  let recentIcons = JSON.parse(localStorage.getItem('recentIcons') || '[]');
  
  // Remove if already exists
  recentIcons = recentIcons.filter(i => i !== icon);
  
  // Add to beginning
  recentIcons.unshift(icon);
  
  // Limit to 16 icons
  recentIcons = recentIcons.slice(0, 16);
  
  // Save to localStorage
  localStorage.setItem('recentIcons', JSON.stringify(recentIcons));
  
  // Update in memory
  ICON_DATA.recent = recentIcons.map(icon => ({ icon, keywords: [] }));
};

OptionsManager.prototype.getSelectedIcon = function() {
  return this.elements.selectedIcon?.textContent || '📁';
};
