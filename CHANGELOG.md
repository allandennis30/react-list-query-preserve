# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [1.0.3] - 2026-05-18

### Added

- `restoreStrategy` now supports `"router" | "history" | "none"`.
- New options: `forceRestoreOnListMount` and `preferCurrentSearch`.
- Direction-aware restore flow for modal/list transitions.
- Snapshot payload in storage now uses `{ search, ts }` with internal TTL.
- Legacy compatibility for old string-only stored values.

### Fixed

- Prevent list pagination flash/reset in `navigate('/list')` return flows.
- Avoid redundant restores when current and saved search are equivalent.

## [1.0.2] - 2026-05-18

### Fixed

- Prevent list pagination flicker on detail return.

## [1.0.1] - 2026-05-18

### Fixed

- Include `dist/` artifacts in repository for GitHub tag installation compatibility.
- Ensure runtime and TypeScript declarations are available when consuming via `github:<user>/<repo>#tag`.

## [1.0.0] - 2026-05-18

### Added

- `ListQueryPreserve` component to preserve list query params across list/detail flows.
- `usePreservedSearchParams` hook and `useEffectiveSearchParams` alias.
- Restore strategies for list/detail flows.
- Configurable storage adapter (`storage?: Storage`) with SSR-safe fallback.
- Conditional preservation via `shouldPreserve(pathname)`.
- Optional stale cleanup with `cleanupOnLeave`.
- No-op navigate guard plus restore loop protection.
- Utility modules for path normalization, route matching, and storage keying.
- Yarn 4/Berry setup with `node-modules` linker.
- CI pipelines for GitHub Actions and GitLab CI.
- Unit and integration test coverage with Vitest.

[1.0.3]: https://github.com/allandennis30/react-list-query-preserve/releases/tag/v1.0.3
[1.0.2]: https://github.com/allandennis30/react-list-query-preserve/releases/tag/v1.0.2
[1.0.1]: https://github.com/allandennis30/react-list-query-preserve/releases/tag/v1.0.1
[1.0.0]: https://github.com/allandennis30/react-list-query-preserve/releases/tag/v1.0.0