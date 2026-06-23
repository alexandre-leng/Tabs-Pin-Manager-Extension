/**
 * Tests for category domain matching.
 */

const DomainUtils = require('../lib/domain-utils.js');

describe('DomainUtils', () => {
  test('matches same domain with different paths and queries', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://github.com/org/repo?tab=readme')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://github.com/settings/profile?x=1', categoryDomains)).toBe(true);
  });

  test('does not match sibling subdomains unless that exact subdomain is configured', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://github.com/org/repo')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://docs.github.com/en', categoryDomains)).toBe(false);
    expect(DomainUtils.isSameDomainOrSubdomain('https://gist.github.com/user/id', categoryDomains)).toBe(false);
  });

  test('does not require exact URL matching', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://example.com/a')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://example.com/completely/different/page', categoryDomains)).toBe(true);
  });

  test('does not match unrelated domains', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://github.com/org/repo')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://gitlab.com/org/repo', categoryDomains)).toBe(false);
  });

  test('matches exact subdomain on country-code domains', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://service.example.co.uk/a')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://service.example.co.uk/b', categoryDomains)).toBe(true);
    expect(DomainUtils.isSameDomainOrSubdomain('https://docs.example.co.uk/b', categoryDomains)).toBe(false);
  });

  test('keeps google services separated by exact subdomain', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://mail.google.com/mail/u/0/#inbox')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://mail.google.com/mail/u/1/#sent', categoryDomains)).toBe(true);
    expect(DomainUtils.isSameDomainOrSubdomain('https://drive.google.com/drive', categoryDomains)).toBe(false);
    expect(DomainUtils.isSameDomainOrSubdomain('https://calendar.google.com/calendar', categoryDomains)).toBe(false);
  });

  test('does not merge different hosted-site subdomains', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://alice.github.io/project')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://alice.github.io/other', categoryDomains)).toBe(true);
    expect(DomainUtils.isSameDomainOrSubdomain('https://bob.github.io/project', categoryDomains)).toBe(false);
  });

  test('treats www and bare domain as the same host', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://www.example.com/a')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://example.com/b', categoryDomains)).toBe(true);
  });

  test('handles localhost and IP hosts without throwing', () => {
    expect(DomainUtils.getDomainMatchKey('http://localhost:5173')).toBe('localhost');
    expect(DomainUtils.getDomainMatchKey('http://127.0.0.1:5173')).toBe('127.0.0.1');
  });

  test('ignores non-http URLs', () => {
    expect(DomainUtils.getDomainMatchKey('about:addons')).toBe(null);
  });
});
