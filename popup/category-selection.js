/**
 * Category selection modal used when pinning the current tab.
 * Methods mixed into PopupManager (see popup.js).
 */

import { browser } from '../lib/browser-api.js';
import { UiUtils } from '../lib/ui-utils.js';

export const categorySelection = {
  showCategorySelectionModal() {
    if (!this.currentTab || !this.elements.categorySelectionOverlay) {
      return;
    }
    
    // Populate tab preview
    if (this.elements.previewTitle) {
      const title = this.currentTab.title || this.extractDomainFromUrl(this.currentTab.url);
      this.elements.previewTitle.textContent = title;
    }
    
    if (this.elements.previewUrl) {
      this.elements.previewUrl.textContent = this.currentTab.url;
    }
    
    if (this.elements.previewFavicon) {
      const favicon = this.elements.previewFavicon;
      UiUtils.loadFavicon(favicon, UiUtils.extractDomain(this.currentTab.url), {
        onLoad: () => { favicon.style.display = 'inline-block'; },
        onFail: () => { favicon.style.display = 'none'; }
      });
    }
    
    // Populate categories list
    this.renderCategorySelectionList();
    
    // Show modal
    this.elements.categorySelectionOverlay.style.display = 'flex';
    
    setTimeout(() => {
      this.elements.categorySelectionOverlay.classList.add('show');
    }, 10);
  },

  renderCategorySelectionList() {
    if (!this.elements.categorySelectionList) return;
    
    // Clear existing content safely
    while (this.elements.categorySelectionList.firstChild) {
      this.elements.categorySelectionList.removeChild(this.elements.categorySelectionList.firstChild);
    }
    
    // Same ordering as the main list
    const sortedCategories = this.getSortedCategoriesForSelection();
    
    let firstEmptyAdded = false;
    
    sortedCategories.forEach((category) => {
      const tabCount = this.tabs.filter(tab => tab.category === category.id).length;
      const isEmpty = tabCount === 0;
      
      // Add empty class for first empty category (for separator)
      if (isEmpty && !firstEmptyAdded) {
        firstEmptyAdded = true;
      }
      
      const categoryElement = this.createCategorySelectionItem(category, isEmpty, !firstEmptyAdded && isEmpty);
      this.elements.categorySelectionList.appendChild(categoryElement);
    });
  },

  createCategorySelectionItem(category, isEmpty, isFirstEmpty) {
    const element = document.createElement('div');
    element.className = 'category-item';
    element.dataset.categoryId = category.id;
    
    // Count tabs in this category
    const tabCount = this.tabs.filter(tab => tab.category === category.id).length;
    
    // Add accessibility attributes
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');
    
    // Get translated tab word (singular/plural)
    const tabWord = tabCount !== 1 ? 
      (browser.i18n.getMessage('tabPlural') || 'tabs') :
      (browser.i18n.getMessage('tabSingular') || 'tab');
    
    // Create aria-label for accessibility
    const ariaLabel = `${browser.i18n.getMessage('categoryPrefix') || 'Category'} ${category.name}, ${browser.i18n.getMessage('containsPrefix') || 'contains'} ${tabCount} ${tabWord}`;
    element.setAttribute('aria-label', ariaLabel);
    
    // Add empty category classes and tooltip
    if (isEmpty) {
      element.classList.add('empty-category');
      const emptyTooltip = browser.i18n.getMessage('noCategoryTabs') || 'No tabs in this category';
      element.setAttribute('data-empty-tooltip', emptyTooltip);
    }
    
    if (isFirstEmpty) {
      element.classList.add('first-empty-category');
    }
    
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
    countDiv.textContent = `${tabCount} ${tabWord}`;
    
    // Assemble the structure
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(countDiv);
    element.appendChild(iconDiv);
    element.appendChild(infoDiv);
    
    // Add click event to select category
    element.addEventListener('click', () => {
      this.pinCurrentTabInCategory(category.id);
    });
    
    // Add keyboard navigation
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.pinCurrentTabInCategory(category.id);
      }
    });
    
    return element;
  },

  closeCategorySelectionModal() {
    if (this.elements.categorySelectionOverlay) {
      this.elements.categorySelectionOverlay.classList.remove('show');
      
      setTimeout(() => {
        this.elements.categorySelectionOverlay.style.display = 'none';
      }, 200);
    }
  },

  // Category order for the selection modal
  getSortedCategoriesForSelection() {
    // With no pinned tab yet, use the default order
    if (this.tabs.length === 0) {
      return this.getDefaultCategoryOrder();
    }
    
    // Otherwise, non-empty categories first, then alphabetical
    return [...this.categories].sort((a, b) => {
      const aCount = this.tabs.filter(tab => tab.category === a.id).length;
      const bCount = this.tabs.filter(tab => tab.category === b.id).length;
      
      // Non-empty categories first
      if (aCount > 0 && bCount === 0) return -1;
      if (aCount === 0 && bCount > 0) return 1;
      
      // Within same group, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }
};
