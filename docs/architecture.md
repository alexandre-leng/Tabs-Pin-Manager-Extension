# Architecture

Native **ES modules**, no bundler: each context has one entry module and every dependency is an
explicit `import`. `manifest.json` is shared and never rewritten: every build command copies the
extension into `build/<browser>/` with the browser-specific manifest (`scripts/prepare-manifest.js`).

## Contexts

| Context | Entry | Modules |
|---|---|---|
| Background (Firefox event page / Chrome service worker) | `background/background.js` | `controller.js` (events, messages), `data-store.js` (saved data, one change at a time), `tab-actions.js` (open / pin / close tabs), `import-sanitizer.js`, `log.js` |
| Popup | `popup/main.js` | `popup.js` (`PopupManager`), `category-list.js`, `category-order.js`, `category-selection.js`, `tab-actions.js` |
| Options page | `options/main.js` | `options.js` (`OptionsManager`), `tab-cards.js`, `tab-editor.js`, `tab-ordering.js`, `category-editor.js`, `icon-picker.js`, `import-export.js` |
| Shared | `lib/` | `browser-api.js`, `storage-manager.js`, `url-utils.js`, `tab-utils.js`, `domain-utils.js`, `punycode.js` (display of international domains), `category-utils.js` (category IDs and the limit), `ui-utils.js`, `i18n-helper.js`, `default-categories.js`, `mixins.js` |

## The background script owns the data

Pages change the data only through messages: `openAllTabs`, `openCategoryTabs`,
`countCategoryPinnedTabs`, `closeCategoryTabs`, `saveTab`, `deleteTab`, `reorderTabs`,
`saveCategories`, `importAllData`. They read it with `getTabsData`; the popup reads storage directly
only when the background does not answer. After each change the background broadcasts `dataChanged`
so the open pages refresh.

`DataStore` runs every change through a queue: each write reads the state left by the previous one,
and a read that overlaps a write is discarded instead of replacing newer data. A write that fails
leaves the in-memory state untouched.

## Data model

- A tab: `{ id, url, title, category, enabled, order, dateAdded }`.
- A category: `{ id, name, icon }`. Default categories are created in the browser language on
  install; `migrate()` translates them once on update, tracked by `settings.categoriesLocalized`,
  fills missing tab fields and moves tabs of unknown categories to the first one.
- Category IDs created by the user are readable slugs (`clients-2026`), made unique against the
  existing ones (`lib/category-utils.js`). The 20 category cap is enforced by the interface only, so
  a backup holding more stays readable and editable.
- Deleting a category moves its tabs to the first remaining one, the same rule as a reset or an
  import. The last category cannot be deleted.

## Page composition

The popup and the options page are classes whose features are plain objects of methods, composed
with `mixin()`, which throws when two features define the same method.

## Guards

- `tests/module-graph.test.js`: every import resolves, and no module is unused.
- `tests/locales.test.js`: every translation key used exists in the 14 locales, with the same
  placeholders.
- `tests/css-usage.test.js`: every styled class is used by the HTML or the scripts.
- `tests/version.test.js`: `package.json` and `manifest.json` carry the same version.
- `npm run lint` (web-ext) must stay at 0 error.

## Permissions

`tabs` to read the addresses of open tabs, `storage` for the local data, `activeTab` to read the tab
being pinned. The [README](../README.md#privacy--permissions) explains what each one is used for.
