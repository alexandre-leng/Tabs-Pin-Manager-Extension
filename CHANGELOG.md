# Changelog

All notable changes to this project will be documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every entry is written in English: the release notes published from this file are read by users of
both stores, whatever their language. The rules are in [`docs/versioning.md`](docs/versioning.md).

## [Unreleased]

### 🛠️ Fixes
- **Different pages refused as duplicates**: `example.com/Docs` blocked `example.com/docs`, and `?q=Foo` blocked `?q=foo`, although they are different pages on most servers. The host is still compared case-insensitively; the path and the query values no longer are.
- **Repeated parameters ignored**: a page such as `?id=a&id=b` was taken for `?id=b`, so a saved tab could be reported as already open and never opened. Every value is kept now.
- **Popup counts**: the badge on "Open all" counted every saved tab while the label counted only the enabled ones ("3" next to "Open 2 tabs"), and a category card counted tabs its click would not open. Every count now matches what the action does.
- **Every tab disabled**: the popup said "All tabs are already open". The button is now disabled and says "No tab is enabled".
- **Icon picker**: an unreadable `recentIcons` value in local storage made the picker throw and never open; the value is dropped and rebuilt.
- **Pin confirmation**: a category deleted in another window made the message say "Unknown" in every language; it falls back to the category ID.
- **Robustness**: a message action named like an Object property ("constructor", "toString") is rejected as unknown, and the storage health check no longer leaves its test key in the read cache.

## [1.7.0] - 2026-11-06

### ✨ New Features
- **First-run walkthrough**: a short page, opened once when the extension is installed, says what Tabs Pin is for in three illustrated steps, one sentence each: save a page, reopen it anytime, keep projects apart. It ends on the privacy promise and a button to the options page, closes with Escape, and opens again from the "?" in the popup header or the "How it works" link in the options footer. Translated in the 14 languages.
- **Delete a category from its card**: a cross in the corner of each category card deletes it, with the same confirmation as the dialog. No need to open the category first. The cross is gone when only one category is left, and the confirmation of an empty category now says it holds no pinned tab instead of announcing "0 pinned tab(s)". Category cards also show a focus ring now that they are reached with the keyboard.

### 🛠️ Fixes
- **Right-to-left direction**: the pages now set their writing direction from the interface language itself, so Arabic stays right to left even when the browser reports no direction. Verified by an automated test that opens the walkthrough with a French and an Arabic interface.
- **Translations**: eight languages (Hindi, Indonesian, Japanese, Korean, Dutch, Portuguese, Russian, Chinese) still displayed "Some tabs were pinned and others opened" in English. Error messages raised by the background script are translated too, instead of reaching the options page in English, and the favicon of the tab preview no longer carries an English "Favicon" label.

### 🧹 Quality
- **Responsive walkthrough**: one card per row on a narrow window, three columns from 640 px, and an interface test fails the build if the page ever overflows sideways at 320 px or 900 px.

## [1.6.0] - 2026-11-06

Category deletion, a lighter popup and an English documentation folder.

### ✨ New Features
- **Delete a category**: the edit dialog offers "Delete Category", with a confirmation naming the tabs involved and the category that will take them. Tabs of the deleted category move to the first remaining category, and the last category cannot be deleted.

### 🧹 Quality
- **Lighter popup**: the "Last opened" line and the "N pinned / N categories" statistics row are removed, with the time formatting module and the seven messages they used in the 14 locales. The `lastOpened` setting is still recorded in backups.

### 📝 Documentation
- **Documentation folder**: architecture, backup format, accessibility and versioning pages now live in `docs/`, in English, while the README keeps the overview, installation and usage and links to them.
- **Versioning rules**: `docs/versioning.md` says when to publish a major, minor or patch version (data or permission break, feature, fix), and how the number follows from the changelog sections.

## [1.5.0] - 2026-11-06

