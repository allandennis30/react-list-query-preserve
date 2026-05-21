"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ListQueryPreserve: () => ListQueryPreserve,
  useEffectiveSearchParams: () => useEffectiveSearchParams,
  usePreservedSearchParams: () => usePreservedSearchParams
});
module.exports = __toCommonJS(index_exports);

// src/components/ListQueryPreserve.tsx
var import_react2 = require("react");
var import_react_router_dom2 = require("react-router-dom");

// src/utils/storage.ts
var DEFAULT_STORAGE_PREFIX = "react-list-query-preserve:";
function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
function storageKey(pathname, keyPrefix = DEFAULT_STORAGE_PREFIX) {
  return `${keyPrefix}${normalizePath(pathname)}`;
}
function getStorage(storage) {
  if (storage) {
    return storage;
  }
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage;
}
function saveSearch(pathname, search, storage, keyPrefix) {
  const target = getStorage(storage);
  if (!target) {
    return;
  }
  target.setItem(storageKey(pathname, keyPrefix), search);
}
function getSearch(pathname, storage, keyPrefix) {
  const target = getStorage(storage);
  if (!target) {
    return null;
  }
  return target.getItem(storageKey(pathname, keyPrefix));
}
function clearSearch(pathname, storage, keyPrefix) {
  const target = getStorage(storage);
  if (!target) {
    return;
  }
  target.removeItem(storageKey(pathname, keyPrefix));
}

// src/utils/routes.ts
var import_react_router_dom = require("react-router-dom");
function matchesDetailRoute(pathname, details) {
  return details.some((route) => (0, import_react_router_dom.matchPath)(route, pathname));
}
function findPreserveConfig(pathname, routes) {
  const normalizedPath = normalizePath(pathname);
  return routes.find((route) => normalizePath(route.list) === normalizedPath);
}
function findListConfigForDetail(pathname, routes) {
  const normalizedPath = normalizePath(pathname);
  return routes.find((route) => matchesDetailRoute(normalizedPath, route.details));
}

// src/context/ListQueryPreserveContext.tsx
var import_react = require("react");
var ListQueryPreserveContext = (0, import_react.createContext)(null);
function useListQueryPreserveContext() {
  return (0, import_react.useContext)(ListQueryPreserveContext);
}

