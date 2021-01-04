// https://github.com/microsoft/TypeScript/issues/27864#issuecomment-752832437
// 'makeAutoObservable' can only be used for classes that don't have a superclass
// 因为上面两条, 无法写出 abstract class AutoLoading 的形式

// todo: https://github.com/microsoft/TypeScript/issues/29652#issuecomment-752858857


import { autorun, makeAutoObservable } from 'mobx';
import * as mobx from 'mobx';
import { makeAutoLoading } from './makeAutoLoading';
// import { AutoLoading } from './.gitignore.d/AutoLoading';

(window as any).mobx = mobx;

const delay = (ms: number) => new Promise(res => setTimeout(() => res(ms), ms));

class A {
  loading: makeAutoLoading<A, 'loading'>;
  constructor() {
    makeAutoLoading(this, 'loading');
    makeAutoObservable(this);
  }
  *a(m: number) {
    const last_args = this.loading.a.slice(-1)[0];
    const res = yield delay(m);
    if (last_args !== this.loading.a.slice(-1)[0]) return;
    console.log(res);
  }
  async b(m: number) {
    const last_args = this.loading.a.slice(-1)[0];
    const res = await delay(m);
    if (last_args !== this.loading.a.slice(-1)[0]) return;
    console.log(res);
  }
  c = (function*(this: A, m: number) {
    const last_args = this.loading.a.slice(-1)[0];
    const res = yield delay(m);
    if (last_args !== this.loading.a.slice(-1)[0]) return;
    console.log(res);
  }).bind(this)
  d = async (m: number) => {
    const last_args = this.loading.a.slice(-1)[0];
    const res = await delay(m);
    if (last_args !== this.loading.a.slice(-1)[0]) return;
    console.log(res);
  }
}

var a = (window as any).a = new A();
autorun(() => {
  console.log(a.loading.some);
});

// class B extends AutoLoading<B> {
//   // constructor() {
//   //   super();
//   //   makeAutoObservable(this);
//   // }
//   *a(m: number) {
//     const last_args = this.loading.a.slice(-1)[0];
//     const res = yield delay(m);
//     if (last_args !== this.loading.a.slice(-1)[0]) return;
//     console.log(res);
//   }
//   async b(m: number) {
//     const last_args = this.loading.a.slice(-1)[0];
//     const res = await delay(m);
//     if (last_args !== this.loading.a.slice(-1)[0]) return;
//     console.log(res);
//   }
//   c = (function*(this: A, m: number) {
//     const last_args = this.loading.a.slice(-1)[0];
//     const res = yield delay(m);
//     if (last_args !== this.loading.a.slice(-1)[0]) return;
//     console.log(res);
//   }).bind(this)
//   d = async (m: number) => {
//     const last_args = this.loading.a.slice(-1)[0];
//     const res = await delay(m);
//     if (last_args !== this.loading.a.slice(-1)[0]) return;
//     console.log(res);
//   }
// }

// var b = (window as any).b = new B();
// autorun(() => {
//   console.log(b.loading.some);
// });