### ✨ New Features
- **Add a category**: an "Add Category" button in the options page opens the editor on an empty category (name and icon), like a tab. Capped at 20 categories: at that number the button is disabled and the reason shows under the heading. Categories above this limit imported from a backup stay readable and editable. The "Reset to Default" confirmation now states that added categories will be deleted.

### 🛠️ Fixes
- **Accessibility, category cards**: the announced name now includes the visible text (icon, name, tab count), as WCAG 2.5.3 requires; the automated interface audit checks it.
- **Long category names**: a name without spaces overflowed its card and was clipped, in the options page and in the popup; it now wraps inside the card.
- **Popup, category picker**: the announced name includes the visible text (WCAG 2.5.3) and the tab count of an empty category reaches the minimum contrast; this dialog is now covered by the accessibility audit.

### 📝 Documentation
- README updated to match the current code: duplicate detection (redirects, parameter order), closing a category by domain, export format and import rules, migrations on update, background script messages, the `punycode.js` module, accessibility.

## [1.4.2] - 2026-10-08

### 📝 Documentation
- README: em dashes replaced with simple punctuation.

## [1.4.1] - 2026-10-08

### 🛠️ Fixes
- **Tabs opened twice after a redirect**: a site that redirects (`a.com` → `www.a.com`, `http` → `https`) was never recognised, and every "Open all" added another pinned tab.
- **Firefox, loading tabs**: a tab still empty (`about:blank`) was not recognised: "Close" ignored it and "Open all" duplicated it.
- **Renames undone on every update**: a category renamed with its default English name (e.g. "Development" in a French browser) took its translated name back on every update; default names are now translated only once.
- **Tabs hidden after an update**: tabs left without a valid category by older versions are moved to the first category on update, and an empty category list is replaced with the default categories.
- **Address refused for no reason**: two pages differing by a parameter (`?sku=1` / `?sku=2`) were taken for the same address and the second could not be saved.
- **Address comparison**: the root route `#/` and the order of parameters no longer change the page recognised.
- **Imported category without an icon**: it blocked every category change; it now gets a default icon.
- **Popup**: "1 tab open / pinned" in the singular; "Opening…" and the dialog close button translated; the close confirmation states the number of pinned tabs actually closed; a double click in "Pin into a category" no longer shows an error; the separator between used and empty categories is displayed.
- **Options**: selecting text in a field and releasing the mouse outside the dialog no longer closes it (and no longer clears the input); the quick category picker closes when another action opens and no longer runs off screen; the keyboard focus stays on the card after "Move up / Move down", "Delete" and saving a dialog.
- **Accessibility and languages**: messages (toasts) are announced by screen readers; the page language and writing direction follow the browser (Arabic displays right to left); international domain names display in clear (`bücher.ch` instead of `xn--bcher-kva.ch`).
- **Storage**: a system clock change can no longer block storage operations.
- **Existing duplicates not editable** (1.4.0 regression): a tab saved twice by an older version could no longer be renamed or moved to another category ("address already saved"); only adding an address already saved is now refused.

### 📝 Documentation
- README rewritten: 100% local storage, permissions explained, favicon services mentioned, backup format, minimum versions, up-to-date architecture, release procedure.

## [1.4.0] - 2026-10-07

