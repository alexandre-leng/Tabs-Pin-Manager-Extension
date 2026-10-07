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

describe('locales', () => {
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
