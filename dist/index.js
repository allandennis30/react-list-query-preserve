// src/components/ListQueryPreserve.tsx
import { useLayoutEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// src/utils/storage.ts
var DEFAULT_STORAGE_PREFIX = "lqp";
var SNAPSHOT_TTL_MS = 30 * 60 * 1e3;
function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
function normalizeSearch(search) {
  if (!search) {
    return "";
  }
  if (search === "?") {
    return "";
  }
  return search.startsWith("?") ? search : `?${search}`;
}
function storageKey(pathname, keyPrefix = DEFAULT_STORAGE_PREFIX) {
  return `${keyPrefix}:${normalizePath(pathname)}`;
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
  const payload = {
    search: normalizeSearch(search),
    ts: Date.now()
  };
  target.setItem(storageKey(pathname, keyPrefix), JSON.stringify(payload));
}
function getSearch(pathname, storage, keyPrefix) {
  const target = getStorage(storage);
  if (!target) {
    return null;
  }
  const raw = target.getItem(storageKey(pathname, keyPrefix));
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.search !== "string" || typeof parsed.ts !== "number") {
      return normalizeSearch(raw);
    }
    if (Date.now() - parsed.ts > SNAPSHOT_TTL_MS) {
      return null;
    }
    return normalizeSearch(parsed.search);
  } catch {
    return normalizeSearch(raw);
  }
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
function hasEssentialPage(search) {
  const normalized = normalizeSearch(search);
  if (!normalized) {
    return false;
  }
  const params = new URLSearchParams(normalized.slice(1));
  return params.has("page");
}
function shouldRestoreSearch(currentSearch, savedSearch, forceRestoreOnListMount, preferCurrentSearch) {
  const normalizedCurrent = normalizeSearch(currentSearch);
  const normalizedSaved = normalizeSearch(savedSearch);
  if (!normalizedSaved || normalizedCurrent === normalizedSaved) {
    return false;
  }
  if (preferCurrentSearch && normalizedCurrent) {
    return false;
  }
  if (!forceRestoreOnListMount) {
    return !normalizedCurrent;
  }
  if (hasEssentialPage(normalizedSaved) && !hasEssentialPage(normalizedCurrent)) {
    return true;
  }
  return !normalizedCurrent;
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
  forceRestoreOnListMount = true,
  preferCurrentSearch = true,
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
  useLayoutEffect(() => {
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
    if (canPreserveCurrent && isReturningToList && !restoringRef.current) {
      const saved = getSearch(currentPath, storage, keyPrefix);
      if (saved && shouldRestoreSearch(location.search, saved, forceRestoreOnListMount, preferCurrentSearch)) {
        restoringRef.current = true;
        if (restoreStrategy === "router") {
          navigate(
            {
              pathname: currentPath,
              search: saved
            },
            { replace: true }
          );
        } else if (restoreStrategy === "history" && typeof window !== "undefined") {
          window.history.replaceState({}, "", `${currentPath}${saved}`);
        }
        scheduleUnlock(restoringRef);
      }
    }
    if (cleanupOnLeave) {
      const isTrackedList = normalizedRoutes.some((route) => route.list === prevPath);
      const isCurrentInSameFlow = !!findPreserveConfig(currentPath, normalizedRoutes) || isLeavingTrackedList;
      if (isTrackedList && !isCurrentInSameFlow && prevPath !== currentPath) {
        clearSearch(prevPath, storage, keyPrefix);
      }
    }
    previousRef.current = location;
  }, [
    cleanupOnLeave,
    forceRestoreOnListMount,
    keyPrefix,
    location,
    navigate,
    normalizedRoutes,
    preferCurrentSearch,
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