### 🛠️ Fixes
- **Tabs invisible after "Reset categories"**: tabs of a deleted category (imported, for instance) no longer appeared in the popup; they are now moved to the first category. A tab saved with an unknown category is too.
- **Categories blocked after an import**: an imported file could hold a category without a name; after that, renaming any category failed ("invalid data") until a reset. Those categories are now dropped on import.
- **Tab saved twice**: a double click in the "Pin into a category" window saved the tab twice; the popup ignores the second click and the background refuses an address already saved.
- **Imported opening date**: an invalid value ("20,733 days ago") is no longer imported.
- **Pages confused**: two YouTube videos (`?v=`), two playlists (`list`) or two routes of a web app (`#/a`, `#/b`) were taken for the same tab, and the second was never opened; those parameters and routes are now taken into account.
- **Lost edit**: a read started during a save could put old data back in memory, which the next save wrote again; the read is now ignored in that case.
- **Background stuck**: a storage error at start-up made every message fail until the extension was reloaded; initialisation is now retried on the next message.
- **Inconsistent memory**: if a write failed (quota…), the memory kept data absent from storage; it is now changed only after a successful write.
- **Popup**: the "Open N tabs" button and opening a category now skip disabled tabs, and the close confirmation states the number of tabs actually closed (nothing is asked when there are none).
- **Options**: saving the same address twice is refused.
- **Storage**: throttling now also spaces concurrent calls, and the cache key is no longer ambiguous for a read with default values.
- **"Last opened" badly translated**: the elapsed time was assembled by hand ("ago 3 days", "vor 3 Stundes", "前 3 日s"…); it is now formatted by the browser in the user's language ("il y a 3 heures", "vor 3 Stunden", "3 時間前").
- **"Tab already pinned"**: the popup compared addresses differently from the background script, and could therefore announce a tab as pinned (or not) wrongly; a single comparison function is shared.
- **Category order**: the "Development" category was recognised by its name (any category containing "dev", such as "Devis", went last, and the rule failed in other languages); it is now recognised by its identifier.
- **Imported data wiped**: an import made right after installation could be overwritten by the default data initialisation, and a slow read could put old data back in memory. Data operations now run one at a time, and a read that overlaps a write is no longer used nor cached.
- **Loading tabs**: a tab not yet loaded was not recognised (empty address): "Close" on a category ignored it and "Open" could duplicate it.
- **Accessibility**: insufficient contrast fixed (popup "Close" button, secondary texts); dialogs are announced as such, take the focus when they open and give it back when they close; Escape closes only the top window; cards and category badges usable from the keyboard; "reduce animations" preference respected; high contrast styles re-enabled (`prefers-contrast: high` does not exist, replaced by `more`).
- **Missing translations**: the closing texts of a category ("Close", confirmation, result messages) were missing in 12 languages and displayed in English.
- **French message**: "Some tabs were already open" no longer displayed the numbers of tabs opened and created.
- **Storage check**: the health check now verifies that the value read back matches the one written.
- **Secure import**: an imported file can no longer save tabs without an http(s) URL (`javascript:`, `file:`…) nor malformed data; duplicate identifiers are fixed and skipped tabs are counted.
- **Popup translation**: the popup texts are translated as soon as it opens, even when the background script answers late or fails.
- **Failure reported**: when no tab could be opened, the popup displayed "All tabs are already open"; it now shows an error.
- **Options page**: the template of the quick category picker was placed after `</html>` (invalid HTML); its buttons and the icon picker one now have a translated label, also read by screen readers.
- **Untranslated titles**: the "Edit tab" title and the export failure message used missing keys and stayed in English in every language; a test now checks that every requested text exists.
- **Icons exposed to sites**: the manifest made the extension icons reachable by every web page, which allowed detecting the extension; that needless exposure is removed.
- **Repository links**: the links of the manifest, the README and the changelog point to the right repository.

