// src/components/ListQueryPreserve.tsx
import { useEffect, useMemo, useRef } from "react";
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

// src/components/ListQueryPreserve.tsx
import { Fragment, jsx } from "react/jsx-runtime";
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
  const location = useLocation();
  const navigate = useNavigate();
  const previousRef = useRef(null);
  const restoringRef = useRef(false);
  const normalizedRoutes = useMemo(() => normalizeRoutes(routes), [routes]);
  useEffect(() => {
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
    if (isTrackedList && !location.search) {
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
  return /* @__PURE__ */ jsx(Fragment, { children });
}

// src/hooks/usePreservedSearchParams.ts
import { useMemo as useMemo2 } from "react";
import { useLocation as useLocation2, useSearchParams } from "react-router-dom";
function usePreservedSearchParams(options) {
  const location = useLocation2();
  const [searchParams, setSearchParams] = useSearchParams();
  const effectiveParams = useMemo2(() => {
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
export {
  ListQueryPreserve,
  useEffectiveSearchParams,
  usePreservedSearchParams
};
//# sourceMappingURL=index.js.map