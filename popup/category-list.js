/**
 * Category list of the popup: one card per category, opening or closing its tabs.
 * Methods mixed into PopupManager (see popup.js).
 */

import { browser } from '../lib/browser-api.js';
import { UiUtils } from '../lib/ui-utils.js';
import { sortCategoriesForList } from './category-order.js';

export const categoryList = {
  renderCategories() {
    if (!this.elements.categoriesList) return;
    
    // Clear existing content safely
    while (this.elements.categoriesList.firstChild) {
      this.elements.categoriesList.removeChild(this.elements.categoriesList.firstChild);
    }
    
    const groups = this.groupTabsByCategory();
    
    // Sort categories, with "Development" last by default
    const sortedCategories = sortCategoriesForList(this.categories, this.tabs);
    
    sortedCategories.forEach(category => {
      const tabsInCategory = groups[category.id] || [];
      if (tabsInCategory.length > 0) {
        const categoryElement = this.createCategoryElement(category, tabsInCategory.length);
        this.elements.categoriesList.appendChild(categoryElement);
      }
    });
  },

  groupTabsByCategory() {
    const groups = {};
    
    // Sort tabs by order before grouping
    const sortedTabs = [...this.tabs].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
    });
    
    sortedTabs.forEach(tab => {
      const categoryId = tab.category || 'uncategorized';
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(tab);
    });
    return groups;
  },

  createCategoryElement(category, count) {
    const element = document.createElement('div');
    element.className = 'category-item';
    element.dataset.categoryId = category.id;
    
    // Get translated tab word (singular/plural)
    const tabWord = count !== 1 ? 
      (browser.i18n.getMessage('tabPlural')) :
      (browser.i18n.getMessage('tabSingular'));
    
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
    countDiv.textContent = `${count} ${tabWord}`;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'category-close-btn';
    const closeLabel = browser.i18n.getMessage('closeCategoryTabsTooltip');
    const closeButtonText = browser.i18n.getMessage('closeCategoryTabs');
    closeButton.title = closeLabel;
    closeButton.setAttribute('aria-label', closeLabel);

    const closeIcon = document.createElement('span');
    closeIcon.className = 'category-close-icon';
    closeIcon.setAttribute('aria-hidden', 'true');

    const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeSvg.setAttribute('width', '14');
    closeSvg.setAttribute('height', '14');
    closeSvg.setAttribute('viewBox', '0 0 24 24');
    closeSvg.setAttribute('fill', 'currentColor');

    const closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    closePath.setAttribute('d', 'M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z');
    closeSvg.appendChild(closePath);
    closeIcon.appendChild(closeSvg);

    const closeText = document.createElement('span');
    closeText.className = 'category-close-text';
    closeText.textContent = closeButtonText;

    closeButton.appendChild(closeIcon);
    closeButton.appendChild(closeText);
    
    // Assemble the structure
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(countDiv);
    element.appendChild(iconDiv);
    element.appendChild(infoDiv);
    element.appendChild(closeButton);
    
    // Add click event with feedback
    const openCategory = async () => {
      element.style.transform = 'scale(0.98)';
      setTimeout(() => {
        element.style.transform = '';
      }, 150);

      await this.openCategoryTabs(category.id);
    };
    element.addEventListener('click', openCategory);
    // Contains the Close button, so it gets no button role (no nested controls)
    UiUtils.makeActivatable(element, openCategory, { label: category.name, role: null });

    closeButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await this.closeCategoryTabs(category.id, category.name, count);
    });
    
    // Add hover animations
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateX(4px)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = '';
    });
    
    return element;
  }
};
