import { decodeLabel, toUnicodeHost } from '../lib/punycode.js';

test.each([
  ['xn--bcher-kva.ch', 'bücher.ch'],
  ['xn--mnchen-3ya.de', 'münchen.de'],
  ['www.xn--fiqs8s.cn', 'www.中国.cn'],
  ['xn--80ak6aa92e.com', 'аррӏе.com'],
  ['example.com', 'example.com']
])('decodes %s', (host, expected) => {
  expect(toUnicodeHost(host)).toBe(expected);
});

test('keeps a label that is not valid punycode', () => {
  expect(toUnicodeHost('xn--!!.com')).toBe('xn--!!.com');
  expect(() => decodeLabel('!!')).toThrow();
});
