import { FilterFlags } from "./utils";
import { makeLoading } from "./makeLoading";

export type makeAutoLoading<T, L extends string, S extends string = "some"> = {
  [s in S]: boolean;
} &
  { [P in FilterFlags<Omit<T, L>, Function>[keyof Omit<T, L>]]: Parameters<T[P]>[] };

export function makeAutoLoading<T, L extends string, S extends string = "some">(obj: T, lk: L | "loading", sk: S | "some" = "some") {
  const { loading, actions } = makeLoading(obj, sk);
  obj[lk as any] = loading;
  Object.assign(obj, actions);
}
