/**
 * Order of the categories shown in the popup.
 */

// Default category listed last until the user has pinned something
const LAST_BY_DEFAULT = 'development';

const byName = (a, b) => a.name.localeCompare(b.name);

/** Alphabetical, with the default "Development" category last. */
export function defaultCategoryOrder(categories) {
  return [...categories].sort((a, b) =>
    (a.id === LAST_BY_DEFAULT) - (b.id === LAST_BY_DEFAULT) || byName(a, b));
}

/** Main list: default order while nothing is saved, then alphabetical. */
export function sortCategoriesForList(categories, tabs) {
  return tabs.length === 0 ? defaultCategoryOrder(categories) : [...categories].sort(byName);
}

/** "Pin to category" dialog: categories that already have tabs first, then alphabetical. */
export function sortCategoriesForSelection(categories, tabs) {
  if (tabs.length === 0) return defaultCategoryOrder(categories);
  const used = new Set(tabs.map(tab => tab.category));
  return [...categories].sort((a, b) => used.has(b.id) - used.has(a.id) || byName(a, b));
}
