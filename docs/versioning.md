# Versioning and releases

Tabs Pin follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html): `MAJOR.MINOR.PATCH`,
digits only, because Firefox and Chrome both require a numeric version in the manifest. `1.0.0` was
the first public release, there is no `0.x`.

| Bump | When | Examples |
|---|---|---|
| `MAJOR` | A change an existing user cannot absorb silently | stored data or a backup that older and newer versions cannot read, saved tabs losing their category, a supported browser being dropped, a new permission the user must approve |
| `MINOR` | A feature the user can see and use, compatible with everything already saved | adding or deleting a category, the first-run walkthrough, a new language, a new option |
| `PATCH` | Everything else | a bug fix, a user-interface or user-experience fix (layout, wording, a button, a message), accessibility, translations, performance, documentation, build and CI |

A user-interface fix is a fix, not a feature: making the layout right, rewording a
message or repairing a button ships as a **PATCH**, even when it took real work and
touches many files.

## How the changelog decides the number

The sections of the unreleased part of `CHANGELOG.md` decide the number:

- `⚠️ Breaking Changes` present: **MAJOR**
- otherwise `✨ New Features` present: **MINOR**
- only `🛠️ Fixes`, `📝 Documentation` and `🧹 Quality`: **PATCH**

When unsure, ask what the user gains: a capability they did not have before is a feature
(**MINOR**); something that already existed and now works as it should is a fix (**PATCH**).

## Rules that keep the repository and the two stores consistent

- One version per release, taken from `Unreleased` once, never reused or rewritten. A version
  published with too high a number stays published: the mistake is not fixed by going back, the
  following releases simply continue from the rule.
- `package.json`, `package-lock.json` and `manifest.json` carry the same version; a unit test fails
  when they differ.
- The manifest version is `X.Y.Z`, with no suffix: the Chrome Web Store only accepts dot-separated
  numbers, so one numeric format is used for both stores.
- The Git tag is `X.Y.Z` and the release title `vX.Y.Z`, both written by the Release workflow.
- A release ships what its notes describe: tests, CI or internal refactoring that changes nothing
  for the user do not, by themselves, justify a release.
- Release notes are written in English, in `CHANGELOG.md` and on the GitHub release page: they are
  read by users of both stores, whatever their language. The whole changelog is in English, older
  entries included, so a reader never meets a gap in language.

## Release procedure

1. Choose the number with the rules above. In doubt between two numbers, take the lower one: a fix
   shipped as a patch is never wrong, a minor bump for a fix promises a feature that does not exist.
2. Bump it in `package.json`, `package-lock.json` and `manifest.json`
   (`npm version x.y.z --no-git-tag-version`, then edit the manifest).
3. Move the `Unreleased` notes of `CHANGELOG.md` under `## [x.y.z] - date`, in English.
4. Push to `main`, then run the **Release** workflow (Actions → Release → Run workflow): it tests,
   builds both packages and publishes the GitHub release with the changelog section as notes.
5. Upload the two `.zip` files to addons.mozilla.org and the Chrome Web Store: the workflow only
   creates the GitHub release, publishing to the stores stays manual.
