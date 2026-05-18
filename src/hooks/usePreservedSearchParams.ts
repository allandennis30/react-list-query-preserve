import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { getSearch, normalizePath } from "../utils/storage";

type Options = {
  storage?: Storage;
  keyPrefix?: string;
};

export function usePreservedSearchParams(options?: Options) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const effectiveParams = useMemo(() => {
    if (location.search) {
      return searchParams;
    }

    const preserved = getSearch(normalizePath(location.pathname), options?.storage, options?.keyPrefix);

    if (!preserved) {
      return searchParams;
    }

    return new URLSearchParams(preserved.startsWith("?") ? preserved.slice(1) : preserved);
  }, [location.pathname, location.search, options?.keyPrefix, options?.storage, searchParams]);

  return [effectiveParams, setSearchParams] as const;
}

export const useEffectiveSearchParams = usePreservedSearchParams;
