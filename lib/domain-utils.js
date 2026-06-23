/**
 * Domain matching helpers for category-level tab actions.
 */

'use strict';

const DomainUtils = {
  getDomainMatchKey(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return null;
      }

      const host = urlObj.hostname.toLowerCase().replace(/^www\./, '');
      if (host === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')) {
        return host;
      }

      return host;
    } catch (error) {
      return null;
    }
  },

  isSameDomainOrSubdomain(url, domainKeys) {
    const domainKey = this.getDomainMatchKey(url);
    return Boolean(domainKey && domainKeys.has(domainKey));
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DomainUtils;
} else {
  const scope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : self);
  scope.DomainUtils = DomainUtils;
}
