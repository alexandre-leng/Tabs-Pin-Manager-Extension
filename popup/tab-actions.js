/**
 * Popup actions: open, close and pin tabs.
 * Mixed into PopupManager.prototype; loaded after the class definition.
 */

'use strict';

Object.assign(PopupManager.prototype, {
  async openAllTabs() {
    if (this.isOpeningTabs) return;
    
    this.isOpeningTabs = true;
    this.showButtonLoading(true);
    
    try {
      this.showToast('info', '🔍', browser.i18n.getMessage('checkingExistingTabs') || 'Checking existing tabs...');
      
      // Get current window ID to ensure tabs are checked/opened in the correct window
      const currentWindow = await browser.windows.getCurrent();
      
      // Send message to background script with current window ID using retry mechanism
      const response = await this.sendMessageWithRetry({
        action: 'openAllTabs',
        windowId: currentWindow.id
      });
      
      if (response.success) {
        // The background script already persisted lastOpened; writing this possibly
        // stale settings copy to storage would overwrite newer settings
        this.settings.lastOpened = new Date().toISOString();
        this.updateStatusInfo();
        
        // Handle different response scenarios with better logic
        if (response.allAlreadyOpen || (response.opened === 0 && response.skipped > 0 && (!response.pinned || response.pinned === 0))) {
          // All tabs are already open and pinned - consistent behavior
          this.showToast('info', 'ℹ️', browser.i18n.getMessage('allTabsAlreadyOpen') || 'All tabs are already open and pinned');
        } else if (response.pinned > 0 && response.opened > 0) {
          // Some tabs were pinned, some opened
          const message = browser.i18n.getMessage('someTabsPinnedAndOpened', [
            response.pinned.toString(),
            response.opened.toString()
          ]) || `${response.pinned} tab(s) pinned, ${response.opened} new tab(s) created`;
          this.showToast('success', '✅', message);
          this.showButtonSuccess();
        } else if (response.pinned > 0) {
          // Only tabs were pinned (no new tabs opened)
          const message = browser.i18n.getMessage('tabsPinned', [response.pinned.toString()]) || `${response.pinned} tab(s) were pinned`;
          this.showToast('success', '📌', message);
          this.showButtonSuccess();
        } else if (response.skipped > 0 && response.opened > 0) {
          // Some tabs were skipped, some opened
          const message = browser.i18n.getMessage('someTabsAlreadyOpen', [
            response.skipped.toString(),
            response.opened.toString()
          ]) || `${response.skipped} tab(s) already open, ${response.opened} new tab(s) created`;
          this.showToast('success', '✅', message);
          // Show success animation only if some tabs were actually opened
          this.showButtonSuccess();
        } else if (response.opened > 0) {
          // All tabs were opened successfully
          this.showToast('success', '✅', browser.i18n.getMessage('tabsOpened') || 'Tabs opened successfully!');
          // Show success animation
          this.showButtonSuccess();
        } else {
          // Fallback case - no tabs opened for unknown reason
          this.showToast('info', 'ℹ️', browser.i18n.getMessage('allTabsAlreadyOpen') || 'All tabs are already open and pinned');
        }
      } else {
        // Background script returned an error
        if (response.error === 'No tabs configured') {
          // This is expected when no tabs are configured, don't show as error
          return;
        }
        throw new Error(response.error || browser.i18n.getMessage('failedToOpenTabs'));
      }
    } catch (error) {
      console.error('Error opening tabs:', error);
      // Only show toast error for real errors, not when no tabs configured
      if (!error.message.includes('No tabs configured')) {
        this.showToast('error', '❌', browser.i18n.getMessage('errorOpeningTabs') || 'Error opening tabs');
      }
    } finally {
      this.isOpeningTabs = false;
      // Hide loading animation after a delay
      setTimeout(() => this.showButtonLoading(false), 1000);
    }
  },

  showButtonLoading(show) {
    const btnContent = document.querySelector('.btn-content');
    const btnLoading = document.querySelector('.btn-loading');
    
    if (btnContent && btnLoading) {
      if (show) {
        btnContent.style.opacity = '0';
        btnLoading.style.display = 'flex';
        setTimeout(() => {
          btnLoading.style.opacity = '1';
        }, 10);
      } else {
        btnLoading.style.opacity = '0';
      setTimeout(() => {
          btnLoading.style.display = 'none';
          btnContent.style.opacity = '1';
        }, 200);
      }
    }
  },

  showButtonSuccess() {
    const openAllBtn = this.elements.openAllBtn;
    if (openAllBtn) {
      openAllBtn.style.transform = 'scale(1.05)';
      openAllBtn.style.background = 'linear-gradient(135deg, var(--success-color) 0%, #00a82d 100%)';
      
      setTimeout(() => {
        openAllBtn.style.transform = '';
        openAllBtn.style.background = '';
      }, 500);
    }
  },

  async openCategoryTabs(categoryId) {
    if (this.isOpeningTabs) return;
    
    const categoryTabs = this.tabs.filter(tab => tab.category === categoryId);
    if (categoryTabs.length === 0) return;
    
    this.isOpeningTabs = true;
    
    try {
      this.showToast('info', '🔍', browser.i18n.getMessage('checkingExistingTabs') || 'Checking existing tabs...');
      
      // Get current window ID to ensure tabs are checked/opened in the correct window
      const currentWindow = await browser.windows.getCurrent();
      
      const response = await this.sendMessageWithRetry({
        action: 'openCategoryTabs',
        categoryId: categoryId,
        windowId: currentWindow.id
      });
      
      if (response.success) {
        // Handle different response scenarios with better logic
        if (response.allAlreadyOpen || (response.opened === 0 && response.skipped > 0 && (!response.pinned || response.pinned === 0))) {
          // All tabs are already open and pinned - consistent behavior
          this.showToast('info', 'ℹ️', browser.i18n.getMessage('allTabsAlreadyOpen') || 'All tabs are already open and pinned');
        } else if (response.pinned > 0 && response.opened > 0) {
          // Some tabs were pinned, some opened
          const message = browser.i18n.getMessage('someTabsPinnedAndOpened', [
            response.pinned.toString(),
            response.opened.toString()
          ]) || `${response.pinned} tab(s) pinned, ${response.opened} new tab(s) created`;
          this.showToast('success', '✅', message);
        } else if (response.pinned > 0) {
          // Only tabs were pinned (no new tabs opened)
          const message = browser.i18n.getMessage('tabsPinned', [response.pinned.toString()]) || `${response.pinned} tab(s) were pinned`;
          this.showToast('success', '📌', message);
        } else if (response.skipped > 0 && response.opened > 0) {
          // Some tabs were skipped, some opened
          const message = browser.i18n.getMessage('someTabsAlreadyOpen', [
            response.skipped.toString(),
            response.opened.toString()
          ]) || `${response.skipped} tab(s) already open, ${response.opened} new tab(s) created`;
          this.showToast('success', '✅', message);
          // Show success animation only if some tabs were actually opened
          this.showButtonSuccess();
        } else if (response.opened > 0) {
          // All tabs were opened successfully
          const openedCount = response.opened;
          this.showToast('success', '✅', browser.i18n.getMessage('tabsOpenedCount', [openedCount.toString()]) || `Opened ${openedCount} tabs`);
        } else {
          // Fallback case - no tabs opened for unknown reason
          this.showToast('info', 'ℹ️', browser.i18n.getMessage('allTabsAlreadyOpen') || 'All tabs are already open and pinned');
        }
      } else {
        // Background script returned an error
        throw new Error(response.error || browser.i18n.getMessage('failedToOpenCategoryTabs'));
      }
    } catch (error) {
      console.error('Error opening category tabs:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('errorOpeningCategoryTabs') || 'Error opening category tabs');
    } finally {
      this.isOpeningTabs = false;
    }
  },

  async closeCategoryTabs(categoryId, categoryName, count) {
    if (this.isOpeningTabs) return;

    const confirmMessage = browser.i18n.getMessage('closeCategoryConfirm', [
      categoryName,
      count.toString()
    ]) || `Close pinned tabs from "${categoryName}" in this window?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    this.isOpeningTabs = true;

    try {
      const currentWindow = await browser.windows.getCurrent();

      const response = await this.sendMessageWithRetry({
        action: 'closeCategoryTabs',
        categoryId: categoryId,
        windowId: currentWindow.id
      });

      if (response.success) {
        if (response.closed > 0) {
          const message = browser.i18n.getMessage('categoryPinnedTabsClosed', [
            response.closed.toString(),
            categoryName
          ]) || `Closed ${response.closed} pinned tab(s) from ${categoryName}`;
          this.showToast('success', '✅', message);
        } else {
          const message = browser.i18n.getMessage('noOpenCategoryPinnedTabs', [categoryName]) ||
            `No open pinned tabs found for ${categoryName}`;
          this.showToast('info', 'ℹ️', message);
        }
      } else {
        throw new Error(response.error || browser.i18n.getMessage('errorClosingCategoryTabs'));
      }
    } catch (error) {
      console.error('Error closing category tabs:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('errorClosingCategoryTabs') || 'Error closing category tabs');
    } finally {
      this.isOpeningTabs = false;
    }
  },

  async pinCurrentTab() {
    if (!this.currentTab || !this.isValidUrl(this.currentTab.url)) {
      this.showToast('warning', '⚠️', browser.i18n.getMessage('cannotPinTab') || 'Cannot pin this tab');
      return;
    }
    
    if (this.isTabAlreadyPinned(this.currentTab.url)) {
      this.showToast('warning', '⚠️', browser.i18n.getMessage('tabAlreadyPinned') || 'Tab is already pinned');
      return;
    }
    
    // Open category selection modal
    this.showCategorySelectionModal();
  },

  async pinCurrentTabInCategory(categoryId) {
    if (!this.currentTab) {
      return;
    }
    
    try {
      const newTab = {
        url: this.currentTab.url,
        title: this.currentTab.title || this.extractDomainFromUrl(this.currentTab.url),
        category: categoryId,
        enabled: true,
        dateAdded: new Date().toISOString()
      };
      
      // Use background script to save tab instead of direct storage
      const response = await browser.runtime.sendMessage({
        action: 'saveTab',
        tab: newTab
      });
      
      if (response && response.success) {
        
        // Update local data
        this.tabs = response.tab ? [...this.tabs.filter(t => t.id !== response.tab.id), response.tab] : this.tabs;
        
        // Close modal
        this.closeCategorySelectionModal();
        
        // Show success message with category name
        const category = this.categories.find(c => c.id === categoryId);
        const categoryName = category ? category.name : 'Unknown';
        const successMessage = browser.i18n.getMessage('tabPinnedInCategory', [newTab.title, categoryName]) || 
                              `Pinned "${newTab.title}" in ${categoryName}`;
        
        this.showToast('success', '📌', successMessage);
        
        // Refresh the interface after a short delay
        setTimeout(() => {
          this.loadData().then(() => this.render());
        }, 500);
        
      } else {
        throw new Error(response?.error || 'Background script failed to save tab');
      }
      
    } catch (error) {
      console.error('💥 Error pinning tab:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('failedToPinTab') || 'Failed to pin tab');
    }
  }
});
