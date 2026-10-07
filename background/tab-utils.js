/**
 * Pure helpers on tab configurations and URLs.
 */

export function isValidUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export function generateTabId() {
  return 'tab_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

/** By explicit `order`, then tabs without order by date added. */
export function sortTabConfigs(tabs) {
  return [...tabs].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
  });
}
