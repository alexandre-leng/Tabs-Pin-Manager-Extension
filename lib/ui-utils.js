/**
 * Helpers shared by the popup and options pages.
 */

'use strict';

const UiUtils = {
  isValidUrl(url) {
    try {
      const { protocol } = new URL(url);
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  },

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  },

  /** Favicon providers in order of preference. */
  getFaviconServices(domain) {
    return [
      `https://www.google.com/s2/favicons?domain=${domain}&sz=16`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://${domain}/favicon.ico`
    ];
  },

  /**
   * Loads a favicon into `img`, trying each provider in turn.
   * Handlers are assigned as properties so calling this again on the same element
   * replaces them instead of stacking them.
   */
  loadFavicon(img, domain, { onLoad, onFail } = {}) {
    const services = UiUtils.getFaviconServices(domain);
    let index = 0;
    img.onerror = () => {
      index++;
      if (index < services.length) {
        img.src = services[index];
      } else if (onFail) {
        onFail();
      }
    };
    img.onload = () => { if (onLoad) onLoad(); };
    img.src = services[0];
  },

  /**
   * Shows a toast and (re)starts its auto-hide timer.
   * `manager` must expose `elements.toast*` and a `toastTimer` slot.
   */
  showToast(manager, type, icon, message, durationMs) {
    const { toast, toastIcon, toastMessage } = manager.elements;
    if (!toast) return;
    if (toastIcon) toastIcon.textContent = icon;
    if (toastMessage) toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(manager.toastTimer);
    manager.toastTimer = setTimeout(() => manager.hideToast(), durationMs);
  },

  hideToast(manager) {
    if (manager.elements.toast) manager.elements.toast.classList.remove('show');
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UiUtils;
} else {
  const scope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : self);
  scope.UiUtils = UiUtils;
}
