import { describe, expect, it, vi } from "vitest";
import { clearSearch, getSearch, getStorage, normalizePath, normalizeSearch, saveSearch, storageKey } from "../src/utils/storage";

describe("storage utils", () => {
  it("normalizes trailing slash", () => {
    expect(normalizePath("/products/")).toBe("/products");
    expect(normalizePath("/")).toBe("/");
  });

  it("normalizes search", () => {
    expect(normalizeSearch("page=2")).toBe("?page=2");
    expect(normalizeSearch("?page=2")).toBe("?page=2");
    expect(normalizeSearch("?")).toBe("");
  });

  it("builds storage key", () => {
    expect(storageKey("/products/")).toBe("lqp:/products");
    expect(storageKey("/products", "custom")).toBe("custom:/products");
  });

  it("supports save/get/clear with custom storage", () => {
    const memory = new Map<string, string>();
    const storage: Storage = {
      length: 0,
      clear: () => memory.clear(),
      getItem: (key) => memory.get(key) ?? null,
      key: () => null,
      removeItem: (key) => {
        memory.delete(key);
      },
      setItem: (key, value) => {
        memory.set(key, value);
      }
    };

    saveSearch("/products", "?page=2", storage);
    expect(getSearch("/products", storage)).toBe("?page=2");

    clearSearch("/products", storage);
    expect(getSearch("/products", storage)).toBeNull();
  });

  it("returns null storage on SSR", () => {
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", undefined);

    expect(getStorage()).toBeNull();

    vi.stubGlobal("window", originalWindow);
  });

  it("supports legacy string payload", () => {
    const memory = new Map<string, string>();
    const storage: Storage = {
      length: 0,
      clear: () => memory.clear(),
      getItem: (key) => memory.get(key) ?? null,
      key: () => null,
      removeItem: (key) => {
        memory.delete(key);
      },
      setItem: (key, value) => {
        memory.set(key, value);
      }
    };

    storage.setItem("lqp:/products", "?page=9");
    expect(getSearch("/products", storage)).toBe("?page=9");
  });
});