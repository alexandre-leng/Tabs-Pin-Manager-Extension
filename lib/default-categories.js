/**
 * Default categories: one single source of truth for background, popup and options.
 */

export const CATEGORY_DEFINITIONS = [
  { id: 'work', fallbackName: 'Work', icon: '💼' },
  { id: 'personal', fallbackName: 'Personal', icon: '👤' },
  { id: 'development', fallbackName: 'Development', icon: '💻' },
  { id: 'social', fallbackName: 'Social', icon: '🌐' },
  { id: 'tools', fallbackName: 'Tools', icon: '🔧' },
  { id: 'entertainment', fallbackName: 'Entertainment', icon: '🎮' }
];

function translateCategoryName(category, i18nApi) {
  try {
    const translated = i18nApi && typeof i18nApi.getMessage === 'function'
      ? i18nApi.getMessage(category.id)
      : '';
    return translated || category.fallbackName;
  } catch {
    return category.fallbackName;
  }
}

/**
 * @param {{getMessage: Function}|null} i18nApi - browser.i18n, or null for English names
 */
export function getDefaultCategories(i18nApi) {
  return CATEGORY_DEFINITIONS.map(category => ({
    id: category.id,
    name: translateCategoryName(category, i18nApi),
    icon: category.icon
  }));
}
