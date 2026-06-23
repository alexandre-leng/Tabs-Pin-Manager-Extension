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
      const parts = host.split('.').filter(Boolean);
      if (parts.length <= 2) {
        return host;
      }

      const secondLevelPublicSuffixes = new Set([
        'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
        'com.au', 'net.au', 'org.au',
        'co.jp', 'com.br', 'com.mx', 'com.tr'
      ]);
      const suffix = parts.slice(-2).join('.');
      if (secondLevelPublicSuffixes.has(suffix) && parts.length >= 3) {
        return parts.slice(-3).join('.');
      }

      return parts.slice(-2).join('.');
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
