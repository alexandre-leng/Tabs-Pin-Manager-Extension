/** Verbose diagnostics are opt-in: set DEBUG to true while debugging. */
const DEBUG = false;

export const log = (...args) => {
  if (DEBUG) console.log(...args);
};
