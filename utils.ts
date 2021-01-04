export function isPromise(obj: any): obj is Promise<any> {
  return typeof obj.then === "function" && typeof obj.catch === "function";
}
export function isGenerator(obj: any): obj is GeneratorFunction {
  const constructor = obj?.constructor;
  if (!constructor) return false;
  if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName) return true;
  return false;
}
export function getPropertyNames(obj: any): string[] {
  return Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(obj)));
}

// https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
export type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
};
export type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base];
// type SubType<Base, Condition> = Pick<Base, AllowedNames<Base, Condition>>;

// // AllowedNames 里的两处 Base 引用 在把 l:AllowedNames 赋给 Base 作为属性时, 会导致 类型循环引用, 需要把该属性 key 移除
// export type AllowedNamesExclude<Base, Condition, Ex> = FilterFlags<Base, Condition>[Exclude<keyof Base, Ex>];
// export type TLoading<T, L extends PropertyKey, S extends PropertyKey = "some"> = {
//   [s in S]: boolean;
// } &
//   { [P in FilterFlags<Omit<T, L>, Function>[keyof Omit<T, L>]]: Parameters<T[P]>[] };
