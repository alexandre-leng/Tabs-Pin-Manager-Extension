/**
 * Category selection modal used when pinning the current tab.
 * Methods mixed into PopupManager (see popup.js).
 */

import { browser } from '../lib/browser-api.js';
import { UiUtils } from '../lib/ui-utils.js';
import { sortCategoriesForSelection } from './category-order.js';

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
    
    UiUtils.showDialog(this.elements.categorySelectionOverlay,
      this.elements.categorySelectionList.querySelector('.category-item'));
  },

  renderCategorySelectionList() {
    if (!this.elements.categorySelectionList) return;
    
    // Clear existing content safely
    while (this.elements.categorySelectionList.firstChild) {
      this.elements.categorySelectionList.removeChild(this.elements.categorySelectionList.firstChild);
    }
    
    // Same ordering as the main list
    const sortedCategories = sortCategoriesForSelection(this.categories, this.tabs);
    
    let firstEmptyAdded = false;
    
    sortedCategories.forEach((category, index) => {
      const tabCount = this.tabs.filter(tab => tab.category === category.id).length;
      const isEmpty = tabCount === 0;
      
      // The first empty category after used ones gets the separator
      const isFirstEmpty = isEmpty && !firstEmptyAdded && index > 0;
      if (isEmpty) firstEmptyAdded = true;
      
      const categoryElement = this.createCategorySelectionItem(category, isEmpty, isFirstEmpty);
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
      (browser.i18n.getMessage('tabPlural')) :
      (browser.i18n.getMessage('tabSingular'));
    
    // Create aria-label for accessibility
    const ariaLabel = `${browser.i18n.getMessage('categoryPrefix')} ${category.name}, ${browser.i18n.getMessage('containsPrefix')} ${tabCount} ${tabWord}`;
    element.setAttribute('aria-label', ariaLabel);
    
    // Add empty category classes and tooltip
    if (isEmpty) {
      element.classList.add('empty-category');
      const emptyTooltip = browser.i18n.getMessage('noCategoryTabs');
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
      UiUtils.hideDialog(this.elements.categorySelectionOverlay, 200);
    }
  }
};
