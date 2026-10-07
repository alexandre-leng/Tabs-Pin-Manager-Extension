/**
 * Every class styled in the CSS must be used by the HTML or the scripts, so dead
 * styles do not pile up again.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const source = ['background', 'lib', 'popup', 'options']
  .flatMap(dir => fs.readdirSync(path.join(ROOT, dir))
    .filter(file => /\.(js|html)$/.test(file))
    .map(file => read(path.join(dir, file))))
  .join('\n');

test.each(['shared.css', 'popup/popup.css', 'options/options.css'])('%s only styles used classes', (file) => {
  // Strip comments and url(...) so file names are not taken for classes
  const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '');
  const classes = new Set([...css.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map(m => m[1]));
  const unused = [...classes].filter(name => !new RegExp(`\\b${name}\\b`).test(source));
  expect(unused).toEqual([]);
});
