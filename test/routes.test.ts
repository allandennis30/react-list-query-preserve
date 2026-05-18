import { describe, expect, it } from "vitest";
import { findPreserveConfig, matchesDetailRoute } from "../src/utils/routes";

describe("routes utils", () => {
  it("matches detail route patterns", () => {
    expect(matchesDetailRoute("/products/10", ["/products/:id"])) .toBe(true);
    expect(matchesDetailRoute("/users/10", ["/products/:id"])) .toBe(false);
  });

  it("finds list config with normalized path", () => {
    const routes = [{ list: "/products/", details: ["/products/:id"] }];
    expect(findPreserveConfig("/products", routes)).toEqual(routes[0]);
  });
});
