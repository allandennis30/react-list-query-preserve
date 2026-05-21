import { createContext, useContext } from "react";
import { PreserveRouteConfig, RestoreStrategy, ShouldPreserve } from "../types";

export type ListQueryPreserveContextValue = {
  restoreStrategy: RestoreStrategy;
  storage?: Storage;
  keyPrefix?: string;
  normalizedRoutes: PreserveRouteConfig[];
  shouldPreserve: ShouldPreserve;
};

export const ListQueryPreserveContext =
  createContext<ListQueryPreserveContextValue | null>(null);

export function useListQueryPreserveContext() {
  return useContext(ListQueryPreserveContext);
}
