/**
 * Tab reordering: drag and drop in the grid and the up/down buttons.
 * Methods mixed into OptionsManager (see options.js).
 */

import { browser } from '../lib/browser-api.js';

export const tabOrdering = {
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
  },

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
  },

  // Returns the tab IDs in their new visual order, or null if nothing changed
  calculateNewOrder() {
    const orderedIds = Array.from(this.elements.tabsGrid.querySelectorAll('.tab-item'))
      .map(card => card.dataset.tabId);
    
    const currentIds = this.getSortedTabs().map(t => t.id);
    const unchanged = orderedIds.length === currentIds.length &&
      orderedIds.every((id, i) => id === currentIds[i]);
    
    return unchanged ? null : orderedIds;
  },

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
  },

  // Move a tab one position up (delta = -1) or down (delta = 1)
  moveTab(tabId, delta) {
    const orderedIds = this.getSortedTabs().map(t => t.id);
    const index = orderedIds.indexOf(tabId);
    const newIndex = index + delta;
    if (index === -1 || newIndex < 0 || newIndex >= orderedIds.length) return;
    
    [orderedIds[index], orderedIds[newIndex]] = [orderedIds[newIndex], orderedIds[index]];
    this.reorderTabs(orderedIds);
  },

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
        
        this.showToast('success', '↕️', browser.i18n.getMessage('tabReordered'));
        this.renderTabs();
      } else {
        throw new Error(response?.error || browser.i18n.getMessage('failedToReorderTab'));
      }
    } catch (error) {
      console.error('Error reordering tab:', error);
      this.showToast('error', '❌', browser.i18n.getMessage('failedToReorderTab'));
      
      // Reload data to reset state
      await this.loadData();
      this.renderTabs();
    }
  }
};
