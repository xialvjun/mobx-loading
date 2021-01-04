import { TLoading, isPromise, isGenerator } from "./utils";

export type makeAutoLoading<T, L extends string, S extends string = "some"> = TLoading<T, L, S>;

// todo: https://github.com/microsoft/TypeScript/issues/29652#issuecomment-752858857
// todo: https://github.com/microsoft/TypeScript/issues/27864#issuecomment-752832437
export function makeAutoLoading<T, S extends string = "some">(obj: T, sk: S | "some" = "some") {
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
  fnames.forEach(fname => {
    const old = obj[fname];
    if (isGenerator(old)) {
      // 用这种 { [fname](){} } 这种方式保留 action name
      Object.assign(obj, {
        *[fname]() {
          const args = [...arguments];
          (obj as any).loading[fname].push(args);
          try {
            return yield* old.apply(this, args);
          } finally {
            (obj as any).loading[fname].splice((obj as any).loading[fname].indexOf(args));
          }
        },
      });
    } else {
      Object.assign(obj, {
        [fname]() {
          const args = [...arguments];
          let res = old.apply(this, args);
          if (res && isPromise(res)) {
            (obj as any).loading[fname].push(args);
            (res as any).finally(() => (obj as any).loading[fname].splice((obj as any).loading[fname].indexOf(args)));
          }
          return res;
        },
      });
    }
  });
  return loading;
}
