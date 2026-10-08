/**
 * Tab cards of the options page: title, URL, favicon, actions and category badge.
 * Methods mixed into OptionsManager (see options.js).
 */

import { browser } from '../lib/browser-api.js';
import { UiUtils } from '../lib/ui-utils.js';

// SVG paths of the tab card icons (24x24 viewBox)
const TAB_CARD_ICONS = {
  drag: 'M11,18c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S11,16.9,11,18z M9,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S10.1,10,9,10z M9,4C7.9,4,7,4.9,7,6s0.9,2,2,2s2-0.9,2-2S10.1,4,9,4z M15,8c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S13.9,8,15,8z M15,10c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S16.1,10,15,10z M15,16c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S16.1,16,15,16z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  delete: 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z',
  up: 'M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z',
  down: 'M7.41,8.59L12,13.17L16.59,8.59L18,10L12,16L6,10L7.41,8.59Z'
};

export const tabCards = {
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
    dragHandle.title = browser.i18n.getMessage('dragToReorder');
    dragHandle.appendChild(this.createSvgIcon(16, TAB_CARD_ICONS.drag));

    const faviconContainer = document.createElement('div');
    faviconContainer.className = 'tab-favicon-container';
    faviconContainer.appendChild(this.createFaviconElement(tab.url, categoryIcon));

    const cardHeader = document.createElement('div');
    cardHeader.className = 'tab-card-header';
    cardHeader.append(dragHandle, faviconContainer, this.createTabInfo(tab), this.createTabActions(tab, index, total));

    card.append(orderIndicator, cardHeader, this.createCategoryBadge(tab, category));
    return card;
  },

  createTabInfo(tab) {
    const tabInfo = document.createElement('div');
    tabInfo.className = 'tab-info';

    const tabTitle = document.createElement('h3');
    tabTitle.className = 'tab-title';
    tabTitle.textContent = tab.title || this.displayDomain(tab.url);

    const tabUrl = document.createElement('p');
    tabUrl.className = 'tab-url';
    tabUrl.textContent = tab.url;

    tabInfo.append(tabTitle, tabUrl);
    return tabInfo;
  },

  // Move up / move down are a simple alternative to drag and drop
  createTabActions(tab, index, total) {
    const tabActions = document.createElement('div');
    tabActions.className = 'tab-actions';
    tabActions.append(
      this.createIconButton('icon-btn move-up', browser.i18n.getMessage('moveUp'), TAB_CARD_ICONS.up,
        () => this.moveTab(tab.id, -1), index === 0),
      this.createIconButton('icon-btn move-down', browser.i18n.getMessage('moveDown'), TAB_CARD_ICONS.down,
        () => this.moveTab(tab.id, 1), index === total - 1),
      this.createIconButton('icon-btn edit', browser.i18n.getMessage('edit'), TAB_CARD_ICONS.edit,
        () => this.editTab(tab)),
      this.createIconButton('icon-btn danger delete', browser.i18n.getMessage('delete'), TAB_CARD_ICONS.delete,
        () => this.deleteTab(tab))
    );
    return tabActions;
  },

  createCategoryBadge(tab, category) {
    const badge = document.createElement('div');
    badge.className = 'tab-category';
    badge.title = browser.i18n.getMessage('changeCategoryTooltip');

    const iconSpan = document.createElement('span');
    iconSpan.textContent = category ? category.icon : '📁';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = category ? category.name : (browser.i18n.getMessage('uncategorized'));
    badge.append(iconSpan, nameSpan);

    badge.addEventListener('click', (e) => {
      e.stopPropagation(); // Keep the click away from the card (drag handling)
      this.openCategoryQuickEdit(e.currentTarget, tab);
    });
    UiUtils.makeActivatable(badge, e => this.openCategoryQuickEdit(e.currentTarget, tab), {
      label: `${badge.title}: ${nameSpan.textContent}`
    });
    return badge;
  },

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
      // The quick category popover must not stay open over another action
      this.closeCategoryQuickEdit();
      onClick();
    });
    return button;
  },

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
  },

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
  },

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
};
