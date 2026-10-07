/**
 * Tab editing: add/edit modal, save and delete.
 * Methods mixed into OptionsManager (see options.js).
 */

import { browser } from '../lib/browser-api.js';
import { generateTabId } from '../lib/tab-utils.js';
import { UiUtils } from '../lib/ui-utils.js';
import { normalizeUrl } from '../lib/url-utils.js';

export const tabEditor = {
  openTabModal(tab = null) {
    this.currentEditingTab = tab;
    
    // Populate category dropdown FIRST, so its options are available when setting the value.
    this.populateCategoryDropdown();

    if (tab) {
      // Edit mode
      this.elements.tabModalTitle.textContent = browser.i18n.getMessage('editTab');
      this.elements.tabUrl.value = tab.url || '';
      this.elements.tabTitle.value = tab.title || '';
      this.elements.tabCategory.value = tab.category || ''; // This should now work reliably
    } else {
      // Add mode
      this.elements.tabModalTitle.textContent = browser.i18n.getMessage('addNewTab');
      this.elements.tabUrl.value = '';
      this.elements.tabTitle.value = '';
      // Ensure categories are loaded and select the first one, or empty if no categories
      this.elements.tabCategory.value = this.categories.length > 0 ? (this.categories[0]?.id || '') : '';
    }
    
    UiUtils.showDialog(this.elements.tabModalOverlay, this.elements.tabUrl);
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
      this.showToast('error', '❌', browser.i18n.getMessage('invalidUrl'));
      return;
    }
    
    const key = normalizeUrl(url);
    // Only a new address is checked: duplicates saved by older versions stay editable
    const addressChanged = !this.currentEditingTab || normalizeUrl(this.currentEditingTab.url) !== key;
    const duplicate = addressChanged &&
      this.tabs.some(tab => tab.id !== this.currentEditingTab?.id && normalizeUrl(tab.url) === key);
    if (duplicate) {
      this.showToast('error', '❌', browser.i18n.getMessage('tabAlreadyPinned'));
      return;
    }

    const tabData = {
      id: this.currentEditingTab?.id || generateTabId(),
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
          (browser.i18n.getMessage('tabsSaved')) :
          (browser.i18n.getMessage('tabsSaved'));
        
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
    const confirmMessage = browser.i18n.getMessage('deleteConfirm');
    
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
        this.showToast('success', '✅', browser.i18n.getMessage('tabDeleted'));
      } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToDeleteTab'));
      }
    } catch (error) {
      console.error('Error deleting tab:', error);
      this.showToast('error', '❌', error.message);
    }
  }
};
