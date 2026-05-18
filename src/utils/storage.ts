const DEFAULT_STORAGE_PREFIX = "react-list-query-preserve:";

export function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function storageKey(pathname: string, keyPrefix = DEFAULT_STORAGE_PREFIX) {
  return `${keyPrefix}${normalizePath(pathname)}`;
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

  target.setItem(storageKey(pathname, keyPrefix), search);
}

export function getSearch(pathname: string, storage?: Storage, keyPrefix?: string) {
  const target = getStorage(storage);

  if (!target) {
    return null;
  }

  return target.getItem(storageKey(pathname, keyPrefix));
}

export function clearSearch(pathname: string, storage?: Storage, keyPrefix?: string) {
  const target = getStorage(storage);

  if (!target) {
    return;
  }

  target.removeItem(storageKey(pathname, keyPrefix));
}
