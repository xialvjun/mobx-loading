import { makeAutoObservable } from 'mobx';
import { TLoading, isPromise, isGenerator } from "./utils";

export const symbol = Symbol("__mobx_loading__");

export abstract class AutoLoading<C, S extends string = "some"> {
  [symbol]: TLoading<C, symbol|'loading', S>;
  loading: TLoading<C, symbol|"loading", S>;
  constructor(someKey: S | "some" = "some") {
    // 不需要加上 Object.getOwnPropertyNames(this) , 因为父类 constructor 里拿不到子类 class property, 所以 mobx 类不能写箭头函数 action
    // 目前测试看出 整体的构造顺序是: 
    // 1. 生成父类 prototype;
    // 2. 生成子类 prototype;
    // 3. 赋值父类 class property;
    // 4. 执行父类构造函数剩余部分;
    // 5. 赋值子类 class property;
    // 6. 执行子类构造函数剩余部分
    // -- 目前 2,3 顺序不明
    const fnames = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(it => it !== "constructor" && typeof this[it] === "function");
    this.loading = this[symbol] = fnames.reduce(
      (acc, cv) => {
        acc[cv] = [];
        return acc;
      },
      {
        get [someKey]() {
          return Object.keys(this).some(it => it !== someKey && this[it].length > 0);
        },
      } as any,
    );
    fnames.forEach(fname => {
      const old = this[fname];
      if (isGenerator(old)) {
        // 用这种 { [fname](){} } 这种方式保留 action name
        Object.assign(this, {
          *[fname]() {
            const args = [...arguments];
            this.loading[fname].push(args);
            try {
              return yield* old.apply(this, args);
            } finally {
              this.loading[fname].splice(this.loading[fname].indexOf(args));
            }
          },
        });
      } else {
        Object.assign(this, {
          [fname]() {
            const args = [...arguments];
            let res = old.apply(this, args);
            if (res && isPromise(res)) {
              this.loading[fname].push(args);
              (res as any).finally(() => this.loading[fname].splice(this.loading[fname].indexOf(args)));
            }
            return res;
          },
        });
      }
    });
    makeAutoObservable(this);
  }
}
