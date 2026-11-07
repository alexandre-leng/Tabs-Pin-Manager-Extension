# Backup format

**Options → Export** downloads a JSON file:

```json
{
  "tabs": [
    { "id": "tab_…", "url": "https://example.com/", "title": "Example",
      "category": "work", "enabled": true, "order": 0, "dateAdded": "2026-01-01T00:00:00.000Z" }
  ],
  "categories": [{ "id": "work", "name": "Work", "icon": "💼" }],
  "settings": { "lastOpened": "2026-01-01T00:00:00.000Z", "categoriesLocalized": true },
  "exportDate": "…",
  "version": "1.7.0"
}
```

`settings.lastOpened` is recorded each time every tab is opened. It is no longer displayed, but it
stays part of the format so an old backup keeps its information.

## Import

On import, the file **replaces** the current tabs and categories. It is validated first:

- tabs without an `http(s)` address are dropped, and the number of skipped tabs is reported;
- a category without a name is dropped, since it would block every later save;
- a missing icon becomes 📁;
- tabs of an unknown category go to the first one;
- duplicate IDs are fixed;
- only a valid past `lastOpened` date is kept from `settings`;
- container IDs (`cookieStoreId`) left by old backups are ignored.

Everything else in the file is ignored, and nothing outside the extension's own storage is read or
written.

## Limits

- There is no cap on categories: a backup holding any number imports, stays readable and stays
  editable, and new categories can always be added.
- The same address cannot be saved twice. Duplicates saved by older versions stay editable.
- A tab keeps its `enabled` flag: a disabled tab is not opened by "Open all".
