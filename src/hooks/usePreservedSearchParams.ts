import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { getSearch, normalizePath } from "../utils/storage";
import { useListQueryPreserveContext } from "../context/ListQueryPreserveContext";

type Options = {
  storage?: Storage;
  keyPrefix?: string;
};

export function usePreservedSearchParams(options?: Options) {
  const ctx = useListQueryPreserveContext();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const effectiveStorage = options?.storage ?? ctx?.storage;
  const effectiveKeyPrefix = options?.keyPrefix ?? ctx?.keyPrefix;

  const effectiveParams = useMemo(() => {
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

  return [effectiveParams, setSearchParams] as const;
}

/** @deprecated Use `usePreservedSearchParams`. */
export const useEffectiveSearchParams = usePreservedSearchParams;
