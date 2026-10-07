/**
 * Tab editing: add/edit modal, save and delete.
 * Mixed into OptionsManager.prototype; loaded after the class definition.
 */

'use strict';

Object.assign(OptionsManager.prototype, {
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
  },

  closeTabModal() {
    this.hideOverlay(this.elements.tabModalOverlay);

    this.currentEditingTab = null;
    this.elements.tabForm.reset();
  },

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
  },

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
  },

  editTab(tab) {
    this.openTabModal(tab);
  },

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
  },

  generateTabId() {
    return 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
});
