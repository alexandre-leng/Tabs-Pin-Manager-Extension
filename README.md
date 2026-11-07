# Tabs Pin: Pinned Tabs Manager for Firefox & Chrome

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
in one click, pinned and without duplicates. Manifest V3, 100% local storage, no account, no tracking.

## Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Privacy & permissions](#privacy--permissions)
- [Development](#development)
- [Documentation](#documentation)
- [Support](#support) · [License](#license)

## Features

- **One-click launch**: open every saved site as a pinned tab, or only one category.
- **No duplicates**: a site already open is left alone; open but unpinned, it is pinned
  instead of reopened. Matching ignores tracking parameters, parameter order, `http`/`https`
  and `www.` (so a tab still matches after the site redirected it), but keeps what
  identifies a page (`?v=` on YouTube, `?q=`, `?id=`, single-page-app routes like `#/inbox`…).
  The same address cannot be saved twice.
- **Pin the current tab** from the popup, into the category of your choice.
- **First run**: a short page explains in three steps what the extension does; open it again
  from the "?" in the popup header or the "How it works" link in the options footer.
- **Categories**: add as many as you need, rename or delete them and pick an emoji icon;
  close all pinned tabs of a category at once (with confirmation). Tabs of a removed
  category move to the first one, and the last category cannot be deleted.
- **Reorder** tabs by drag and drop, or with the ↑ / ↓ buttons (keyboard friendly).
- **Import / export** your configuration as JSON.
- **14 languages**: Arabic, Chinese, Dutch, English, French, German, Hindi, Indonesian,
  Italian, Japanese, Korean, Portuguese, Russian, Spanish.
- **Accessible**: full keyboard use, focus kept in place after actions, screen-reader
  labels and announced messages, right-to-left layout for Arabic, dark mode,
  high-contrast and reduced-motion preferences respected.

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
   **Options** to add, edit and reorder sites and categories. The cross in the corner of a
   category card deletes it, after confirmation, and moves its sites to the first remaining
   category.
3. **Open N tabs** opens everything; click a category to open only its sites.
4. The **Close** button of a category closes, after confirmation, the pinned tabs of the
   current window whose site (domain) matches one of the category's saved sites.

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

## Documentation

The deeper documentation lives in [`docs/`](docs/README.md), in English:

| Page | What it covers |
|---|---|
| [Architecture](docs/architecture.md) | contexts, modules, data flow, tests and packaging |
| [Backup format](docs/backup-format.md) | the exported JSON, and how an import is validated |
| [Accessibility](docs/accessibility.md) | keyboard, screen readers, themes and the automated audit |
| [Versioning](docs/versioning.md) | version numbers, changelog sections and the release procedure |

## Support

- Bugs and ideas: [GitHub Issues](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/issues)
- Email: dev.alexandre.git [AT] gmail [DOT] com
- Changes: [CHANGELOG.md](CHANGELOG.md)

## License

[GPL-3.0](LICENSE). Developed by Alexandre.