### 🧹 Quality
- Minimum versions declared: Firefox 115 (ESR) and Chrome 104, from the features used; Node 20.11 for the tools (`engines`, `.nvmrc`); dependency updates offered by Dependabot.
- `popup.js` (≈ 480 lines) and `options.js` (≈ 380) lightened: the category list, the category order and the tab cards move to their own modules.
- **Interface tests**: Playwright loads the real extension in Chromium and tests the popup and the options page (open, close, add, edit, delete, arrows, drag and drop, category change, icons, export / import), with an axe-core accessibility audit (light and dark) and keyboard tests; run in CI.
- **Fallback texts removed**: the 63 hard-coded English texts after `getMessage(...)` are removed; the translation test guarantees that every requested text exists.
- **Stylelint**: standard configuration, fixes (duplicates, unknown properties, doubled animations, notations), run in CI.
- **ES modules**: all the code (background, popup, options, `lib/`) moved to native ES modules with explicit imports. No shared global variables nor dependence on the order of `<script>` tags: every page loads a single entry module, and the background is declared `type: module` (Firefox and Chrome).
- **Background split**: the single class of about 1000 lines becomes 7 modules (message controller, data storage, tab actions, import validation, utilities), the largest being 177 lines; a state never read (`tabUrlsById`) is removed. Every module has its own tests.
- Sending messages to the background script centralised in `UiUtils.sendMessage` (two divergent variants before); the popup no longer replays an action the background refused.
- CSS: 29 unused rules and 55 variables copied identically from `shared.css` removed (≈ 280 lines), with no visual change (16 light/dark captures compared pixel by pixel); a test prevents dead styles from coming back.
- Popup tab-opening messages grouped in `reportOpenResult`; options tab card and import validation split into small functions; ESLint caps complexity and function length, with no warning tolerated in CI.
- `StorageManager` simplified: one retry loop for reads and writes, removal of a false de-duplication (timestamped identifiers never identical) and of unused methods; the cache returns copies so a change by the caller cannot corrupt it.
- Dead code removed: `updateSettings` / `updateTab` actions never sent, unused `I18nHelper` functions, 8 unused translation texts (a test prevents them from coming back).
- Firefox container support removed (`lib/container-utils.js`): without the `contextualIdentities` permission it was never active. Container identifiers from old backups are ignored on import.
- Tab opening logic factored out (`openTabConfigs`), debug logs off by default, popup/options helpers shared (`lib/ui-utils.js`).
- `popup.js` and `options.js` split by feature (tab editing and reordering, categories, icon picker, import/export, popup actions, category selection); a `getSelectedIcon` method defined twice removed.
- Page translation centralised in `I18nHelper.localizePage` (the module was used only by the tests); HTML fallback texts and comments in English.
- Tests added: import validation, `localizePage`, version consistency between `package.json` / `manifest.json`.
- Build, lint and dev work on a copy in `build/<browser>/`: `manifest.json` is no longer rewritten on every command, and only the extension files are packaged (`eslint.config.js` no longer ships in the zips). The list of Firefox background scripts is read from `background.js`.
- README fixed (repository folder, commands, permissions); valid npm package name.
- ESLint, `.editorconfig` and tests (tab opening, helpers, translation consistency) run in CI.

## [1.3.5] - 2026-10-06

### 🛠️ Fixes
- **Drag and drop in the grid**: moving a tab from the top to the very bottom placed it second. The drop position now takes columns into account (row then column), and the card moves directly during the drag instead of a "Drop here" slot that shifted the whole grid.
- **Undoing a move**: cancelling a drag and drop (Escape or dropping outside the grid) restores the original order.

### ✨ New Features
- **Move up / Move down buttons**: every pinned tab has ↑ / ↓ arrows to reorder it without dragging.
- **GitHub links**: "Report a bug" and "Feature request" links in the popup and the options page, translated in every language.

## [1.3.4] - 2026-10-06

### 🛠️ Fixes
- **Tab reordering**: drag and drop now places the tab at the right position. The message "Tab order updated!" appeared but the saved order was wrong (bad position calculation, moved tab sent back to the top).
- **Full order saved**: every tab gets an explicit order on a move, through a new `reorderTabs` action.
- **Disappearing dialogs**: the options page windows no longer close by themselves right after opening (after pressing Escape, for instance).
- **Chrome service worker**: event listeners are registered immediately, so messages and the install event are no longer lost when the service worker wakes up.
- **Renamed categories**: custom category names are no longer reset on every extension update.
- **Installation**: existing data is no longer overwritten on install.
- **Popup**: the popup stays usable when the background script does not answer, and no longer overwrites settings with a stale copy.
- **Category picker**: opening the quick category picker while another one closes no longer deletes the wrong one.
- **Tab editing**: editing a tab no longer re-enables it when it was disabled.
- **Export**: the export download is no longer cancelled under Firefox.
- **Notifications**: a new message is no longer hidden too early by the previous one.
- **Storage cache**: the cache is invalidated as soon as another part of the extension changes the data.
- **Import**: malformed import files are rejected.

