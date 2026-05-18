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
});
