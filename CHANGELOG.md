# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [1.1.0] - 2026-05-21

### Fixed

- `restoreStrategy="memory"` now respects its documented contract: URL is never altered by the component; `usePreservedSearchParams` is the sole interface for reading preserved params virtually.
- Stale search is no longer restored after the user clears all filters and navigates to a detail: leaving a tracked list with no search now clears storage instead of leaving old data behind.
- URL restore is now idempotent via an identity-based guard (`restoredRef`), replacing the fragile microtask timing (`scheduleUnlock`). Eliminates the risk of duplicate `navigate` calls under React 18 concurrent features and React StrictMode.
- `cleanupOnLeave` no longer clears storage when transitioning directly between two tracked list routes; it only clears when leaving the list/detail flow entirely.

### Changed

- `usePreservedSearchParams` now reads `storage` and `keyPrefix` from the `ListQueryPreserve` context when available, making the hook aware of the configured strategy. Passing `options` still overrides context values (backward compatible).
- Internal `ListQueryPreserveContext` created to propagate configuration from component to hook.

### Deprecated

- `useEffectiveSearchParams` — use `usePreservedSearchParams` instead. The alias remains exported for backward compatibility.

[1.1.0]: https://github.com/allandennis30/react-list-query-preserve/releases/tag/v1.1.0

## [1.0.0] - 2026-05-18

### Added

- `ListQueryPreserve` component to preserve list query params across list/detail flows.
- `usePreservedSearchParams` hook and `useEffectiveSearchParams` alias.
- Restore strategies: `"router"` (URL restore) and `"memory"` (effective params only).
- Configurable storage adapter (`storage?: Storage`) with SSR-safe fallback.
- Conditional preservation via `shouldPreserve(pathname)`.
- Optional stale cleanup with `cleanupOnLeave`.
- No-op navigate guard plus restore loop protection.
- Utility modules for path normalization, route matching, and storage keying.
- Yarn 4/Berry setup with `node-modules` linker.
- CI pipelines for GitHub Actions and GitLab CI.
- Unit and integration test coverage with Vitest.

[1.0.0]: https://github.com/<org>/react-list-query-preserve/releases/tag/v1.0.0

## [1.0.1] - 2026-05-18

### Fixed

- Include `dist/` artifacts in repository for GitHub tag installation compatibility.
- Ensure runtime and TypeScript declarations are available when consuming via `github:<user>/<repo>#tag`.

[1.0.1]: https://github.com/allandennis30/react-list-query-preserve/releases/tag/v1.0.1
