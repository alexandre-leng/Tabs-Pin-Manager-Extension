const globals = require('globals');

const extensionGlobals = {
  browser: 'readonly',
  chrome: 'readonly',
  StorageManager: 'readonly',
  DomainUtils: 'readonly',
  UiUtils: 'readonly',
  I18nHelper: 'readonly',
  DefaultCategories: 'readonly',
  // Page classes, split across several scripts of the same page
  OptionsManager: 'writable',
  PopupManager: 'writable',
  ICON_DATA: 'writable'
};

module.exports = [
  { ignores: ['node_modules/', 'web-ext-artifacts/', 'build/'] },
  {
    files: ['background/**/*.js', 'popup/**/*.js', 'options/**/*.js', 'lib/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.serviceworker, ...globals.node, ...extensionGlobals }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-shadow': 'warn',
      'no-return-await': 'warn',
      'no-useless-catch': 'error',
      'no-prototype-builtins': 'error',
      // Keep functions small enough to read and test
      complexity: ['warn', 20],
      'max-lines-per-function': ['warn', { max: 120, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    files: ['scripts/**/*.js', 'tests/**/*.js', 'eslint.config.js', '.web-ext-config.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest }
    },
    rules: { 'no-unused-vars': ['warn', { args: 'none' }], 'no-undef': 'error' }
  }
];
