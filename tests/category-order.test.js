import { sortCategoriesForList, sortCategoriesForSelection } from '../popup/category-order.js';

const categories = [
  { id: 'work', name: 'Work' },
  { id: 'development', name: 'Development' },
  { id: 'quotes', name: 'Devis' },
  { id: 'personal', name: 'Personal' }
];
const names = list => list.map(c => c.name);

test('puts the default Development category last while nothing is saved, matching by ID', () => {
  expect(names(sortCategoriesForList(categories, []))).toEqual(['Devis', 'Personal', 'Work', 'Development']);
});

test('sorts the main list alphabetically once tabs are saved', () => {
  expect(names(sortCategoriesForList(categories, [{ category: 'work' }])))
    .toEqual(['Development', 'Devis', 'Personal', 'Work']);
});

test('lists categories that have tabs first in the selection dialog', () => {
  const tabs = [{ category: 'work' }, { category: 'personal' }];
  expect(names(sortCategoriesForSelection(categories, tabs))).toEqual(['Personal', 'Work', 'Development', 'Devis']);
});
