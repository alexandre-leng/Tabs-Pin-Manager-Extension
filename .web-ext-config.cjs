module.exports = {
  // Configuration pour la construction (packaging)
  build: {
    overwriteDest: true,
  },
  // Liste des fichiers à ignorer lors du packaging
  // Note: web-ext ignore déjà .git, node_modules, etc. par défaut
  ignoreFiles: [
    'scripts/',
    'build/',
    'dist/',
    'tests/',
    '.vscode/',
    '.cursor/',
    '*.md',
    '.cursorrules',
    '.gitignore',
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
  ],
};
