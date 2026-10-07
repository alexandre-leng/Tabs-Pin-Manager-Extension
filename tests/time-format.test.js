import { formatTimeAgo } from '../lib/time-format.js';

const now = Date.UTC(2026, 0, 10, 12, 0, 0);
const ago = ms => now - ms;

test.each([
  ['en', 3 * 3600000, '3 hours ago'],
  ['fr', 3 * 86400000, 'il y a 3 jours'],
  ['de', 5 * 60000, 'vor 5 Minuten'],
  ['ja', 2 * 86400000, '一昨日'],
  ['en', 86400000, 'yesterday']
])('%s: %d ms ago -> %s', (locale, elapsed, expected) => {
  expect(formatTimeAgo(ago(elapsed), { locale, now, justNow: 'now' })).toBe(expected);
});

test('uses the given text under a minute', () => {
  expect(formatTimeAgo(ago(20000), { locale: 'fr', now, justNow: "À l'instant" })).toBe("À l'instant");
});
