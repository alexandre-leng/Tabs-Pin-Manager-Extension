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

  test('matches subdomains against the same site domain', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://github.com/org/repo')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://docs.github.com/en', categoryDomains)).toBe(true);
    expect(DomainUtils.isSameDomainOrSubdomain('https://gist.github.com/user/id', categoryDomains)).toBe(true);
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

  test('handles common second-level public suffixes', () => {
    const categoryDomains = new Set([
      DomainUtils.getDomainMatchKey('https://service.example.co.uk/a')
    ]);

    expect(DomainUtils.isSameDomainOrSubdomain('https://docs.example.co.uk/b', categoryDomains)).toBe(true);
    expect(DomainUtils.isSameDomainOrSubdomain('https://docs.other.co.uk/b', categoryDomains)).toBe(false);
  });

  test('ignores non-http URLs', () => {
    expect(DomainUtils.getDomainMatchKey('about:addons')).toBe(null);
  });
});
