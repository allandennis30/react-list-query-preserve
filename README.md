# react-list-query-preserve

Preserve query params de paginas de lista ao navegar para detalhes e voltar com React Router.

## Requisitos

- Node.js >= 18
- React 18+
- React Router v6.4+ (compativel com v7)
- Navegadores modernos com `URLSearchParams`, `Storage` e `Promise`

## Instalacao

```bash
yarn add react-list-query-preserve
```

## Uso rapido

```tsx
import { ListQueryPreserve } from "react-list-query-preserve";

const preserveRoutes = [
  {
    list: "/produtos",
    details: ["/produtos/:id", "/produtos/:id/editar"]
  },
  {
    list: "/usuarios",
    details: ["/usuarios/:id"]
  }
];

export function AppRoot() {
  return (
    <ListQueryPreserve
      routes={preserveRoutes}
      restoreStrategy="router"
      forceRestoreOnListMount
      preferCurrentSearch
    >
      <App />
    </ListQueryPreserve>
  );
}
```

## Hook

```tsx
import { usePreservedSearchParams } from "react-list-query-preserve";

const [searchParams, setSearchParams] = usePreservedSearchParams();
```

Alias disponivel:

```tsx
import { useEffectiveSearchParams } from "react-list-query-preserve";
```

## API

### `ListQueryPreserve`

- `routes: PreserveRouteConfig[]`
- `restoreStrategy?: "router" | "history" | "none"` (default: `"router"`)
- `forceRestoreOnListMount?: boolean` (default: `true`)
- `preferCurrentSearch?: boolean` (default: `true`)
- `storage?: Storage` (default: `window.sessionStorage`)
- `shouldPreserve?: (pathname: string) => boolean` (default: sempre `true`)
- `cleanupOnLeave?: boolean` (default: `false`)
- `keyPrefix?: string` (default: `"lqp"`)

### `usePreservedSearchParams(options?)`

- `storage?: Storage`
- `keyPrefix?: string`

## Comportamentos importantes

### `restoreStrategy="router"`

Restaura a query na URL ao retornar para a lista (`navigate(..., { replace: true })`).

### `restoreStrategy="history"`

Restaura com `window.history.replaceState` (fallback opcional browser-only).

### `restoreStrategy="none"`

Nao altera a URL. O hook retorna params preservados virtualmente.

### Regras de restauracao

- A lib salva snapshot no fluxo `list -> details`.
- A restauracao acontece apenas no fluxo `details -> list`.
- Se query atual ja estiver valida e `preferCurrentSearch=true`, nao sobrescreve.
- Com `forceRestoreOnListMount=true`, restaura quando a lista volta sem `page` e o snapshot tinha `page`.

### Estabilidade de `routes`

Evite arrays inline sem memoizacao:

```tsx
const preserveRoutes = useMemo(
  () => [{ list: "/produtos", details: ["/produtos/:id"] }],
  []
);
```

## Scripts

```bash
yarn
yarn build
yarn test
yarn release:check
yarn npm publish
```

## Publicacao

Para checklist completo de release/versionamento:

- `RELEASING.md`
- `CHANGELOG.md`

Publicacao (npm, GitHub Packages ou GitLab Packages):

```bash
yarn npm publish
```

## Desenvolvimento local

```bash
corepack enable
yarn install --immutable
yarn dlx @yarnpkg/sdks vscode
```