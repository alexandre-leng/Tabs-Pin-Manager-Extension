import { generateTabId, isValidUrl, sortTabConfigs } from '../lib/tab-utils.js';
import { normalizeUrl } from '../lib/url-utils.js';

describe('sortTabConfigs', () => {
  test('orders by `order`, then ordered before unordered, then by dateAdded', () => {
    const sorted = sortTabConfigs([
      { id: 'late', dateAdded: '2024-02-01' },
      { id: 'two', order: 2 },
      { id: 'early', dateAdded: '2024-01-01' },
      { id: 'one', order: 1 }
    ]);
    expect(sorted.map(t => t.id)).toEqual(['one', 'two', 'early', 'late']);
  });
});

describe('normalizeUrl', () => {
  test('ignores trailing slash, case, fragment and tracking parameters', () => {
    expect(normalizeUrl('https://Example.com/Path/?utm_source=x#top')).toBe(normalizeUrl('https://example.com/path'));
  });

  test('keeps page-identifying parameters', () => {
    expect(normalizeUrl('https://youtube.com/watch?v=1&search_query=a'))
      .not.toBe(normalizeUrl('https://youtube.com/watch?v=1&search_query=b'));
  });

  test('returns an empty string for missing URLs', () => {
    expect(normalizeUrl(undefined)).toBe('');
  });
});

test('isValidUrl accepts only http(s)', () => {
  expect(isValidUrl('https://a.com')).toBe(true);
  expect(isValidUrl('javascript:alert(1)')).toBe(false);
  expect(isValidUrl('not a url')).toBe(false);
});

test('generateTabId returns distinct ids', () => {
  expect(generateTabId()).not.toBe(generateTabId());
});

describe('normalizeUrl: page identity', () => {
  test('tells apart pages that differ by an identifying parameter', () => {
    expect(normalizeUrl('https://www.youtube.com/watch?v=AAA')).not.toBe(normalizeUrl('https://www.youtube.com/watch?v=BBB'));
  });

  test('tells apart single-page-app routes but not plain anchors', () => {
    expect(normalizeUrl('https://app.example.com/#/a')).not.toBe(normalizeUrl('https://app.example.com/#/b'));
    expect(normalizeUrl('https://example.com/page#top')).toBe(normalizeUrl('https://example.com/page'));
  });

  test('lowercases the redirect target of a Google login page', () => {
    expect(normalizeUrl('https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2FMail.google.com%2Fmail%2F'))
      .toBe('https://mail.google.com/mail');
  });
});
