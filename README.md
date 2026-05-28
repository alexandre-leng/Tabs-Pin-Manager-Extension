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
- **Firefox Multi-Account Containers**: Open tabs in specific containers (Firefox).
- **Multi-language**: Supports 14 languages including Arabic, German, English, Spanish, French, Hindi, Indonesian, Italian, Japanese, Korean, Dutch, Portuguese, Russian, Chinese.
- **Import/Export**: Save, restore, and share your configurations as JSON.
- **Adaptive Theme**: Automatic dark/light mode based on system preference.
- **Resilient Storage**: Built-in retry, caching, and health checks for reliable data persistence.

## 🛠️ Installation

### Recommended
- **Firefox**: [![Install for Firefox](https://img.shields.io/badge/Firefox-Install%20Now-FF7139?style=for-the-badge&logo=firefox)](https://addons.mozilla.org/fr/firefox/addon/tabs-pin-pin-tabs-manager/)
- **Chrome**: [![Available on Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/tabs-pin-pin-tabs-manager)

### For Developers

1. Clone the repository:
```bash
git clone https://github.com/alexandre-leng/Tabs-Pin-Firefox-Extension/
cd "Tabs Pin Firefox extension"
```

2. Install dependencies:
```bash
npm install
```

3. Useful commands:
- **Development (Firefox)**: `npm run dev:firefox` (launch Firefox with auto-reload)
- **Development (Chrome)**: `npm run dev:chrome` (prepare manifest for Chrome manual loading)
- **Build (All)**: `npm run build` (generate both .zip packages in `web-ext-artifacts/`)
- **Build (Single)**: `npm run build:chrome` or `npm run build:firefox`
- **Lint**: `npm run lint` (verify extension compliance via web-ext)
- **Test**: `npm test` (run unit tests with Jest)

## 🚀 Quick Start

1. **Click the Tabs Pin icon** in your browser toolbar.
2. **Add your sites**: Use "Pin current tab" from the popup or open the Options page.
3. **Organize**: Assign categories and reorder tabs via drag & drop in Options.
4. **Launch all**: Click "Open X tabs" to open every configured tab at once.
5. **Containers** (Firefox): Assign a container to any tab in Options; it will open in that container automatically.

## 🔒 Security & Privacy

- **Minimal Permissions**: Uses `tabs`, `storage`, `activeTab` (+ `contextualIdentities` for Firefox Container support).
- **Manifest V3**: Enhanced security and privacy.
- **100% Local**: No data is transmitted externally.
- **Privacy-First & Open Source**.

## 📞 Support

- **Documentation**: See this README.
- **Issues & Suggestions**: [GitHub Issues](https://github.com/alexandre-leng/Tabs-Pin-Firefox-Extension/issues)
- **Email**: dev.alexandre.git [@] gmail.com

## 📝 License

Distributed under the GNU License. See [GPL-3.0 License](https://github.com/alexandre-leng/Tabs-Pin-Firefox-Extension/tree/main?tab=GPL-3.0-1-ov-file#readme) for more information.

---

<div align="center">

### 🚀 **Tabs Pin - Transform your workflow!**

[![Install for Firefox](https://img.shields.io/badge/Firefox-Install%20Now-FF7139?style=for-the-badge&logo=firefox)](https://addons.mozilla.org/fr/firefox/addon/tabs-pin-pin-tabs-manager/)
[![Available on Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/tabs-pin-pin-tabs-manager)

**Developed with ❤️ by Alexandre**

</div>
