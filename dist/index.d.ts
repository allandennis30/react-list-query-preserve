import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import * as react_router from 'react-router';

type PreserveRouteConfig = {
    list: string;
    details: string[];
};
type RestoreStrategy = "router" | "memory";
type ShouldPreserve = (pathname: string) => boolean;

type Props = {
    children: ReactNode;
    routes: PreserveRouteConfig[];
    restoreStrategy?: RestoreStrategy;
    storage?: Storage;
    shouldPreserve?: ShouldPreserve;
    cleanupOnLeave?: boolean;
    keyPrefix?: string;
};
declare function ListQueryPreserve({ children, routes, restoreStrategy, storage, shouldPreserve, cleanupOnLeave, keyPrefix }: Props): react_jsx_runtime.JSX.Element;

type Options = {
    storage?: Storage;
    keyPrefix?: string;
};
declare function usePreservedSearchParams(options?: Options): readonly [URLSearchParams, react_router.SetURLSearchParams];
/** @deprecated Use `usePreservedSearchParams`. */
declare const useEffectiveSearchParams: typeof usePreservedSearchParams;

export { ListQueryPreserve, type PreserveRouteConfig, type RestoreStrategy, type ShouldPreserve, useEffectiveSearchParams, usePreservedSearchParams };
