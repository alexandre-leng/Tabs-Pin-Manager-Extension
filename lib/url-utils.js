/**
 * URL helpers shared by the background script and the pages.
 */

// Query parameters that identify a page on common sites (the others are tracking noise)
const IMPORTANT_PARAMS = ['view', 'mode', 'hl', 'id', 'q', 'query', 'search_query', 'p', 'article', 'page', 'v', 'list', 'tab'];

// Sites where every query parameter is significant
const FULL_QUERY_HOSTS = ['addons.mozilla.org', 'infomaniak.com'];

const hasFullQuery = host =>
  FULL_QUERY_HOSTS.some(known => host === known || host.endsWith(`.${known}`));

/** Fragment of single-page apps ("#/route", "#!/route"); other fragments are anchors. */
const routeOf = hash => (/^#!?\//.test(hash) ? hash : '');

const withoutTrailingSlash = path => path.replace(/\/$/, '');

/**
 * Key used to detect that a configured tab is already open: origin + path, plus the
 * query parameters that identify a page on common sites. Case-insensitive.
 */
export function normalizeUrl(url) {
  if (typeof url !== 'string' || !url) {
    return '';
  }
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();

    // A Google login page stands for the page it redirects to
    if (host === 'accounts.google.com' && urlObj.pathname.includes('ServiceLogin')) {
      const continueParam = urlObj.searchParams.get('continue');
      if (continueParam) {
        try {
          const target = new URL(continueParam);
          return normalizeUrl(target.origin + target.pathname);
        } catch {
          return host;
        }
      }
    }

    const origin = `${urlObj.protocol}//${host}${urlObj.port ? `:${urlObj.port}` : ''}`;
    const path = withoutTrailingSlash(urlObj.pathname);
    const route = routeOf(urlObj.hash);

    if (hasFullQuery(host)) {
      return (origin + path + urlObj.search + route).toLowerCase();
    }

    const kept = new URLSearchParams();
    for (const [key, value] of urlObj.searchParams) {
      if (IMPORTANT_PARAMS.includes(key.toLowerCase())) {
        kept.set(key, value);
      }
    }
    const query = String(kept) ? `?${kept}` : '';
    return (origin + path + query + route).toLowerCase();
  } catch (error) {
    console.warn(`Failed to normalize URL: ${url}`, error);
    return url.toLowerCase();
  }
}
