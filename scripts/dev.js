/**
 * Runs the extension in Firefox from the staging dir and re-stages on every source change;
 * web-ext then reloads the extension.
 * Usage: node scripts/dev.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { stage, SHIPPED_PATHS } = require('./stage');

const ROOT = path.join(__dirname, '..');
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
