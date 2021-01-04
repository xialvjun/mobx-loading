import { observable } from "mobx";
import { AllowedNames, isPromise, getPropertyNames } from "./utils";

export function makeAutoLoadingProxy<T, L extends PropertyKey = "loading", S extends PropertyKey = "some">(
  target: T,
  loadingKey: L | "loading" = "loading",
  someKey: S | "some" = "some",
): T &
  {
    [l in L]: { [s in S]: boolean } & { [K in AllowedNames<T, Function>]: Parameters<T[K]>[] };
  } {
  const loading: any = getPropertyNames(target)
    .filter(key => key !== "constructor" && typeof (target as any)[key] === "function")
    .reduce(
      (acc: any, cv) => {
        acc[cv] = [];
        return acc;
      },
      {
        get [someKey]() {
          return Object.keys(this).some(it => it !== someKey && loading[it].length > 0);
        },
      },
    );
  observable(loading);
  const cache: any = {};
  return new Proxy<any>(target, {
    get(t, p, r) {
      if (p === loadingKey) {
        return loading;
      }
      if (cache[p]) {
        return cache[p];
      }
      const v = t[p];
      if (typeof v === "function") {
        Object.assign(cache, {
          [p]: function () {
            const args = [...arguments];
            let res = v.apply(this, args);
            if (res && isPromise(res)) {
              loading[p].push(args);
              (res as any).finally(() => loading[p].splice(loading[p].indexOf(args)));
            }
            return res;
          },
        });
        return cache[p];
      }
      return v;
    },
  });
}
