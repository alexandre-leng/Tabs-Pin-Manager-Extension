/**
 * Category editing: edit modal, reset, and the quick category switcher on tab cards.
 * Methods mixed into OptionsManager (see options.js).
 */

import { browser } from '../lib/browser-api.js';
import { UiUtils } from '../lib/ui-utils.js';
import { getDefaultCategories } from '../lib/default-categories.js';

export const categoryEditor = {
  // Category management methods
  editCategory(category) {
    this.closeCategoryQuickEdit();
    this.currentEditingCategory = category;
    
    if (this.elements.categoryModalTitle) {
      this.elements.categoryModalTitle.textContent = browser.i18n.getMessage('editCategory');
    }
    
    if (this.elements.categoryName) {
      this.elements.categoryName.value = category.name || '';
    }
    
    // Set the selected icon in the icon selector
    if (this.elements.selectedIcon) {
      this.elements.selectedIcon.textContent = category.icon || '📁';
    }
    
    if (this.elements.categoryModalOverlay) {
      UiUtils.showDialog(this.elements.categoryModalOverlay, this.elements.categoryName);
    }
  },

  closeCategoryModal() {
    this.hideOverlay(this.elements.categoryModalOverlay);
    
    this.currentEditingCategory = null;
    
    if (this.elements.categoryForm) {
      this.elements.categoryForm.reset();
    }
  },

  async saveCategory(event) {
    event.preventDefault();
    
    const name = this.elements.categoryName.value.trim();
    const icon = this.getSelectedIcon();
    
    if (!name) {
      this.showToast('error', '❌', browser.i18n.getMessage('categoryNameRequired'));
      return;
    }
    
    if (!icon) {
      this.showToast('error', '❌', browser.i18n.getMessage('categoryIconRequired'));
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
        this.showToast('success', '✅', browser.i18n.getMessage('categorySaved'));
      } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToSaveCategory'));
      }
    } catch (error) {
      console.error('Error saving category:', error);
      this.showToast('error', '❌', error.message);
    }
  },

  async resetCategories() {
    const confirmed = confirm(browser.i18n.getMessage('resetCategoriesConfirm'));
    
    if (!confirmed) return;
    
    try {
      const defaultCategories = getDefaultCategories(browser.i18n);
      
      const response = await this.sendMessageWithRetry({
        action: 'saveCategories',
        categories: defaultCategories
      });
      
      if (response && response.success) {
        this.categories = defaultCategories;
        this.render();
        this.showToast('success', '✅', browser.i18n.getMessage('categoriesReset'));
      } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToResetCategories'));
      }
    } catch (error) {
      console.error('Error resetting categories:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('failedToResetCategories'));
    }
  },

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
    
    // Measurable only once displayed (still transparent until its .show transition)
    popover.style.display = 'flex';

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
    
    popover.style.left = `${Math.max(window.scrollX, parseFloat(popover.style.left))}px`;
    popover.style.top = `${Math.max(window.scrollY, parseFloat(popover.style.top))}px`;
    requestAnimationFrame(() => {
        popover.classList.add('show');
    });
    
    this.quickEditOpener = badgeElement;
    selectElement.focus();
  },

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
          this.showToast('success', '✅', browser.i18n.getMessage('categoryChanged'));
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
  },

  closeCategoryQuickEdit() {
    const popover = this.activeQuickEditPopover;
    if (popover) {
      this.activeQuickEditPopover = null;
      popover.classList.remove('show');
      setTimeout(() => popover.remove(), 350);
    }
    // Give the focus back to the badge (when it was not re-rendered meanwhile)
    if (this.quickEditOpener?.isConnected && popover?.contains(document.activeElement)) {
      this.quickEditOpener.focus();
    }
    this.quickEditOpener = null;
  }
};
