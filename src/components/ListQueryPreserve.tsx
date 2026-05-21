import { ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import { Location, useLocation, useNavigate } from "react-router-dom";
import { PreserveRouteConfig, RestoreStrategy, ShouldPreserve } from "../types";
import { clearSearch, getSearch, normalizePath, saveSearch } from "../utils/storage";
import { findListConfigForDetail, findPreserveConfig, matchesDetailRoute } from "../utils/routes";
import {
  ListQueryPreserveContext,
  ListQueryPreserveContextValue
} from "../context/ListQueryPreserveContext";

type Props = {
  children: ReactNode;
  routes: PreserveRouteConfig[];
  restoreStrategy?: RestoreStrategy;
  storage?: Storage;
  shouldPreserve?: ShouldPreserve;
  cleanupOnLeave?: boolean;
  keyPrefix?: string;
};

function normalizeRoutes(routes: PreserveRouteConfig[]) {
  return routes.map((route) => ({
    list: normalizePath(route.list),
    details: route.details
  }));
}

export function ListQueryPreserve({
  children,
  routes,
  restoreStrategy = "router",
  storage,
  shouldPreserve = () => true,
  cleanupOnLeave = false,
  keyPrefix
}: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const previousRef = useRef<Location | null>(null);
  const restoredRef = useRef<{ pathname: string; search: string } | null>(null);

  const normalizedRoutes = useMemo(() => normalizeRoutes(routes), [routes]);

  const contextValue = useMemo<ListQueryPreserveContextValue>(
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

    // Skip if this render was caused by our own restore navigate
    const alreadyRestored =
      restoredRef.current?.pathname === currentPath &&
      restoredRef.current?.search === location.search;

    if (alreadyRestored) {
      previousRef.current = location;
      return;
    }

    const canPreservePrev = shouldPreserve(prevPath);
    const canPreserveCurrent = shouldPreserve(currentPath);

    const leavingConfig = findPreserveConfig(prevPath, normalizedRoutes);
    const isLeavingTrackedList =
      !!leavingConfig && matchesDetailRoute(currentPath, leavingConfig.details);

    // Persist idempotently: save if had search, clear if search was empty
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

    if (
      shouldRestoreURL &&
      canPreserveCurrent &&
      isCurrentDetail &&
      !location.search
    ) {
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
    const isReturningToList =
      !!returningConfig && matchesDetailRoute(prevPath, returningConfig.details);

    if (
      shouldRestoreURL &&
      canPreserveCurrent &&
      isReturningToList &&
      !location.search
    ) {
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
      const leftListFlow =
        !!leavingConfig &&
        !isLeavingTrackedList &&
        !returningConfigForPrev;

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

  return (
    <ListQueryPreserveContext.Provider value={contextValue}>
      {children}
    </ListQueryPreserveContext.Provider>
  );
}
