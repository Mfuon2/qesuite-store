// Bun's test environment has no IndexedDB (it's not a browser) — this
// polyfill is the standard companion for testing Dexie-backed code and is
// preloaded (see ../../../bunfig.toml) before any test file runs.
import 'fake-indexeddb/auto'
