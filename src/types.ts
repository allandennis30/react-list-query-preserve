export type PreserveRouteConfig = {
  list: string;
  details: string[];
};

export type RestoreStrategy = "router" | "history" | "none";

export type ShouldPreserve = (pathname: string) => boolean;