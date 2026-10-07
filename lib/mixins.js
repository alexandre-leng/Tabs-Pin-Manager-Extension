/**
 * Adds the methods of each source object to `target` (a class prototype), refusing
 * to silently replace an existing method: a name clash between feature modules
 * fails loudly at load time instead.
 */
export function mixin(target, ...sources) {
  for (const source of sources) {
    for (const name of Object.keys(source)) {
      if (name in target) {
        throw new Error(`mixin: "${name}" is already defined`);
      }
      Object.defineProperty(target, name, {
        value: source[name], writable: true, configurable: true, enumerable: false
      });
    }
  }
  return target;
}
