/**
 * Helpers shared by the popup and options pages.
 */

import { browser } from './browser-api.js';
import { toUnicodeHost } from './punycode.js';

// Element that had the focus before each open dialog, to give it back on close
const returnFocusTo = new WeakMap();

/**
 * Selector finding an element again after its list was re-rendered: the card it
 * belongs to (data-tab-id / data-category-id) plus its own classes.
 */
function locatorOf(element) {
  const card = element?.closest?.('[data-tab-id], [data-category-id]');
  if (!card) return null;
  const attribute = card.hasAttribute('data-tab-id') ? 'data-tab-id' : 'data-category-id';
  const cardSelector = `[${attribute}="${CSS.escape(card.getAttribute(attribute))}"]`;
  if (element === card) return cardSelector;
  const classes = [...element.classList].map(name => `.${CSS.escape(name)}`).join('');
  return classes ? `${cardSelector} ${classes}` : cardSelector;
}

export const UiUtils = {
  /**
   * Shows a modal overlay and moves the keyboard focus into it.
   * @param {HTMLElement} overlay
   * @param {HTMLElement} [focusTarget] - element focused once the dialog is visible
   */
  showDialog(overlay, focusTarget) {
    const opener = document.activeElement;
    returnFocusTo.set(overlay, { opener, locator: locatorOf(opener) });
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.classList.add('show');
      (focusTarget || overlay.querySelector('input, select, textarea, button'))?.focus();
    });
  },

  /** Hides a modal overlay (after its fade-out) and gives the focus back. */
  hideDialog(overlay, fadeMs = 350) {
    overlay.classList.remove('show');
    setTimeout(() => {
      if (!overlay.classList.contains('show')) overlay.style.display = 'none';
    }, fadeMs);
    const saved = returnFocusTo.get(overlay);
    returnFocusTo.delete(overlay);
    UiUtils.restoreFocus(saved?.opener, saved?.locator);
  },

  /**
   * Focuses `element`, or, when a re-render replaced it, the element now matching
   * `locator` (see locatorOf).
   */
  restoreFocus(element, locator = locatorOf(element)) {
    if (element?.isConnected) {
      element.focus();
      return;
    }
    const replacement = locator && document.querySelector(locator);
    if (replacement && !replacement.disabled) replacement.focus();
  },

  /**
   * Makes a clickable non-button element usable from the keyboard: focusable with
   * Tab, activated with Enter or Space.
   * @param {HTMLElement} element
   * @param {Function} onActivate
   * @param {{label?: string, role?: string|null}} [options] - role defaults to "button";
   *   pass null when the element contains other controls
   */
  makeActivatable(element, onActivate, { label, role = 'button' } = {}) {
    element.tabIndex = 0;
    if (role) element.setAttribute('role', role);
    if (label) element.setAttribute('aria-label', label);
    element.addEventListener('keydown', event => {
      if (event.target === element && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onActivate(event);
      }
    });
  },

  isValidUrl(url) {
    try {
      const { protocol } = new URL(url);
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  },

  /**
   * Sends a message to the background script, retrying when it cannot be reached
   * (e.g. while its service worker starts). Rejects when every attempt fails or no
   * response comes back; an { success: false } response is returned as is.
   */
  async sendMessage(message, attempts = 3) {
    for (let attempt = 1; ; attempt++) {
      try {
        const response = await browser.runtime.sendMessage(message);
        if (!response) throw new Error('No response from background script');
        return response;
      } catch (error) {
        if (attempt >= attempts) {
          throw new Error(error.message.includes('Receiving end does not exist')
            ? 'Background script is not responding. Please reload the extension.'
            : `Could not reach the background script after ${attempts} attempts: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100 * 2 ** (attempt - 1)));
      }
    }
  },

  /** ASCII hostname, used to compare domains and to fetch favicons. */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  },

  /** Hostname as people read it (internationalized names decoded), for display. */
  displayDomain(url) {
    try {
      return toUnicodeHost(new URL(url).hostname);
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
