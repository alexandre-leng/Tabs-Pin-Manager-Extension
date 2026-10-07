/**
 * Runs the extension in Firefox from the staging dir and re-stages on every source change;
 * web-ext then reloads the extension.
 * Usage: node scripts/dev.js
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { stage, SHIPPED_PATHS } from './stage.js';

const ROOT = path.join(import.meta.dirname, '..');
const sourceDir = stage('firefox');

let timer = null;
const restage = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      stage('firefox');
    } catch (error) {
      console.error('Staging failed:', error.message);
    }
  }, 200);
};
for (const entry of [...SHIPPED_PATHS, 'manifest.json']) {
  fs.watch(path.join(ROOT, entry), { recursive: true }, restage);
}

const webExt = spawn('npx', ['web-ext', 'run', '--source-dir', sourceDir], { stdio: 'inherit' });
webExt.on('exit', code => process.exit(code ?? 0));
