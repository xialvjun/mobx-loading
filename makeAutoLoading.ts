import { FilterFlags, AllowedNames } from "./utils";
import { makeLoadingActions } from "./makeLoadingActions";

export type makeAutoLoading<T, L extends PropertyKey, S extends PropertyKey = "some"> = {
  [s in S]: boolean;
} &
  { [P in FilterFlags<Omit<T, L>, Function>[keyof Omit<T, L>]]: Parameters<T[P]>[] };

export function makeAutoLoading<T, L extends PropertyKey, S extends PropertyKey = "some">(
  obj: T,
  lk: L | "loading",
  sk: S | "some" = "some",
) {
  const { loading, actions } = makeLoadingActions(obj, sk);
  obj[lk as any] = loading;
  Object.assign(obj, actions);
}

// export function loading<T, L extends PropertyKey = "loading", S extends PropertyKey = "some">(
//   obj: T,
//   lk: L | "loading" = 'loading',
//   sk: S | "some" = "some",
// ): T & { [l in L]: { [s in S]: boolean } & { [P in AllowedNames<T, Function>]: Parameters<T[P]>[] } } {
//   const { loading, actions } = makeLoadingActions(obj, sk);
//   return null as any;
// }
