/**
 * The WebExtension API namespace: `browser` in Firefox, `chrome` in Chrome (whose MV3
 * APIs return promises). Resolved on each access, so tests can install a fake API at
 * any time.
 */

const resolve = () => globalThis.browser ?? globalThis.chrome;

export const browser = new Proxy({}, {
  get(_, property) {
    const api = resolve();
    if (!api) throw new Error('WebExtension API not available');
    return api[property];
  },
  has(_, property) {
    const api = resolve();
    return Boolean(api) && property in api;
  }
});
