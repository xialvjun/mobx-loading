// https://github.com/microsoft/TypeScript/issues/27864#issuecomment-752832437
// 'makeAutoObservable' can only be used for classes that don't have a superclass
// 因为上面两条, 无法写出 abstract class AutoLoading 的形式

// todo: https://github.com/microsoft/TypeScript/issues/29652#issuecomment-752858857

import { observable, action } from "mobx";

export function isPromise(obj: any): obj is Promise<any> & { finally: (fn: () => any) => void } {
  return typeof obj.then === "function" && typeof obj.catch === "function";
}
export function isGenerator(obj: any): obj is GeneratorFunction {
  const constructor = obj?.constructor;
  if (!constructor) return false;
  if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName) return true;
  return false;
}
export function isObject(value: any): value is Object {
  return value !== null && typeof value === "object";
}
const plainObjectString = Object.toString();
export function isPlainObject(value: any) {
  if (!isObject(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto == null) return true;
  return proto.constructor?.toString() === plainObjectString;
}
export function getPropertyNames(obj: any): string[] {
  return Object.getOwnPropertyNames(obj).concat(isPlainObject(obj) ? [] : Object.getOwnPropertyNames(Object.getPrototypeOf(obj)));
}

// https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
};
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base];
// type SubType<Base, Condition> = Pick<Base, AllowedNames<Base, Condition>>;

export type TLoading<T, S extends PropertyKey> = { [s in S]: boolean } & { [P in AllowedNames<T, Function>]: Parameters<T[P]>[] };
export type TAutoLoading<T, L extends PropertyKey, S extends PropertyKey> = T & { [l in L]: TLoading<Omit<T, L>, S> };

export function makeLoadingProxy<T, L extends PropertyKey = "loading", S extends PropertyKey = "some">(
  target: T,
  loadingKey: L | "loading" = "loading",
  someKey: S | "some" = "some",
): TAutoLoading<T, L, S> {
  const fnames = getPropertyNames(target).filter(key => key !== "constructor" && typeof (target as any)[key] === "function");
  const loading: any = observable(
    fnames.reduce(
      (acc: any, cv) => {
        acc[cv] = [];
        return acc;
      },
      {
        get [someKey]() {
          return Object.keys(this).some(it => it !== someKey && loading[it].length > 0);
        },
      },
    ),
  );
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
          [p]() {
            let args = [...arguments];
            loading[p].push(args);
            args = loading[p].slice(-1)[0];
            const do_action = action(() => loading[p].splice(loading[p].indexOf(args), 1));
            try {
              let res = v.apply(this, args);
              if (res && isPromise(res)) {
                res.finally(do_action);
              }
              return res;
            } catch (error) {
              do_action();
              throw error;
            }
          },
        });
        return cache[p];
      }
      return v;
    },
  });
}

export function makeLoadingActions<T, S extends PropertyKey = "some">(
  obj: T,
  sk: S | "some" = "some",
): { loading: TLoading<T, S>; actions: { [P in AllowedNames<T, Function>]: T[P] } } {
  const fnames = getPropertyNames(obj).filter(it => it !== "constructor" && typeof (obj as any)[it] === "function");
  const loading: any = observable(
    fnames.reduce(
      (acc: any, cv) => {
        acc[cv] = [];
        return acc;
      },
      {
        get [sk]() {
          return Object.keys(this).some(it => it !== sk && loading[it].length > 0);
        },
      },
    ),
  );
  const actions = fnames.reduce((acc, fname) => {
    const old = (obj as any)[fname];
    if (isGenerator(old)) {
      // 用这种 { [fname](){} } 这种方式保留 action name
      Object.assign(acc, {
        *[fname]() {
          let args = [...arguments];
          loading[fname].push(args);
          // push(args) 后 args 会被克隆一份, 导致后面 indexOf 找不到
          args = loading[fname].slice(-1)[0];
          try {
            return yield* old.apply(this, args);
          } finally {
            loading[fname].splice(loading[fname].indexOf(args), 1);
          }
        },
      });
    } else {
      Object.assign(acc, {
        [fname]() {
          let args = [...arguments];
          loading[fname].push(args);
          args = loading[fname].slice(-1)[0];
          const do_action = action(() => loading[fname].splice(loading[fname].indexOf(args), 1));
          try {
            let res = old.apply(this, args);
            if (res && isPromise(res)) {
              res.finally(do_action);
            }
            return res;
          } catch (error) {
            do_action();
            throw error;
          }
        },
      });
    }
    return acc;
  }, {} as any);
  return { loading, actions };
}

export function autoLoading<T, L extends PropertyKey = "loading", S extends PropertyKey = "some">(
  obj: T,
  lk: L | "loading",
  sk: S | "some" = "some",
): TAutoLoading<T, L, S> {
  const { loading, actions } = makeLoadingActions(obj, sk);
  // const res = Object.create(obj as any);
  // res[lk] = loading;
  // Object.assign(res, actions);
  return { ...obj, [lk]: loading, ...actions } as any;
}

export type makeAutoLoading<T, L extends PropertyKey, S extends PropertyKey = "some"> = TLoading<Omit<T, L>, S>;
export function makeAutoLoading<T, L extends PropertyKey, S extends PropertyKey = "some">(
  obj: T,
  lk: L | "loading",
  sk: S | "some" = "some",
) {
  const { loading, actions } = makeLoadingActions(obj, sk);
  (obj as any)[lk] = loading;
  Object.assign(obj, actions);
}
