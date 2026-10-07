/**
 * The extension is made of ES modules: each page and the background have one entry
 * module, and everything else is reached through explicit imports. Checks that every
 * import resolves to a file and that no extension module is left unreachable.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const SOURCE_DIRS = ['background', 'lib', 'popup', 'options'];
const ENTRIES = ['background/background.js', 'popup/main.js', 'options/main.js'];

const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const importsOf = file => [...read(file).matchAll(/^import\s[^'"]*['"]([^'"]+)['"];?$/gm)]
  .map(m => path.normalize(path.join(path.dirname(file), m[1])));

test.each([['popup/popup.html', 'popup/main.js'], ['options/options.html', 'options/main.js']])(
  '%s loads only its entry module', (html, entry) => {
    const scripts = [...read(html).matchAll(/<script\b([^>]*)>/g)].map(m => m[1].trim());
    expect(scripts).toEqual([`type="module" src="${path.basename(entry)}"`]);
  });

test('every import resolves and every module is reachable from an entry point', () => {
  const reached = new Set();
  const missing = [];
  const visit = file => {
    if (reached.has(file)) return;
    if (!fs.existsSync(path.join(ROOT, file))) {
      missing.push(file);
      return;
    }
    reached.add(file);
    importsOf(file).forEach(visit);
  };
  ENTRIES.forEach(visit);

  const allModules = SOURCE_DIRS.flatMap(dir => fs.readdirSync(path.join(ROOT, dir))
    .filter(name => name.endsWith('.js'))
    .map(name => path.join(dir, name)));

  expect(missing).toEqual([]);
  expect(allModules.filter(file => !reached.has(file))).toEqual([]);
});
