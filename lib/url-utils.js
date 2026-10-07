/**
 * URL helpers shared by the background script and the pages.
 */

/**
 * Key used to detect that a configured tab is already open: origin + path, plus the
 * query parameters that identify a page on common sites.
 */
export function normalizeUrl(url) {
  if (typeof url !== 'string' || !url) {
    return '';
  }
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase(); // Get hostname once
    
    // Special handling for common redirect patterns
    if (host === 'accounts.google.com' && urlObj.pathname.includes('ServiceLogin')) {
      const continueParam = urlObj.searchParams.get('continue');
      if (continueParam) {
        try {
          const targetUrl = new URL(decodeURIComponent(continueParam));
          return targetUrl.origin + targetUrl.pathname.replace(/\/$/, '');
        } catch (e) {
          return host; // Fallback to hostname if 'continue' is malformed
        }
      }
    }
    
    // For specific sensitive hosts, keep query parameters as they might be significant for distinguishing pages
    if (host === 'addons.mozilla.org' || 
        host === 'login.infomaniak.com' || 
        host === 'kdrive.infomaniak.com' || // Added for kDrive as well
        host.endsWith('.infomaniak.com')) { // Broader rule for all infomaniak subdomains
      return (urlObj.origin + urlObj.pathname + urlObj.search).toLowerCase();
    }
    
    // For other URLs, normalize by removing query parameters and fragments
    // but keep important path information and a whitelist of common important params
    let normalized = urlObj.origin + urlObj.pathname.replace(/\/$/, '');
    
    const importantParams = ['view', 'mode', 'hl', 'id', 'q', 'query', 'search_query', 'p', 'article', 'page']; // Expanded whitelist
    const keptParams = new URLSearchParams();
    let hasKeptParams = false;
    for (const [key, value] of urlObj.searchParams) {
      if (importantParams.includes(key.toLowerCase())) {
        keptParams.set(key, value);
        hasKeptParams = true;
      }
    }
    
    if (hasKeptParams) {
      normalized += '?' + keptParams.toString();
    }
    
    return normalized.toLowerCase();
  } catch (error) {
    console.warn(`Failed to normalize URL: ${url}`, error);
    return url.toLowerCase(); // Fallback to original URL (lowercase) if parsing fails
  }
}
