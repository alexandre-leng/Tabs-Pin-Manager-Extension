/**
 * Copies the extension files into build/<target>/ with the browser-specific manifest.
 * Only the listed paths are shipped, so dev files never end up in a package.
 * Usage: node scripts/stage.js [firefox|chrome]
 */

const fs = require('fs');
const path = require('path');
const { buildManifest } = require('./prepare-manifest');

const ROOT = path.join(__dirname, '..');
const SHIPPED_PATHS = ['_locales', 'assets', 'background', 'lib', 'options', 'popup', 'shared.css', 'LICENSE'];

function stageDir(target) {
  return path.join(ROOT, 'build', target);
}

function stage(target) {
  const manifest = buildManifest(target);
  const dir = stageDir(target);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const entry of SHIPPED_PATHS) {
    fs.cpSync(path.join(ROOT, entry), path.join(dir, entry), { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return dir;
}

if (require.main === module) {
  const target = process.argv[2] || 'firefox';
  console.log(`Staged ${target} extension in ${path.relative(ROOT, stage(target))}/`);
}

module.exports = { stage, stageDir, SHIPPED_PATHS };
