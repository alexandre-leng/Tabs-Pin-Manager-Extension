/**
 * Domain matching helpers for category-level tab actions.
 */

/** Hostname without "www.", or null for non-http(s) or unparsable URLs. */
export function getDomainMatchKey(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return urlObj.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function isSameDomainOrSubdomain(url, domainKeys) {
  const domainKey = getDomainMatchKey(url);
  return Boolean(domainKey && domainKeys.has(domainKey));
}
