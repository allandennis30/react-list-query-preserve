import { ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import { Location, useLocation, useNavigate } from "react-router-dom";
import { PreserveRouteConfig, RestoreStrategy, ShouldPreserve } from "../types";
import { clearSearch, getSearch, normalizePath, saveSearch } from "../utils/storage";
import { findPreserveConfig, matchesDetailRoute } from "../utils/routes";

type Props = {
  children: ReactNode;
  routes: PreserveRouteConfig[];
  restoreStrategy?: RestoreStrategy;
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
      restoreStrategy === "router" &&
      canPreserveCurrent &&
      isReturningToList &&
      !location.search &&
      !restoringRef.current
    ) {
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
      const leftListFlow =
        !!leavingConfig && !isLeavingTrackedList && prevPath !== currentPath;

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

  return <>{children}</>;
}
