import { Union } from 'ts-toolbelt';
import { compile } from 'path-to-regexp';

type WithParams<P> = {};
type Route<A> = A & string;
type TypedRoute<P extends object={}> = Route<WithParams<P>>;
interface RouteMap {
  [key: string]: string | TypedRoute | RouteMap;
}

type InferTypedRoute<T> = T extends TypedRoute<infer U> ? U : never;
type UnknownOrObject<T> = T extends object ? T : {};
type InferredKeys<T> = keyof UnknownOrObject<InferTypedRoute<T>>;
type HasSaved<R> = InferredKeys<R> extends never ? never : R;
type HasNoSaved<R> = InferredKeys<R> extends never ? R : never;

type MergeRoute<T1 extends TypedRoute, T2 extends TypedRoute> = TypedRoute<
  Union.Merge<UnknownOrObject<InferTypedRoute<T1>> | UnknownOrObject<InferTypedRoute<T2>>>
>;

type MergeRouteMap<R extends RouteMap, T extends TypedRoute> = Union.Strict<{
  [K in keyof R]: R[K] extends TypedRoute ? MergeRoute<T, R[K]> :
    R[K] extends RouteMap ? MergeRouteMap<R[K], T> :
      R[K]
}>;

type InferRouteMap<R extends RouteMap> = Union.Strict<{
  [K in keyof R]: R[K] extends RouteMap ? InferRouteMap<R[K]> :
    R[K] extends TypedRoute ? InferTypedRoute<R[K]> :
      never
}>;

type BuildUrlParams<R extends object> = Union.Strict<{
  [K in keyof R]: R[K] | number;
}>

function typedRoute<R extends string=never, O extends string=never>(
  path: string
): TypedRoute<Union.Strict<Record<R, string> & Partial<Record<O, string>>>>;
function typedRoute(path: string): string {
  return path;
}

function routeMap<P extends TypedRoute, R extends RouteMap>(
  basePath: P, map: R
): Union.Strict<{ index: P } & MergeRouteMap<R, P>>;
function routeMap<R extends RouteMap>(basePath: string, map: R): { index: string } & R;
function routeMap(basePath: string, map: RouteMap): RouteMap {
  return Object.keys(map).reduce((obj, key) => {
    const route: RouteMap | string = map[key];
    const newValue = typeof route === 'object'
      ? routeMap(basePath, route)
      : `${basePath}${map[key]}`;
    return {
      ...obj,
      [key]: newValue,
    };
  }, { index: basePath } as RouteMap);
}

function reverseUrl<T extends TypedRoute>(
  route: HasSaved<T>, params: BuildUrlParams<InferTypedRoute<T>>
): string
function reverseUrl<T>(
  route: HasNoSaved<T>, params?: Record<string, string | number>
): string
function reverseUrl(route: string, params?: object): string {
  const reversed = compile(route);

  return reversed(params);
}

export {
  typedRoute,
  routeMap,
  reverseUrl,
  TypedRoute,
  InferTypedRoute,
  InferRouteMap,
  RouteMap,
};
