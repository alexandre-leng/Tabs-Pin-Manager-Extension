/**
 * Punycode decoding (RFC 3492), to show internationalized domain names ("xn--…")
 * as the user wrote them. Display only: comparisons keep the ASCII hostname.
 */

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;

function adapt(delta, numPoints, firstTime) {
  let k = 0;
  delta = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  delta += Math.floor(delta / numPoints);
  while (delta > ((BASE - T_MIN) * T_MAX) >> 1) {
    delta = Math.floor(delta / (BASE - T_MIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - T_MIN + 1) * delta) / (delta + SKEW));
}

function digitOf(code) {
  if (code >= 48 && code <= 57) return code - 22; // 0-9 -> 26-35
  if (code >= 65 && code <= 90) return code - 65; // A-Z
  if (code >= 97 && code <= 122) return code - 97; // a-z
  throw new Error('Invalid punycode');
}

/** Decodes one punycode label (without its "xn--" prefix). */
export function decodeLabel(input) {
  const separator = input.lastIndexOf('-');
  const output = separator > 0 ? [...input.slice(0, separator)].map(c => c.codePointAt(0)) : [];
  let n = 128;
  let bias = 72;
  let i = 0;
  for (let index = separator > 0 ? separator + 1 : 0; index < input.length;) {
    const oldI = i;
    for (let w = 1, k = BASE; ; k += BASE) {
      if (index >= input.length) throw new Error('Invalid punycode');
      const digit = digitOf(input.charCodeAt(index++));
      i += digit * w;
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
    }
    bias = adapt(i - oldI, output.length + 1, oldI === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
}

/** Hostname with its "xn--" labels decoded; labels that fail to decode are kept. */
export function toUnicodeHost(hostname) {
  return hostname.split('.').map(label => {
    if (!label.toLowerCase().startsWith('xn--')) return label;
    try {
      return decodeLabel(label.slice(4));
    } catch {
      return label;
    }
  }).join('.');
}
