# Tabs Pin - Pin Tabs Manager for Chrome & Firefox

![Tabs Pin Logo](assets/icons/icon-128.png)

> A cross-browser extension to efficiently manage your pinned tabs and improve your productivity. Supports **Manifest V3**.

## 🎯 In Short

Tabs Pin helps you organize your pinned tabs in both Firefox and Google Chrome. Create custom work environments with your favorite sites, open them with a single click, and avoid duplicates thanks to smart detection.

## ✨ Key Features

- **Manifest V3**: Modern, secure, and compatible with the latest browser standards.
- **Quick Launch**: Open all your pinned tabs in one click.
- **Anti-Duplicate**: Smart detection prevents opening tabs already open.
- **Simplified Management**: Easily add, modify, and delete your tabs.
- **Direct Pinning**: Instantly pin the current tab from the popup.
- **Categories**: Organize tabs with fully customizable categories and emoji icon picker.
- **Drag & Drop**: Reorder tabs intuitively by dragging.
- **Multi-language**: Supports 14 languages including Arabic, German, English, Spanish, French, Hindi, Indonesian, Italian, Japanese, Korean, Dutch, Portuguese, Russian, Chinese.
- **Import/Export**: Save, restore, and share your configurations as JSON.
- **Adaptive Theme**: Automatic dark/light mode based on system preference.
- **Resilient Storage**: Built-in retry, caching, and health checks for reliable data persistence.

## 🛠️ Installation

### Recommended
- **Firefox**: [![Install for Firefox](https://img.shields.io/badge/Firefox-Install%20Now-FF7139?style=for-the-badge&logo=firefox)](https://addons.mozilla.org/fr/firefox/addon/tabs-pin-pin-tabs-manager/)
- **Chrome**: [![Available on Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/tabs-pin-gestionnaire-don/bnopgflgghbmdmcahibdcpbgmfgoknab)

### For Developers

1. Clone the repository:
```bash
git clone https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/
cd Tabs-Pin-Manager-Extension
```

2. Install dependencies:
```bash
npm install
```

3. Useful commands:
- **Development (Firefox)**: `npm run dev:firefox` (launch Firefox, reload on every change)
- **Development (Chrome)**: `npm run dev:chrome`, then load `build/chrome/` as an unpacked extension (run it again after changes)
- **Build (All)**: `npm run build` (generate both .zip packages in `web-ext-artifacts/`)
- **Build (Single)**: `npm run build:chrome` or `npm run build:firefox`
- **Lint**: `npm run lint` (web-ext compliance), `npm run lint:js` (ESLint) and `npm run lint:css` (Stylelint)
- **Unit tests**: `npm test` (Jest)
- **Interface tests**: `npm run test:e2e` (Playwright: loads the real extension in Chromium and drives the popup and options page, including an axe-core accessibility audit and keyboard checks). Run `npx playwright install chromium` once beforehand.

The shared `manifest.json` is never modified: each command copies the extension into
`build/<browser>/` with the browser-specific manifest (`scripts/prepare-manifest.js`).

## 🧱 Architecture

The extension is written as native **ES modules** (no bundler): each context has a single
entry module, and every dependency is an explicit `import`.

| Context | Entry | Modules |
|---|---|---|
| Background (Firefox event page / Chrome service worker) | `background/background.js` | `controller.js` (events and messages), `data-store.js` (saved tabs, categories, settings), `tab-actions.js` (open / pin / close browser tabs), `import-sanitizer.js`, `tab-utils.js` |
| Popup | `popup/main.js` | `popup.js` (`PopupManager`), `tab-actions.js`, `category-selection.js` |
| Options page | `options/main.js` | `options.js` (`OptionsManager`), `tab-editor.js`, `tab-ordering.js`, `category-editor.js`, `icon-picker.js`, `import-export.js` |
| Shared | `lib/` | `browser-api.js` (WebExtension namespace), `storage-manager.js`, `ui-utils.js`, `i18n-helper.js`, `domain-utils.js`, `default-categories.js`, `mixins.js` |

Page features are plain objects of methods composed into the page class with
`mixin()`, which throws if two features define the same method.
`tests/module-graph.test.js` checks that every import resolves and that no module is
left unreachable.

## 🚀 Quick Start

1. **Click the Tabs Pin icon** in your browser toolbar.
2. **Add your sites**: Use "Pin current tab" from the popup or open the Options page.
3. **Organize**: Assign categories and reorder tabs via drag & drop in Options.
4. **Launch all**: Click "Open X tabs" to open every configured tab at once.

## 🔒 Security & Privacy

- **Minimal Permissions**: Uses `tabs`, `storage` and `activeTab` only.
- **Manifest V3**: Enhanced security and privacy.
- **100% Local**: No data is transmitted externally.
- **Privacy-First & Open Source**.

## 📞 Support

- **Documentation**: See this README.
- **Issues & Suggestions**: [GitHub Issues](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/issues)
- **Email**: dev.alexandre.git [@] gmail.com

## 📝 License

Distributed under the GNU License. See [GPL-3.0 License](https://github.com/alexandre-leng/Tabs-Pin-Manager-Extension/tree/main?tab=GPL-3.0-1-ov-file#readme) for more information.

---

<div align="center">

### 🚀 **Tabs Pin - Transform your workflow!**

[![Install for Firefox](https://img.shields.io/badge/Firefox-Install%20Now-FF7139?style=for-the-badge&logo=firefox)](https://addons.mozilla.org/fr/firefox/addon/tabs-pin-pin-tabs-manager/)
[![Available on Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/tabs-pin-gestionnaire-don/bnopgflgghbmdmcahibdcpbgmfgoknab)

**Developed with ❤️ by Alexandre**

</div>
