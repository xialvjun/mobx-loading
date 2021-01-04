import { observable, action } from "mobx";
import { AllowedNames, isPromise, isGenerator, getPropertyNames } from "./utils";

export type makeLoadingActions<T, S extends PropertyKey = "some"> = {
  loading: { [s in S]: boolean } & { [P in AllowedNames<T, Function>]: Parameters<T[P]>[] };
  actions: { [P in AllowedNames<T, Function>]: T[P] };
};

export function makeLoadingActions<T, S extends PropertyKey = "some">(obj: T, sk: S | "some" = "some"): makeLoadingActions<T, S> {
  const fnames = getPropertyNames(obj).filter(it => it !== "constructor" && typeof obj[it] === "function");
  const loading = observable(
    fnames.reduce(
      (acc: any, cv) => {
        acc[cv] = [];
        return acc;
      },
      {
        get [sk]() {
          return Object.keys(this).some(it => it !== sk && (obj as any).loading[it].length > 0);
        },
      },
    ),
  );
  const actions = fnames.reduce((acc, fname) => {
    const old = obj[fname];
    if (isGenerator(old)) {
      // 用这种 { [fname](){} } 这种方式保留 action name
      Object.assign(acc, {
        *[fname]() {
          const args = [...arguments];
          loading[fname].push(args);
          try {
            return yield* old.apply(this, args);
          } finally {
            loading[fname].splice(loading[fname].indexOf(args));
          }
        },
      });
    } else {
      Object.assign(acc, {
        [fname]() {
          const args = [...arguments];
          let res = old.apply(this, args);
          if (res && isPromise(res)) {
            loading[fname].push(args);
            (res as any).finally(action(() => loading[fname].splice(loading[fname].indexOf(args))));
          }
          return res;
        },
      });
    }
    return acc;
  }, {} as any);
  return { loading, actions };
}
