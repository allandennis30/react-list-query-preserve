import { matchPath } from "react-router-dom";
import { PreserveRouteConfig } from "../types";
import { normalizePath } from "./storage";

export function matchesDetailRoute(pathname: string, details: string[]) {
  return details.some((route) => matchPath(route, pathname));
}

export function findPreserveConfig(pathname: string, routes: PreserveRouteConfig[]) {
  const normalizedPath = normalizePath(pathname);

  return routes.find((route) => normalizePath(route.list) === normalizedPath);
}

export function findListConfigForDetail(pathname: string, routes: PreserveRouteConfig[]) {
  const normalizedPath = normalizePath(pathname);

  return routes.find((route) => matchesDetailRoute(normalizedPath, route.details));
}
