# Tabs Pin — Pinned Tabs Manager for Firefox & Chrome

<p align="center">
  <img src="assets/icons/icon-128.png" alt="Tabs Pin logo" width="96">
</p>

<p align="center">
  <a href="https://addons.mozilla.org/fr/firefox/addon/tabs-pin-pin-tabs-manager/"><img alt="Install for Firefox" src="https://img.shields.io/badge/Firefox-Install-FF7139?logo=firefox&logoColor=white"></a>
  <a href="https://chromewebstore.google.com/detail/tabs-pin-gestionnaire-don/bnopgflgghbmdmcahibdcpbgmfgoknab"><img alt="Chrome Web Store" src="https://img.shields.io/badge/Chrome-Web%20Store-4285F4?logo=googlechrome&logoColor=white"></a>
  <a href="https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/alexandre-leng/Tabs-Pin-Manager-Extension"></a>
  <a href="LICENSE"><img alt="License: GPL-3.0" src="https://img.shields.io/badge/license-GPL--3.0-blue"></a>
</p>

Save the sites you always keep pinned, sort them into categories, and reopen them all
— pinned, without duplicates — in one click. Manifest V3, 100% local storage, no account, no tracking.

## Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Privacy & permissions](#privacy--permissions)
- [Backup format](#backup-format)
- [Development](#development)
- [Architecture](#architecture)
- [Releasing](#releasing)
- [Support](#support) · [License](#license)

## Features

- **One-click launch** — open every saved site as a pinned tab, or only one category.
- **No duplicates** — a site already open is left alone; open but unpinned, it is pinned
  instead of reopened. Matching ignores tracking parameters but keeps the ones that
  identify a page (`?v=` on YouTube, `?q=`, `?id=`, single-page-app routes like `#/inbox`…).
- **Pin the current tab** from the popup, into the category of your choice.
- **Categories** — rename them and pick an emoji icon; close all pinned tabs of a
  category at once (with confirmation).
- **Reorder** tabs by drag and drop, or with the ↑ / ↓ buttons (keyboard friendly).
- **Import / export** your configuration as JSON.
- **14 languages** — Arabic, Chinese, Dutch, English, French, German, Hindi, Indonesian,
  Italian, Japanese, Korean, Portuguese, Russian, Spanish.
- **Accessible** — full keyboard use, focus management in dialogs, screen-reader labels,
  dark mode, high-contrast and reduced-motion preferences respected.

## Installation

| Browser | Store | Minimum version |
|---|---|---|
| Firefox | [addons.mozilla.org](https://addons.mozilla.org/fr/firefox/addon/tabs-pin-pin-tabs-manager/) | 115 (ESR) |
| Chrome / Chromium | [Chrome Web Store](https://chromewebstore.google.com/detail/tabs-pin-gestionnaire-don/bnopgflgghbmdmcahibdcpbgmfgoknab) | 104 |

Each [GitHub release](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/releases)
also provides the Firefox and Chrome packages as `.zip` files.

## Usage

1. Click the **Tabs Pin** icon in the toolbar.
2. **Pin current tab** saves the page you are on (you choose its category), or open
   **Options** to add, edit and reorder sites.
3. **Open N tabs** opens everything; click a category to open only its sites.
4. The **Close** button of a category closes its pinned tabs in the current window.

## Privacy & permissions

| Permission | Why |
|---|---|
| `tabs` | Read the addresses of open tabs, to avoid duplicates and pin / close them |
| `storage` | Keep your sites, categories and settings in the browser's local storage |
| `activeTab` | Read the current tab when you pin it |

- **100% local storage**: your sites, categories and settings are stored only in your
  browser (`storage.local`) and never sent anywhere: no account, no sync server, no analytics.
- **Site icons** (display only, nothing is stored remotely): to show the favicon of a saved site, the popup and options page request
  it from Google's and DuckDuckGo's favicon services, then from the site itself. These
  requests contain the site's **domain name** (not the full address).

## Backup format

**Options → Export** downloads a JSON file:

```json
{
  "tabs": [
    { "id": "tab_…", "url": "https://example.com/", "title": "Example",
      "category": "work", "enabled": true, "order": 0, "dateAdded": "2026-01-01T00:00:00.000Z" }
  ],
  "categories": [{ "id": "work", "name": "Work", "icon": "💼" }],
  "settings": { "lastOpened": "2026-01-01T00:00:00.000Z" },
  "exportDate": "…",
  "version": "1.4.0"
}
```

On import, the file **replaces** the current configuration. It is validated first:
entries without an `http(s)` address, unnamed categories and invalid values are dropped,
duplicate IDs are fixed, and the number of skipped tabs is reported.

## Development

Requirements: **Node.js ≥ 20.11** (see `.nvmrc`), Firefox and/or Chromium.

```bash
git clone https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension.git
cd Tabs-Pin-Manager-Extension
npm ci
```

| Command | What it does |
|---|---|
| `npm run dev:firefox` | Runs Firefox with the extension, reloaded on every change |
| `npm run dev:chrome` | Stages `build/chrome/`: load it as an unpacked extension (run again after changes) |
| `npm run build` | Builds both packages into `web-ext-artifacts/` (`build:firefox` / `build:chrome` for one) |
| `npm test` | Unit tests (Jest) |
| `npm run test:e2e` | Interface tests (Playwright): loads the real extension in Chromium, drives the popup and options page, runs an axe-core accessibility audit. Run `npx playwright install chromium` once first |
| `npm run lint` | web-ext lint (Firefox add-on rules) |
| `npm run lint:js` / `npm run lint:css` | ESLint / Stylelint |

`manifest.json` is shared and never modified: every command copies the extension into
`build/<browser>/` with the browser-specific manifest (`scripts/prepare-manifest.js`).
CI runs all the checks above on every push and pull request.

## Architecture

Native **ES modules**, no bundler: each context has one entry module and every
dependency is an explicit `import`.

| Context | Entry | Modules |
|---|---|---|
| Background (Firefox event page / Chrome service worker) | `background/background.js` | `controller.js` (events, messages), `data-store.js` (saved data, one change at a time), `tab-actions.js` (open / pin / close tabs), `import-sanitizer.js`, `log.js` |
| Popup | `popup/main.js` | `popup.js` (`PopupManager`), `category-list.js`, `category-order.js`, `category-selection.js`, `tab-actions.js` |
| Options page | `options/main.js` | `options.js` (`OptionsManager`), `tab-cards.js`, `tab-editor.js`, `tab-ordering.js`, `category-editor.js`, `icon-picker.js`, `import-export.js` |
| Shared | `lib/` | `browser-api.js`, `storage-manager.js`, `url-utils.js`, `tab-utils.js`, `domain-utils.js`, `time-format.js`, `ui-utils.js`, `i18n-helper.js`, `default-categories.js`, `mixins.js` |

- The **background script owns the data**: pages read and change it only through
  messages (`getTabsData`, `saveTab`, `reorderTabs`, `importAllData`…), and it broadcasts
  a `dataChanged` message after each change.
- Page features are plain objects of methods composed into the page class with `mixin()`,
  which throws if two features define the same method.
- `tests/module-graph.test.js` checks that every import resolves and no module is unused;
  `tests/locales.test.js` checks that every translation key used exists in every language.

## Releasing

1. Bump the version in `package.json` and `manifest.json` (a test checks they match).
2. Move the `Unreleased` notes of `CHANGELOG.md` under `## [x.y.z] - date`.
3. Push to `main`, then run the **Release** workflow (Actions → Release → Run workflow):
   it tests, builds both packages and publishes the GitHub release with the changelog
   section as notes.

## Support

- Bugs and ideas: [GitHub Issues](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/issues)
- Email: dev.alexandre.git [@] gmail.com
- Changes: [CHANGELOG.md](CHANGELOG.md)

## License

[GPL-3.0](LICENSE) — developed by Alexandre.
