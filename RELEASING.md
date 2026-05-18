# Releasing

This project uses Yarn 4 (Berry).

## Prerequisites

- Node.js >= 18
- `corepack enable`
- Registry authentication configured (`NPM_TOKEN` or scoped registry token)

## One-time setup

```bash
corepack enable
yarn install --immutable
yarn dlx @yarnpkg/sdks vscode
```

## Release checklist (v1.0.0 and next)

1. Confirm branch is up to date and clean.
2. Update `CHANGELOG.md` for the target version.
3. Bump version in `package.json`.
4. Run validation:

```bash
yarn install --immutable
yarn build
yarn test
yarn pack
```

5. Publish package:

```bash
yarn npm publish
```

6. Create git tag and push:

```bash
git tag v<version>
git push origin v<version>
```

7. Create release notes using `CHANGELOG.md`.

## GitHub Packages

Set scoped registry and token, then publish:

```bash
yarn npm publish
```

## GitLab Packages

Set project/group registry and token, then publish:

```bash
yarn npm publish
```
