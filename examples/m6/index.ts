import { observable, autorun, flow, makeAutoObservable } from "mobx";
import { makeLoadingActions, makeAutoLoading, autoLoading } from "./loading";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const g: any = window;

class A {
  loading: makeAutoLoading<A, "loading">;
  num = 0;
  get num_plus_100() {
    return this.num + 100;
  }
  constructor() {
    makeAutoLoading(this, "loading");
    makeAutoObservable(this);
  }
  *a() {
    const last_args = this.loading.a.slice(-1)[0];
    yield delay(2000);
    if (last_args !== this.loading.a.slice(-1)[0]) return;
    this.num += 1;
    console.log(this.num);
  }
  async b() {
    const last_args = this.loading.b.slice(-1)[0];
    await delay(2000);
    if (last_args !== this.loading.b.slice(-1)[0]) return;
    this.num += 100;
    console.log(this.num);
  }
  c = function* (this: A) {
    const last_args = this.loading.c.slice(-1)[0];
    yield delay(2000);
    if (last_args !== this.loading.c.slice(-1)[0]) return;
    this.num += 1;
    console.log(this.num);
  };
  d = async () => {
    const last_args = this.loading.d.slice(-1)[0];
    await delay(2000);
    if (last_args !== this.loading.d.slice(-1)[0]) return;
    this.num += 100;
    console.log(this.num);
  };
}

const t = (g.t = new A());
autorun(() => {
  console.log(t.loading.some, JSON.stringify(t));
});

(async () => {
  await delay(1e3);
  t.a();
  await delay(5e3);
  t.a();
  await delay(5e3);
  t.a();
  t.a();
  await delay(5e3);
  t.b();
  await delay(5e3);
  t.b();
  await delay(5e3);
  t.b();
  t.b();
  await delay(5e3);
  t.c();
  await delay(5e3);
  t.c();
  await delay(5e3);
  t.c();
  t.c();
  await delay(5e3);
  t.d();
  await delay(5e3);
  t.d();
  await delay(5e3);
  t.d();
  t.d();
})();