## [1.3.1] - 2026-05-19

### 🛠️ Fixes
- **Release pipeline**: automation of the build, tag and GitHub publication for Firefox and Chrome.

## [1.3.0] - 2026-04-08

### 🛠️ Fixes
- **Deletion bug**: fixed the bookmark deletion bug. The interface now updates instantly after a deletion (`fixed issue: allow deleting pinned tabs from dashboard`).
- **Manifest fix**: removed an invalid field in `manifest.json` that blocked loading under Firefox.

### ✨ New Features
- **Full cross-browser support**: unified architecture letting the extension run natively on Chrome and Firefox with the same source.
- **Firefox container support**: addition of the `contextualIdentities` permission for full Multi-Account container support.
- **Chrome service worker**: a wrapper to support the Chrome MV3 extension lifecycle.

## [1.2.9] - 2026-04-08

### 🔧 Improvements
- Preparation of the architecture for multi-browser support.

## [1.2.4] - 2025-01-XX

### 🛠️ Critical IndexedDB fixes
- **🗂️ New StorageManager**: robust storage manager to eliminate the `IndexedDB UnknownErr: ActorsParent.cpp` errors
- **🔄 Smart retry**: up to 3 attempts with exponential backoff for failed operations
- **⏱️ Operation throttling**: minimum 50 ms between storage accesses to avoid overload
- **💾 Smart cache**: 5 second cache to reduce repeated storage accesses
- **🔒 Timeout protection**: 10 second timeout to avoid blocked operations

### ✨ Storage features
- **📊 Automatic health check**: storage system health diagnosis at start-up
- **🧹 Operation de-duplication**: avoids identical concurrent operations
- **📈 Performance monitoring**: response time and success rate metrics
- **⚡ Smart fallback**: automatic switching between background script and direct storage

### 🔧 Technical improvements
- **🏗️ Modular architecture**: clear separation between storage management and business logic
- **🛡️ Advanced error handling**: distinction between critical and temporary errors
- **📝 Detailed logs**: informative messages for debugging and support
- **🎯 Firefox optimisation**: parameters specifically tuned for Firefox IndexedDB

### 📊 Performance impact
- **✅ IndexedDB errors eliminated**: no more `ActorsParent.cpp` errors in the console
- **⚡ Faster response times**: faster loading thanks to the smart cache
- **🔄 Increased reliability**: automatic recovery from temporary failures
- **📉 Lower system load**: throttling to avoid overloading the IndexedDB engine

## [1.2.3] - 2025-01-XX (previous version)

### 🛠️ Important fixes
- **Invalid tab ID errors fixed**: no more `"Invalid tab ID: X"` errors in the console
- **Popup-background communication improved**: out-of-scope promise errors resolved
- **Systematic tab validation**: existence checked before any operation
- **Automatic clean-up**: removal of invalid tab references

### ✨ New Features
- **Smart redirect handling**: automatic detection of Google Auth redirect URLs
- **Advanced URL normalisation**: recognition of complex authentication patterns
- **Improved container support**: validation and safety delays for Firefox Multi-Account Containers
- **Robust retry mechanism**: reliable communication with automatic attempts

### 🌐 Internationalisation
- **Complete translations**: new keys added for Italian and Spanish
- **Container messages**: multilingual support for container features
- **Error messages**: complete localisation of errors and confirmations

### 🔧 Technical improvements
- **Stronger ContainerUtils**: adaptive delays and container validation
- **Asynchronous communication**: correct promise handling with `sendResponse`
- **Detailed logs**: informative messages for debugging and support
- **Optimised performance**: roughly 95% fewer errors

## [1.2.2] - 2025-01-XX

### 🛠️ Important fixes
- **Invalid tab ID errors fixed**: no more `"Invalid tab ID: X"` errors in the console
- **Popup-background communication improved**: out-of-scope promise errors resolved
- **Systematic tab validation**: existence checked before any operation
- **Automatic clean-up**: removal of invalid tab references

