import { ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import { Location, useLocation, useNavigate } from "react-router-dom";
import { PreserveRouteConfig, RestoreStrategy, ShouldPreserve } from "../types";
import { clearSearch, getSearch, normalizePath, normalizeSearch, saveSearch } from "../utils/storage";
import { findPreserveConfig, matchesDetailRoute } from "../utils/routes";

type Props = {
  children: ReactNode;
  routes: PreserveRouteConfig[];
  restoreStrategy?: RestoreStrategy;
  forceRestoreOnListMount?: boolean;
  preferCurrentSearch?: boolean;
  storage?: Storage;
  shouldPreserve?: ShouldPreserve;
  cleanupOnLeave?: boolean;
  keyPrefix?: string;
};

const DEFAULT_SHOULD_PRESERVE: ShouldPreserve = () => true;

function normalizeRoutes(routes: PreserveRouteConfig[]) {
  return routes.map((route) => ({
    list: normalizePath(route.list),
    details: route.details
  }));
}

function hasEssentialPage(search: string) {
  const normalized = normalizeSearch(search);

  if (!normalized) {
    return false;
  }

  const params = new URLSearchParams(normalized.slice(1));
  return params.has("page");
}

function shouldRestoreSearch(currentSearch: string, savedSearch: string, forceRestoreOnListMount: boolean, preferCurrentSearch: boolean) {
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

function scheduleUnlock(restoringRef: React.MutableRefObject<boolean>) {
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

export function ListQueryPreserve({
  children,
  routes,
  restoreStrategy = "router",
  forceRestoreOnListMount = true,
  preferCurrentSearch = true,
  storage,
  shouldPreserve = DEFAULT_SHOULD_PRESERVE,
  cleanupOnLeave = false,
  keyPrefix
}: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const previousRef = useRef<Location | null>(null);
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
    const isLeavingTrackedList =
      !!leavingConfig && matchesDetailRoute(currentPath, leavingConfig.details);

    if (canPreservePrev && isLeavingTrackedList && previous.search) {
      saveSearch(prevPath, previous.search, storage, keyPrefix);
    }

    const returningConfig = findPreserveConfig(currentPath, normalizedRoutes);
    const isReturningToList =
      !!returningConfig && matchesDetailRoute(prevPath, returningConfig.details);

    if (
      canPreserveCurrent &&
      isReturningToList &&
      !restoringRef.current
    ) {
      const saved = getSearch(currentPath, storage, keyPrefix);

      if (
        saved &&
        shouldRestoreSearch(location.search, saved, forceRestoreOnListMount, preferCurrentSearch)
      ) {
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

  return <>{children}</>;
}