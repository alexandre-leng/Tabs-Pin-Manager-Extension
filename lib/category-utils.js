/**
 * Categories created by the user: a readable, unique ID.
 */

const MAX_ID_LENGTH = 40;

/** Accents removed, anything but a latin letter or a digit becomes a dash. */
function slugify(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, MAX_ID_LENGTH)
    .replace(/^-+|-+$/g, '');
}

/**
 * ID of a new category, readable in an exported backup (`clients-2026`), unique
 * among `existingIds`: a "-2", "-3"... suffix is added when the slug is taken.
 * @param {string} name
 * @param {Iterable<string>} [existingIds]
 */
export function createCategoryId(name, existingIds = []) {
  const taken = new Set(existingIds);
  const base = slugify(name) || 'category';
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}
