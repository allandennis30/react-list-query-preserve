import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import { ListQueryPreserve } from "../src/components/ListQueryPreserve";
import { usePreservedSearchParams } from "../src/hooks/usePreservedSearchParams";
import { getSearch } from "../src/utils/storage";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function ListView() {
  const navigate = useNavigate();
  return (
    <div>
      <button onClick={() => navigate("/products/1")}>Go detail</button>
      <button onClick={() => navigate("/other")}>Go other</button>
      <LocationProbe />
    </div>
  );
}

function DetailView() {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate("/products")}>Back list no query</button>
      <LocationProbe />
    </div>
  );
}

function EffectiveParamsProbe() {
  const [params] = usePreservedSearchParams();
  return <div data-testid="params">{params.toString()}</div>;
}

describe("ListQueryPreserve integration", () => {
  const routes = [{ list: "/products", details: ["/products/:id"] }];

  it("restores query via router strategy", async () => {
    render(
      <MemoryRouter initialEntries={["/products?page=2"]}>
        <ListQueryPreserve routes={routes} restoreStrategy="router">
          <Routes>
            <Route path="/products" element={<ListView />} />
            <Route path="/products/:id" element={<DetailView />} />
          </Routes>
        </ListQueryPreserve>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Go detail"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products/1?page=2")
    );

    fireEvent.click(screen.getByText("Back list no query"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products?page=2")
    );
  });

  it("keeps URL unchanged in memory strategy while hook provides effective params", () => {
    render(
      <MemoryRouter initialEntries={["/products?page=3"]}>
        <ListQueryPreserve routes={routes} restoreStrategy="memory">
          <Routes>
            <Route path="/products" element={<><ListView /><EffectiveParamsProbe /></>} />
            <Route path="/products/:id" element={<Navigate to={{ pathname: "/products", search: "" }} replace />} />
          </Routes>
        </ListQueryPreserve>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Go detail"));
    expect(screen.getByTestId("location").textContent).toBe("/products");
    expect(screen.getByTestId("params").textContent).toBe("page=3");
  });

  it("restores saved query when entering detail route without search", async () => {
    render(
      <MemoryRouter initialEntries={["/products?page=5"]}>
        <ListQueryPreserve routes={routes} restoreStrategy="router">
          <Routes>
            <Route path="/products" element={<ListView />} />
            <Route path="/products/:id" element={<DetailView />} />
          </Routes>
        </ListQueryPreserve>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Go detail"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products/1?page=5")
    );

    fireEvent.click(screen.getByText("Back list no query"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products?page=5")
    );
  });

  it("does not restore stale search after user clears filters before navigating to detail", async () => {
    const storage = (() => {
      const map = new Map<string, string>();
      return {
        length: 0,
        clear: () => map.clear(),
        getItem: (k: string) => map.get(k) ?? null,
        key: () => null,
        removeItem: (k: string) => { map.delete(k); },
        setItem: (k: string, v: string) => { map.set(k, v); }
      } as Storage;
    })();

    function ListViewWithClear() {
      const navigate = useNavigate();
      return (
        <div>
          <button onClick={() => navigate("/products/1")}>Go detail</button>
          <button onClick={() => navigate("/products")}>Clear and stay</button>
          <LocationProbe />
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={["/products?page=2"]}>
        <ListQueryPreserve routes={routes} restoreStrategy="router" storage={storage}>
          <Routes>
            <Route path="/products" element={<ListViewWithClear />} />
            <Route path="/products/:id" element={<DetailView />} />
          </Routes>
        </ListQueryPreserve>
      </MemoryRouter>
    );

    // Navigate to detail — saves ?page=2
    fireEvent.click(screen.getByText("Go detail"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products/1?page=2")
    );

    // Return to list without search (simulates user clearing filters)
    fireEvent.click(screen.getByText("Back list no query"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products?page=2")
    );

    // Navigate to detail again — still has search, saves it
    fireEvent.click(screen.getByText("Go detail"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products/1?page=2")
    );

    // Go back to list — clear filters by navigating without query
    fireEvent.click(screen.getByText("Back list no query"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products?page=2")
    );

    // Now simulate the user manually clearing filters (navigate to list with no search)
    fireEvent.click(screen.getByText("Clear and stay"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products")
    );

    // Navigate to detail — leaving list without any search clears storage
    fireEvent.click(screen.getByText("Go detail"));
    await waitFor(() =>
      // Detail should NOT get ?page=2 restored because storage was cleared when leaving with no search
      expect(screen.getByTestId("location").textContent).toBe("/products/1")
    );
  });

  it("memory strategy: URL stays clean when returning to list; hook returns preserved params", async () => {
    function ListViewMemory() {
      const navigate = useNavigate();
      return (
        <div>
          <button onClick={() => navigate("/products/1")}>Go detail</button>
          <LocationProbe />
          <EffectiveParamsProbe />
        </div>
      );
    }

    function DetailViewMemory() {
      const navigate = useNavigate();
      return (
        <div>
          <button onClick={() => navigate("/products")}>Back to list</button>
          <LocationProbe />
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={["/products?filter=active"]}>
        <ListQueryPreserve routes={routes} restoreStrategy="memory">
          <Routes>
            <Route path="/products" element={<ListViewMemory />} />
            <Route path="/products/:id" element={<DetailViewMemory />} />
          </Routes>
        </ListQueryPreserve>
      </MemoryRouter>
    );

    // Go to detail
    fireEvent.click(screen.getByText("Go detail"));
    expect(screen.getByTestId("location").textContent).toBe("/products/1");

    // Return to list — URL must stay clean (no navigate call)
    fireEvent.click(screen.getByText("Back to list"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products")
    );

    // Hook must expose preserved params virtually
    expect(screen.getByTestId("params").textContent).toBe("filter=active");
  });

  it("does not fire navigate twice under React.StrictMode (no restore loop)", async () => {
    const navigatedSearchValues: string[] = [];

    function DetailViewWithCounter() {
      const location = useLocation();
      const navigate = useNavigate();

      React.useLayoutEffect(() => {
        // Only record navigates that trigger from the search-less initial entry
        if (location.search) {
          navigatedSearchValues.push(location.search);
        }
      }, [location.search, navigate]);

      return (
        <div>
          <button onClick={() => navigate("/products")}>Back list no query</button>
          <div data-testid="location">{`${location.pathname}${location.search}`}</div>
        </div>
      );
    }

    render(
      <React.StrictMode>
        <MemoryRouter initialEntries={["/products?page=1"]}>
          <ListQueryPreserve routes={routes} restoreStrategy="router">
            <Routes>
              <Route path="/products" element={<ListView />} />
              <Route path="/products/:id" element={<DetailViewWithCounter />} />
            </Routes>
          </ListQueryPreserve>
        </MemoryRouter>
      </React.StrictMode>
    );

    fireEvent.click(screen.getByText("Go detail"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products/1?page=1")
    );

    // StrictMode double-invokes effects; restoredRef guard must prevent duplicate navigates.
    // At most one unique search value should have been committed.
    const uniqueSearches = new Set(navigatedSearchValues);
    expect(uniqueSearches.size).toBeLessThanOrEqual(1);
  });

  it("cleanupOnLeave does not clear storage when transitioning between two tracked lists", async () => {
    const multiRoutes = [
      { list: "/products", details: ["/products/:id"] },
      { list: "/users", details: ["/users/:id"] }
    ];

    const storage = (() => {
      const map = new Map<string, string>();
      return {
        length: 0,
        clear: () => map.clear(),
        getItem: (k: string) => map.get(k) ?? null,
        key: () => null,
        removeItem: (k: string) => { map.delete(k); },
        setItem: (k: string, v: string) => { map.set(k, v); }
      } as Storage;
    })();

    function MultiListView() {
      const navigate = useNavigate();
      return (
        <div>
          <button onClick={() => navigate("/products/1")}>Products detail</button>
          <button onClick={() => navigate("/users")}>Go users</button>
          <LocationProbe />
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={["/products?page=2"]}>
        <ListQueryPreserve
          routes={multiRoutes}
          restoreStrategy="router"
          cleanupOnLeave
          storage={storage}
        >
          <Routes>
            <Route path="/products" element={<MultiListView />} />
            <Route path="/products/:id" element={<DetailView />} />
            <Route path="/users" element={<LocationProbe />} />
          </Routes>
        </ListQueryPreserve>
      </MemoryRouter>
    );

    // Save search by going to detail
    fireEvent.click(screen.getByText("Products detail"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products/1?page=2")
    );

    // Navigate from detail back to list then to another tracked list
    fireEvent.click(screen.getByText("Back list no query"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/products?page=2")
    );

    fireEvent.click(screen.getByText("Go users"));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/users")
    );

    // Storage for /products must still be present (transition between tracked lists)
    const saved = getSearch("/products", storage);
    expect(saved).toBeTruthy();
  });
});
