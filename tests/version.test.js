/**
 * The release workflow names the zips after package.json, while browsers read the
 * version from manifest.json: both must stay in sync.
 */

import fs from 'node:fs';

const readJson = file => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
const pkg = readJson('../package.json');
const manifest = readJson('../manifest.json');

test('package.json and manifest.json declare the same version', () => {
  expect(manifest.version).toBe(pkg.version);
});
