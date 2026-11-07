/**
 * User-created categories: readable IDs and the interface limit.
 */

import { createCategoryId } from '../lib/category-utils.js';

describe('createCategoryId', () => {
  test('builds a readable slug from the name', () => {
    expect(createCategoryId('Clients 2026', [])).toBe('clients-2026');
    expect(createCategoryId('Veille & Techno', [])).toBe('veille-techno');
    expect(createCategoryId('  Études / Recherche  ', [])).toBe('etudes-recherche');
  });

  test('adds a suffix when the slug is already taken', () => {
    expect(createCategoryId('Work', ['work'])).toBe('work-2');
    expect(createCategoryId('Work', ['work', 'work-2'])).toBe('work-3');
  });

  test('falls back to a generic ID for names without latin characters', () => {
    expect(createCategoryId('日本語', [])).toBe('category');
    expect(createCategoryId('日本語', ['category'])).toBe('category-2');
    expect(createCategoryId('---', [])).toBe('category');
  });

  test('keeps the ID short and inside the 20 category limit', () => {
    expect(createCategoryId('a'.repeat(100), [])).toHaveLength(40);
    expect(createCategoryId('Clients '.repeat(10), [])).not.toMatch(/-$/);
    });
});
