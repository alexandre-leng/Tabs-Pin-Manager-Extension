# Accessibility

Tabs Pin targets WCAG 2.1 level AA on the popup and the options page.

## What the interface guarantees

- **Keyboard**: every card and control is reachable with Tab and activated with Enter or Space.
  Reordering tabs also works with the arrow buttons, so drag and drop is never required.
- **Focus**: saving, deleting, reordering a tab or closing a dialog returns the focus to the element
  that opened it, or to the card that took its place.
- **Dialogs**: announced as dialogs, they take the focus when they open, and Escape closes only the
  topmost one (the icon picker over the category editor, for instance).
- **Screen readers**: messages (toasts) are announced, icons that carry no text are hidden, and
  accessible names include the visible text, as WCAG 2.5.3 requires, so voice control can target a
  card by reading what is on it.
- **Layout**: the language and direction follow the browser (Arabic is right to left); dark mode,
  high contrast and reduced motion preferences are respected.

## Automated audit

`e2e/accessibility.spec.js` loads the real extension in Chromium and runs axe-core with the WCAG 2.0
and 2.1 A and AA tags on:

- the popup, with data and empty;
- the options page;
- the tab form and the category editor with the icon picker;
- the popup category picker;
- the options page with 40 categories, to check a long grid;

each in light and dark themes. A violation fails `npm run test:e2e` and therefore CI.

Contrast tokens live in `shared.css` (`--text-secondary`, `--text-muted`) and in `options.css`
(`--danger-text` for the delete action): they are chosen to pass AA on the surfaces of both themes.
