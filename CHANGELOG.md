# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

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
