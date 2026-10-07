/**
 * Packages the extension for one browser into web-ext-artifacts/.
 * Usage: node scripts/build.js [chrome|firefox]
 */

const { execFileSync } = require('child_process');
const path = require('path');
const { stage } = require('./stage');
const { version } = require('../package.json');

const target = process.argv[2] || 'chrome';
const filename = `tabs-pin-${target}-v${version}.zip`;

try {
  const sourceDir = stage(target);
  execFileSync('npx', [
    'web-ext', 'build',
    '--source-dir', sourceDir,
    '--artifacts-dir', path.join(__dirname, '..', 'web-ext-artifacts'),
    '--filename', filename,
    '--overwrite-dest'
  ], { stdio: 'inherit' });
  console.log(`Built ${filename}`);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
