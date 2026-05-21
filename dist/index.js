// src/components/ListQueryPreserve.tsx
import { useLayoutEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
import { matchPath } from "react-router-dom";
function matchesDetailRoute(pathname, details) {
  return details.some((route) => matchPath(route, pathname));
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
import { createContext, useContext } from "react";
var ListQueryPreserveContext = createContext(null);
function useListQueryPreserveContext() {
  return useContext(ListQueryPreserveContext);
}

// src/components/ListQueryPreserve.tsx
import { jsx } from "react/jsx-runtime";
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
  const location = useLocation();
  const navigate = useNavigate();
  const previousRef = useRef(null);
  const restoredRef = useRef(null);
  const normalizedRoutes = useMemo(() => normalizeRoutes(routes), [routes]);
  const contextValue = useMemo(
    () => ({ restoreStrategy, storage, keyPrefix, normalizedRoutes, shouldPreserve }),
    [restoreStrategy, storage, keyPrefix, normalizedRoutes, shouldPreserve]
  );
  useLayoutEffect(() => {
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
  return /* @__PURE__ */ jsx(ListQueryPreserveContext.Provider, { value: contextValue, children });
}

// src/hooks/usePreservedSearchParams.ts
import { useMemo as useMemo2 } from "react";
import { useLocation as useLocation2, useSearchParams } from "react-router-dom";
function usePreservedSearchParams(options) {
  const ctx = useListQueryPreserveContext();
  const location = useLocation2();
  const [searchParams, setSearchParams] = useSearchParams();
  const effectiveStorage = options?.storage ?? ctx?.storage;
  const effectiveKeyPrefix = options?.keyPrefix ?? ctx?.keyPrefix;
  const effectiveParams = useMemo2(() => {
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
export {
  ListQueryPreserve,
  useEffectiveSearchParams,
  usePreservedSearchParams
};
//# sourceMappingURL=index.js.map