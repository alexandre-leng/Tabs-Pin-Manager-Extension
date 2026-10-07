/**
 * Every locale must define the same message keys, with the same placeholders, as English.
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../_locales');
const load = (lang) => JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, lang, 'messages.json'), 'utf8'));
// Placeholder names are local to each message; the positional arguments ($1, $2...) must match
const placeholders = (entry) => Object.values(entry.placeholders || {}).map(p => p.content).sort();

const en = load('en');
const languages = fs.readdirSync(LOCALES_DIR).filter(lang => lang !== 'en');

const SOURCE_DIRS = ['background', 'lib', 'popup', 'options'];
const source = SOURCE_DIRS
  .flatMap(dir => fs.readdirSync(path.join(__dirname, '..', dir))
    .filter(file => /\.(js|html)$/.test(file))
    .map(file => fs.readFileSync(path.join(__dirname, '..', dir, file), 'utf8')))
  .concat(fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf8'))
  .join('\n');
// Default category names are looked up dynamically by category ID
require('../lib/default-categories.js');
const dynamicKeys = new Set(
  globalThis.DefaultCategories.getDefaultCategories({ getMessage: () => '' }).map(category => category.id)
);

describe('locales', () => {
  test('every message requested by the extension exists in English', () => {
    const requested = new Set([
      ...[...source.matchAll(/getMessage\(\s*'(\w+)'/g)].map(m => m[1]),
      ...[...source.matchAll(/data-i18n(?:-title|-placeholder)?="(\w+)"/g)].map(m => m[1]),
      ...[...source.matchAll(/__MSG_(\w+)__/g)].map(m => m[1])
    ]);
    expect([...requested].filter(key => !(key in en))).toEqual([]);
  });

  test('every English key is used by the extension', () => {
    const unused = Object.keys(en).filter(key =>
      !dynamicKeys.has(key) &&
      !source.includes(`'${key}'`) && !source.includes(`"${key}"`) && !source.includes(`__MSG_${key}__`));
    expect(unused).toEqual([]);
  });

  test.each(languages)('%s has every English key and no extra ones', (lang) => {
    const keys = Object.keys(load(lang));
    expect(Object.keys(en).filter(k => !keys.includes(k))).toEqual([]);
    expect(keys.filter(k => !(k in en))).toEqual([]);
  });

  test.each(languages)('%s only references declared placeholders', (lang) => {
    const messages = load(lang);
    for (const [key, entry] of Object.entries(messages)) {
      const declared = Object.keys(entry.placeholders || {}).map(n => n.toUpperCase());
      const used = [...entry.message.matchAll(/\$([A-Za-z_]+)\$/g)].map(m => m[1].toUpperCase());
      expect({ key, undeclared: used.filter(n => !declared.includes(n)) }).toEqual({ key, undeclared: [] });
    }
  });

  test.each(languages)('%s uses the same placeholders as English', (lang) => {
    const messages = load(lang);
    for (const key of Object.keys(en)) {
      expect({ key, placeholders: placeholders(messages[key]) })
        .toEqual({ key, placeholders: placeholders(en[key]) });
    }
  });
});
