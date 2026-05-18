const DEFAULT_STORAGE_PREFIX = "lqp";
const SNAPSHOT_TTL_MS = 30 * 60 * 1000;

type SearchSnapshot = {
  search: string;
  ts: number;
};

export function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function normalizeSearch(search: string) {
  if (!search) {
    return "";
  }

  if (search === "?") {
    return "";
  }

  return search.startsWith("?") ? search : `?${search}`;
}

export function storageKey(pathname: string, keyPrefix = DEFAULT_STORAGE_PREFIX) {
  return `${keyPrefix}:${normalizePath(pathname)}`;
}

export function getStorage(storage?: Storage) {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function saveSearch(pathname: string, search: string, storage?: Storage, keyPrefix?: string) {
  const target = getStorage(storage);

  if (!target) {
    return;
  }

  const payload: SearchSnapshot = {
    search: normalizeSearch(search),
    ts: Date.now()
  };

  target.setItem(storageKey(pathname, keyPrefix), JSON.stringify(payload));
}

export function getSearch(pathname: string, storage?: Storage, keyPrefix?: string) {
  const target = getStorage(storage);

  if (!target) {
    return null;
  }

  const raw = target.getItem(storageKey(pathname, keyPrefix));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SearchSnapshot;

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

export function clearSearch(pathname: string, storage?: Storage, keyPrefix?: string) {
  const target = getStorage(storage);

  if (!target) {
    return;
  }

  target.removeItem(storageKey(pathname, keyPrefix));
}