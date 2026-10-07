/**
 * The release workflow names the zips after package.json, while browsers read the
 * version from manifest.json: both must stay in sync.
 */

const pkg = require('../package.json');
const manifest = require('../manifest.json');

test('package.json and manifest.json declare the same version', () => {
  expect(manifest.version).toBe(pkg.version);
});
