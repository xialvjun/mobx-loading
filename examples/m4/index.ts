import { observable, autorun, flow } from "mobx";
import { makeLoadingActions, makeAutoLoading, autoLoading } from "./loading";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const g: any = window;

const a = (g.a = {
  num: 0,
  a: flow(function* () {
    const last_args = this.loading.a.slice(-1)[0];
    yield delay(2000);
    if (last_args !== this.loading.a.slice(-1)[0]) return;
    this.num += 1;
    console.log(this.num);
  }),
  async b() {
    const last_args = this.loading.b.slice(-1)[0];
    await delay(2000);
    if (last_args !== this.loading.b.slice(-1)[0]) return;
    this.num += 100;
    console.log(this.num);
  },
});

const b = (g.b = autoLoading(a, "loading"));
const t = (g.t = observable(b));

// makeAutoLoading(a, 'loading');
// const t = g.t = observable(a);

autorun(() => console.log(t.loading.some, JSON.stringify(t)));

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
})();
