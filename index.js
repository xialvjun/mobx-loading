"use strict";
// https://github.com/microsoft/TypeScript/issues/27864#issuecomment-752832437
// 'makeAutoObservable' can only be used for classes that don't have a superclass
// 因为上面两条, 无法写出 abstract class AutoLoading 的形式
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAutoLoading = exports.autoLoading = exports.makeLoadingActions = exports.makeLoadingProxy = exports.getPropertyNames = exports.isPlainObject = exports.isObject = exports.isGenerator = exports.isPromise = void 0;
// todo: https://github.com/microsoft/TypeScript/issues/29652#issuecomment-752858857
const mobx_1 = require("mobx");
function isPromise(obj) {
    return typeof obj.then === "function" && typeof obj.catch === "function";
}
exports.isPromise = isPromise;
function isGenerator(obj) {
    const constructor = obj === null || obj === void 0 ? void 0 : obj.constructor;
    if (!constructor)
        return false;
    if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName)
        return true;
    return false;
}
exports.isGenerator = isGenerator;
function isObject(value) {
    return value !== null && typeof value === "object";
}
exports.isObject = isObject;
const plainObjectString = Object.toString();
function isPlainObject(value) {
    var _a;
    if (!isObject(value))
        return false;
    const proto = Object.getPrototypeOf(value);
    if (proto == null)
        return true;
    return ((_a = proto.constructor) === null || _a === void 0 ? void 0 : _a.toString()) === plainObjectString;
}
exports.isPlainObject = isPlainObject;
function getPropertyNames(obj) {
    return Object.getOwnPropertyNames(obj).concat(isPlainObject(obj) ? [] : Object.getOwnPropertyNames(Object.getPrototypeOf(obj)));
}
exports.getPropertyNames = getPropertyNames;
function makeLoadingProxy(target, loadingKey = "loading", someKey = "some") {
    const fnames = getPropertyNames(target).filter(key => key !== "constructor" && typeof target[key] === "function");
    const loading = mobx_1.observable(fnames.reduce((acc, cv) => {
        acc[cv] = [];
        return acc;
    }, {
        get [someKey]() {
            return Object.keys(this).some(it => it !== someKey && loading[it].length > 0);
        },
    }));
    const cache = {};
    return new Proxy(target, {
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
                        const do_action = mobx_1.action(() => loading[p].splice(loading[p].indexOf(args), 1));
                        try {
                            let res = v.apply(this, args);
                            if (res && isPromise(res)) {
                                res.finally(do_action);
                            }
                            return res;
                        }
                        catch (error) {
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
exports.makeLoadingProxy = makeLoadingProxy;
function makeLoadingActions(obj, sk = "some") {
    const fnames = getPropertyNames(obj).filter(it => it !== "constructor" && typeof obj[it] === "function");
    const loading = mobx_1.observable(fnames.reduce((acc, cv) => {
        acc[cv] = [];
        return acc;
    }, {
        get [sk]() {
            return Object.keys(this).some(it => it !== sk && loading[it].length > 0);
        },
    }));
    const actions = fnames.reduce((acc, fname) => {
        const old = obj[fname];
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
                    }
                    finally {
                        loading[fname].splice(loading[fname].indexOf(args), 1);
                    }
                },
            });
        }
        else {
            Object.assign(acc, {
                [fname]() {
                    let args = [...arguments];
                    loading[fname].push(args);
                    args = loading[fname].slice(-1)[0];
                    const do_action = mobx_1.action(() => loading[fname].splice(loading[fname].indexOf(args), 1));
                    try {
                        let res = old.apply(this, args);
                        if (res && isPromise(res)) {
                            res.finally(do_action);
                        }
                        return res;
                    }
                    catch (error) {
                        do_action();
                        throw error;
                    }
                },
            });
        }
        return acc;
    }, {});
    return { loading, actions };
}
exports.makeLoadingActions = makeLoadingActions;
function autoLoading(obj, lk, sk = "some") {
    const { loading, actions } = makeLoadingActions(obj, sk);
    // const res = Object.create(obj as any);
    // res[lk] = loading;
    // Object.assign(res, actions);
    return Object.assign(Object.assign(Object.assign({}, obj), { [lk]: loading }), actions);
}
exports.autoLoading = autoLoading;
function makeAutoLoading(obj, lk, sk = "some") {
    const { loading, actions } = makeLoadingActions(obj, sk);
    obj[lk] = loading;
    Object.assign(obj, actions);
}
exports.makeAutoLoading = makeAutoLoading;
