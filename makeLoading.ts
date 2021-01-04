
import { AllowedNames, isPromise, isGenerator } from "./utils";

export type makeLoading<T, S extends string = "some"> = {
  loading: { [s in S]:boolean } & { [P in AllowedNames<T, Function>]: Parameters<T[P]>[] },
  actions: { [P in AllowedNames<T, Function>]: T[P] }
};

export function makeLoading<T, S extends string = "some">(obj: T, sk: S | "some" = "some"): makeLoading<T, S> {
  const fnames = Object.getOwnPropertyNames(obj)
    .concat(Object.getOwnPropertyNames(Object.getPrototypeOf(obj)))
    .filter(it => it !== "constructor" && typeof obj[it] === "function");
  const loading = fnames.reduce(
    (acc: any, cv) => {
      acc[cv] = [];
      return acc;
    },
    {
      get [sk]() {
        return Object.keys(this).some(it => it !== sk && (obj as any).loading[it].length > 0);
      },
    },
  );
  const actions = fnames.reduce((acc, fname) => {
    const old = obj[fname];
    if (isGenerator(old)) {
      // 用这种 { [fname](){} } 这种方式保留 action name
      Object.assign(acc, {
        *[fname]() {
          const args = [...arguments];
          acc.loading[fname].push(args);
          try {
            return yield* old.apply(this, args);
          } finally {
            acc.loading[fname].splice(acc.loading[fname].indexOf(args));
          }
        },
      });
    } else {
      Object.assign(acc, {
        [fname]() {
          const args = [...arguments];
          let res = old.apply(this, args);
          if (res && isPromise(res)) {
            acc.loading[fname].push(args);
            (res as any).finally(() => acc.loading[fname].splice(acc.loading[fname].indexOf(args)));
          }
          return res;
        },
      });
    }
    return acc;
  }, {} as any);
  return { loading, actions };
}
