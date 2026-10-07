import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'web-ext-artifacts/', 'build/'] },
  {
    // Extension code: ES modules. The WebExtension API comes from lib/browser-api.js,
    // so `browser` and `chrome` are deliberately not declared as globals here.
    files: ['background/**/*.js', 'popup/**/*.js', 'options/**/*.js', 'lib/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.serviceworker }
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
    files: ['scripts/**/*.js', 'tests/**/*.js', 'eslint.config.js', 'playwright.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.jest }
    },
    rules: { 'no-unused-vars': ['warn', { args: 'none' }], 'no-undef': 'error' }
  },
  {
    // Playwright tests: Node code plus callbacks evaluated in extension pages
    files: ['e2e/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.webextensions }
    },
    rules: { 'no-unused-vars': ['warn', { args: 'none' }], 'no-undef': 'error' }
  },
  {
    files: ['.web-ext-config.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node }
  }
];
