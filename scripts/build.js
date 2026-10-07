/**
 * Packages the extension for one browser into web-ext-artifacts/.
 * Usage: node scripts/build.js [chrome|firefox]
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { stage } from './stage.js';

const { version } = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', 'package.json'), 'utf8'));

const target = process.argv[2] || 'chrome';
const filename = `tabs-pin-${target}-v${version}.zip`;

try {
  const sourceDir = stage(target);
  execFileSync('npx', [
    'web-ext', 'build',
    '--source-dir', sourceDir,
    '--artifacts-dir', path.join(import.meta.dirname, '..', 'web-ext-artifacts'),
    '--filename', filename,
    '--overwrite-dest'
  ], { stdio: 'inherit' });
  console.log(`Built ${filename}`);
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
