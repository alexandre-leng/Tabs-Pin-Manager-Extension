/**
 * Relative time ("3 hours ago"), localized by the browser's Intl API.
 */

const UNITS = [
  ['day', 86400000],
  ['hour', 3600000],
  ['minute', 60000]
];

/**
 * @param {Date|number} date
 * @param {{locale?: string, now?: number, justNow: string}} options - justNow is the
 *   text shown under a minute
 */
export function formatTimeAgo(date, { locale, now = Date.now(), justNow }) {
  const elapsed = now - date;
  for (const [unit, ms] of UNITS) {
    if (elapsed >= ms) {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.floor(elapsed / ms), unit);
    }
  }
  return justNow;
}