// src/components/ListQueryPreserve.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function normalizeRoutes(routes) {
  return routes.map((route) => ({
    list: normalizePath(route.list),
    details: route.details
  }));
}
function ListQueryPreserve({
  children,
  routes,
  restoreStrategy = "router",
  storage,
  shouldPreserve = () => true,
  cleanupOnLeave = false,
  keyPrefix
}) {
  const location = (0, import_react_router_dom2.useLocation)();
  const navigate = (0, import_react_router_dom2.useNavigate)();
  const previousRef = (0, import_react2.useRef)(null);
  const restoredRef = (0, import_react2.useRef)(null);
  const normalizedRoutes = (0, import_react2.useMemo)(() => normalizeRoutes(routes), [routes]);
  const contextValue = (0, import_react2.useMemo)(
    () => ({ restoreStrategy, storage, keyPrefix, normalizedRoutes, shouldPreserve }),
    [restoreStrategy, storage, keyPrefix, normalizedRoutes, shouldPreserve]
  );
  (0, import_react2.useLayoutEffect)(() => {
    const previous = previousRef.current;
    if (!previous) {
      previousRef.current = location;
      return;
    }
    const prevPath = normalizePath(previous.pathname);
    const currentPath = normalizePath(location.pathname);
    const alreadyRestored = restoredRef.current?.pathname === currentPath && restoredRef.current?.search === location.search;
    if (alreadyRestored) {
      previousRef.current = location;
      return;
    }
    const canPreservePrev = shouldPreserve(prevPath);
    const canPreserveCurrent = shouldPreserve(currentPath);
    const leavingConfig = findPreserveConfig(prevPath, normalizedRoutes);
    const isLeavingTrackedList = !!leavingConfig && matchesDetailRoute(currentPath, leavingConfig.details);
    if (canPreservePrev && isLeavingTrackedList) {
      if (previous.search) {
        saveSearch(prevPath, previous.search, storage, keyPrefix);
      } else {
        clearSearch(prevPath, storage, keyPrefix);
      }
    }
    const shouldRestoreURL = restoreStrategy === "router";
    const currentDetailConfig = findListConfigForDetail(currentPath, normalizedRoutes);
    const isCurrentDetail = !!currentDetailConfig;
    if (shouldRestoreURL && canPreserveCurrent && isCurrentDetail && !location.search) {
      const savedForDetail = getSearch(currentDetailConfig.list, storage, keyPrefix);
      if (savedForDetail) {
        const search = savedForDetail.startsWith("?") ? savedForDetail : `?${savedForDetail}`;
        restoredRef.current = { pathname: location.pathname, search };
        navigate(
          { pathname: location.pathname, search },
          { replace: true }
        );
        previousRef.current = location;
        return;
      }
    }
    const returningConfig = findPreserveConfig(currentPath, normalizedRoutes);
    const isReturningToList = !!returningConfig && matchesDetailRoute(prevPath, returningConfig.details);
    if (shouldRestoreURL && canPreserveCurrent && isReturningToList && !location.search) {
      const saved = getSearch(currentPath, storage, keyPrefix);
      if (saved) {
        const search = saved.startsWith("?") ? saved : `?${saved}`;
        if (!(location.pathname === currentPath && location.search === search)) {
          restoredRef.current = { pathname: currentPath, search };
          navigate(
            { pathname: currentPath, search },
            { replace: true }
          );
          previousRef.current = location;
          return;
        }
      }
    }
    const isTrackedList = normalizedRoutes.some((route) => route.list === currentPath);
    if (isTrackedList && !location.search && !isReturningToList) {
      clearSearch(currentPath, storage, keyPrefix);
    }
    if (cleanupOnLeave) {
      const returningConfigForPrev = findPreserveConfig(currentPath, normalizedRoutes);
      const leftListFlow = !!leavingConfig && !isLeavingTrackedList && !returningConfigForPrev;
      if (leftListFlow) {
        clearSearch(prevPath, storage, keyPrefix);
      }
    }
    previousRef.current = location;
  }, [
    cleanupOnLeave,
    keyPrefix,
    location,
    navigate,
    normalizedRoutes,
    restoreStrategy,
    shouldPreserve,
    storage
  ]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListQueryPreserveContext.Provider, { value: contextValue, children });
}

// src/hooks/usePreservedSearchParams.ts
var import_react3 = require("react");
var import_react_router_dom3 = require("react-router-dom");
function usePreservedSearchParams(options) {
  const ctx = useListQueryPreserveContext();
  const location = (0, import_react_router_dom3.useLocation)();
  const [searchParams, setSearchParams] = (0, import_react_router_dom3.useSearchParams)();
  const effectiveStorage = options?.storage ?? ctx?.storage;
  const effectiveKeyPrefix = options?.keyPrefix ?? ctx?.keyPrefix;
  const effectiveParams = (0, import_react3.useMemo)(() => {
    if (location.search) {
      return searchParams;
    }
    const preserved = getSearch(
      normalizePath(location.pathname),
      effectiveStorage,
      effectiveKeyPrefix
    );
    if (!preserved) {
      return searchParams;
    }
    return new URLSearchParams(preserved.startsWith("?") ? preserved.slice(1) : preserved);
  }, [location.pathname, location.search, effectiveStorage, effectiveKeyPrefix, searchParams]);
  return [effectiveParams, setSearchParams];
}
var useEffectiveSearchParams = usePreservedSearchParams;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ListQueryPreserve,
  useEffectiveSearchParams,
  usePreservedSearchParams
});
//# sourceMappingURL=index.cjs.map