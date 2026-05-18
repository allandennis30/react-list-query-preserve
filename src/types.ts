export type PreserveRouteConfig = {
  list: string;
  details: string[];
};

export type RestoreStrategy = "router" | "memory";

export type ShouldPreserve = (pathname: string) => boolean;