### ✨ New Features
- **Smart redirect handling**: automatic detection of Google Auth redirect URLs
- **Advanced URL normalisation**: recognition of complex authentication patterns
- **Improved container support**: validation and safety delays for Firefox Multi-Account Containers
- **Robust retry mechanism**: reliable communication with automatic attempts

### 🌐 Internationalisation
- **Complete translations**: new keys added for Italian and Spanish
- **Container messages**: multilingual support for container features
- **Error messages**: complete localisation of errors and confirmations

### 🔧 Technical improvements
- **Stronger ContainerUtils**: adaptive delays and container validation
- **Asynchronous communication**: correct promise handling with `sendResponse`
- **Detailed logs**: informative messages for debugging and support
- **Optimised performance**: roughly 95% fewer errors

## [1.2.1] - 2024-12-XX

### 🔧 Bug fixes
- **Firefox Multi-Account Containers support**: addition of the `contextualIdentities` and `cookies` permissions
- **Container handling**: complete integration with Firefox Multi-Account Containers
- **Background scripts**: restructuring to support containers

### ✨ Improvements
- **Automatic detection**: container support checked at start-up
- **Default container**: graceful fallback when containers are unavailable
- **Richer logs**: informative messages for container operations

## [1.2.0] - 2024-11-XX

### ✨ Major features
- **Redesigned interface**: modern design inspired by Firefox Proton
- **Category system**: tabs organised into customisable categories
- **Drag and drop**: intuitive reordering of tabs by dragging
- **Duplicate handling**: smart detection of tabs already open

### 🎨 Interface
- **Modern popup**: clear interface with a tab preview
- **Improved options**: completely redesigned settings page
- **Adaptive theme**: automatic dark / light mode support
- **Smooth animations**: improved transitions and visual feedback

### 🌐 Full internationalisation
- **14 languages supported**: French, English, Spanish, Italian, German, Dutch, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, Indonesian, Arabic
- **Native localisation**: contextual messages and complete descriptions
- **RTL support**: right-to-left languages supported (Arabic)

### 🔧 Technical improvements
- **Modular architecture**: code organised in distinct modules
- **Robust error handling**: full coverage of failure cases
- **Optimised performance**: faster loading and fewer resources
- **Modern Firefox API**: use of the latest WebExtensions APIs

## [1.1.0] - 2024-10-XX

### ✨ New Features
- **Automatic opening**: option to open the tabs in new windows
- **Import / Export**: saving and restoring configurations
- **Pin the current tab**: quick addition from the popup
- **Usage statistics**: information about the last opening

### 🔧 Improvements
- **URL validation**: automatic check of the addresses typed in
- **Feedback messages**: success and error notifications
- **Responsive interface**: adaptation to different screen sizes

## [1.0.0] - 2024-09-XX

### 🎉 Initial release
- **Pinned tab management**: creating and managing a list of favourite URLs
- **One-click opening**: all configured tabs opened at once
- **Automatic pinning**: tabs open directly pinned
- **Simple setup**: basic interface to add and remove tabs

### 🛠️ Base features
- **Local storage**: secure saving of the configuration
- **Minimal permissions**: only the permissions needed
- **Firefox compatible**: support for Firefox 78.0 and later
- **Manifest v2**: Firefox standards compliance

## Change types

- **✨ New Features**: additions.
- **🛠️ Fixes**: bug fixes.
- **🔧 Improvements**: improvements to existing features.
- **🎨 Interface**: user interface changes.
- **🌐 Internationalisation**: translation additions and changes.
- **⚡ Performance**: performance improvements.
- **🔒 Security**: security fixes.
- **📝 Documentation**: documentation updates.

## Links

- **GitHub repository**: [Tabs-Pin-Manager-Extension](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension)
- **Firefox Add-ons**: [AMO page](https://addons.mozilla.org/firefox/addon/tabs-pin/)
- **Documentation**: [docs/](docs/README.md)
- **Support**: [GitHub issues](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/issues)
