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
var import_react = require("react");
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

// src/components/ListQueryPreserve.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var DEFAULT_SHOULD_PRESERVE = () => true;
function normalizeRoutes(routes) {
  return routes.map((route) => ({
    list: normalizePath(route.list),
    details: route.details
  }));
}
function scheduleUnlock(restoringRef) {
  try {
    Promise.resolve().then(() => {
      restoringRef.current = false;
    });
  } catch {
    setTimeout(() => {
      restoringRef.current = false;
    }, 0);
  }
}
function ListQueryPreserve({
  children,
  routes,
  restoreStrategy = "router",
  storage,
  shouldPreserve = DEFAULT_SHOULD_PRESERVE,
  cleanupOnLeave = false,
  keyPrefix
}) {
  const location = (0, import_react_router_dom2.useLocation)();
  const navigate = (0, import_react_router_dom2.useNavigate)();
  const previousRef = (0, import_react.useRef)(null);
  const restoringRef = (0, import_react.useRef)(false);
  const normalizedRoutes = (0, import_react.useMemo)(() => normalizeRoutes(routes), [routes]);
  (0, import_react.useLayoutEffect)(() => {
    const previous = previousRef.current;
    if (!previous) {
      previousRef.current = location;
      return;
    }
    const prevPath = normalizePath(previous.pathname);
    const currentPath = normalizePath(location.pathname);
    const canPreservePrev = shouldPreserve(prevPath);
    const canPreserveCurrent = shouldPreserve(currentPath);
    const leavingConfig = findPreserveConfig(prevPath, normalizedRoutes);
    const isLeavingTrackedList = !!leavingConfig && matchesDetailRoute(currentPath, leavingConfig.details);
    if (canPreservePrev && isLeavingTrackedList && previous.search) {
      saveSearch(prevPath, previous.search, storage, keyPrefix);
    }
    const currentDetailConfig = findListConfigForDetail(currentPath, normalizedRoutes);
    const isCurrentDetail = !!currentDetailConfig;
    if (restoreStrategy === "router" && canPreserveCurrent && isCurrentDetail && !location.search && !restoringRef.current) {
      const savedForDetail = getSearch(currentDetailConfig.list, storage, keyPrefix);
      if (savedForDetail) {
        const normalizedSaved = savedForDetail.startsWith("?") ? savedForDetail : `?${savedForDetail}`;
        restoringRef.current = true;
        navigate(
          {
            pathname: location.pathname,
            search: normalizedSaved
          },
          { replace: true }
        );
        scheduleUnlock(restoringRef);
      }
    }
    const returningConfig = findPreserveConfig(currentPath, normalizedRoutes);
    const isReturningToList = !!returningConfig && matchesDetailRoute(prevPath, returningConfig.details);
    if (restoreStrategy === "router" && canPreserveCurrent && isReturningToList && !location.search && !restoringRef.current) {
      const saved = getSearch(currentPath, storage, keyPrefix);
      if (saved) {
        const search = saved.startsWith("?") ? saved : `?${saved}`;
        if (!(location.pathname === currentPath && location.search === search)) {
          restoringRef.current = true;
          navigate(
            {
              pathname: currentPath,
              search
            },
            { replace: true }
          );
          scheduleUnlock(restoringRef);
        }
      }
    }
    const isTrackedList = normalizedRoutes.some((route) => route.list === currentPath);
    if (isTrackedList && !location.search && !isReturningToList) {
      clearSearch(currentPath, storage, keyPrefix);
    }
    if (cleanupOnLeave) {
      const leftListFlow = !!leavingConfig && !isLeavingTrackedList && prevPath !== currentPath;
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}

// src/hooks/usePreservedSearchParams.ts
var import_react2 = require("react");
var import_react_router_dom3 = require("react-router-dom");
function usePreservedSearchParams(options) {
  const location = (0, import_react_router_dom3.useLocation)();
  const [searchParams, setSearchParams] = (0, import_react_router_dom3.useSearchParams)();
  const effectiveParams = (0, import_react2.useMemo)(() => {
    if (location.search) {
      return searchParams;
    }
    const preserved = getSearch(normalizePath(location.pathname), options?.storage, options?.keyPrefix);
    if (!preserved) {
      return searchParams;
    }
    return new URLSearchParams(preserved.startsWith("?") ? preserved.slice(1) : preserved);
  }, [location.pathname, location.search, options?.keyPrefix, options?.storage, searchParams]);
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