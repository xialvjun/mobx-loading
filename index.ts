import { autorun, makeAutoObservable } from 'mobx';
import { makeAutoLoading } from './makeAutoLoading';
import { AutoLoading } from './AutoLoading';

const delay = (ms: number) => new Promise(res => setTimeout(() => res(ms), ms));

class A {
  loading: makeAutoLoading<A, 'loading'>;
  constructor() {
    this.loading = makeAutoLoading(this);
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

class B extends AutoLoading<B> {
  // constructor() {
  //   super();
  //   makeAutoObservable(this);
  // }
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

var b = (window as any).b = new B();
autorun(() => {
  console.log(b.loading.some);
});
