export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['build/**', 'node_modules/**', 'web-ext-artifacts/**', 'playwright-report/**', 'test-results/**'],
  rules: {
    // Flags selector order rather than real conflicts; reordering rules to satisfy it
    // would change the cascade
    'no-descending-specificity': null
  }
};
