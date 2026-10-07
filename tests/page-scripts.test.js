/**
 * The popup and options pages are split across several classic scripts that extend the
 * page class. Guard against a script missing from the HTML or a method defined twice
 * (the later script would silently override the earlier one).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function pageScripts(htmlFile) {
  const html = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
  const dir = path.dirname(htmlFile);
  return [...html.matchAll(/<script src="([^"]+)"/g)]
    .map(m => path.join(dir, m[1]))
    .filter(file => file.startsWith(dir + path.sep));
}

function methodNames(source) {
  const names = [];
  for (const m of source.matchAll(/^ {2}(?:async )?([A-Za-z_]\w*)\(.*\) \{$/gm)) names.push(m[1]);
  for (const m of source.matchAll(/\.prototype\.(\w+) = function/g)) names.push(m[1]);
  return names;
}

describe.each([
  ['options/options.html', 'options'],
  ['popup/popup.html', 'popup']
])('%s', (htmlFile, dir) => {
  const scripts = pageScripts(htmlFile);

  test('loads every script of its directory', () => {
    const onDisk = fs.readdirSync(path.join(ROOT, dir))
      .filter(f => f.endsWith('.js'))
      .map(f => path.join(dir, f));
    expect([...scripts].sort()).toEqual(onDisk.sort());
  });

  test('defines each method only once', () => {
    const seen = {};
    const duplicates = [];
    for (const file of scripts) {
      for (const name of methodNames(fs.readFileSync(path.join(ROOT, file), 'utf8'))) {
        if (name === 'constructor') continue;
        if (seen[name]) duplicates.push(`${name} (${seen[name]} and ${file})`);
        seen[name] = file;
      }
    }
    expect(duplicates).toEqual([]);
  });
});
