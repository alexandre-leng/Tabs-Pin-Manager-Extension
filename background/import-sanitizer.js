/**
 * Validation of imported backups.
 */

import { generateTabId, isValidUrl } from '../lib/tab-utils.js';

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Validates an imported backup: drops tabs without an http(s) URL and malformed
 * categories, fixes field types and duplicate IDs. Throws if the overall shape is wrong.
 * @returns {{tabs: object[], categories: object[], settings: object, skipped: number}}
 */
export function sanitizeImportData(data) {
  if (!isPlainObject(data) || !Array.isArray(data.tabs) || !Array.isArray(data.categories) || !isPlainObject(data.settings)) {
    throw new Error('Invalid import data format');
  }

  const categories = [];
  const categoryIds = new Set();
  for (const category of data.categories) {
    const clean = sanitizeCategory(category);
    if (clean && !categoryIds.has(clean.id)) {
      categoryIds.add(clean.id);
      categories.push(clean);
    }
  }
  if (categories.length === 0) {
    throw new Error('Invalid import data format');
  }

  const tabs = [];
  const tabIds = new Set();
  for (const tab of data.tabs) {
    const clean = sanitizeTab(tab, categoryIds, categories[0].id);
    if (!clean) continue;
    while (tabIds.has(clean.id)) clean.id = generateTabId();
    tabIds.add(clean.id);
    tabs.push(clean);
  }

  return { tabs, categories, settings: data.settings, skipped: data.tabs.length - tabs.length };
}

/** Returns a cleaned category, or null when it cannot be used. */
function sanitizeCategory(category) {
  if (!isPlainObject(category) || typeof category.id !== 'string' || !category.id ||
      typeof category.name !== 'string') {
    return null;
  }
  return { ...category, icon: typeof category.icon === 'string' ? category.icon : '📁' };
}

/** Returns a cleaned tab, or null when it has no http(s) URL. */
function sanitizeTab(tab, categoryIds, fallbackCategoryId) {
  if (!isPlainObject(tab) || typeof tab.url !== 'string' || !isValidUrl(tab.url)) {
    return null;
  }
  const clean = {
    ...tab,
    id: typeof tab.id === 'string' && tab.id ? tab.id : generateTabId(),
    title: typeof tab.title === 'string' ? tab.title : tab.url,
    category: categoryIds.has(tab.category) ? tab.category : fallbackCategoryId,
    enabled: tab.enabled !== false
  };
  if (!Number.isFinite(clean.order)) delete clean.order;
  if (typeof clean.dateAdded !== 'string') clean.dateAdded = new Date().toISOString();
  // Containers are not supported: older backups may still carry a container ID
  delete clean.cookieStoreId;
  return clean;
}
