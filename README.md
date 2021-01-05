# mobx-loading

add typesafe loading to actions in mobx(compatible for mobx 4/5/6).

## concept
- `loading.some: boolean` is global loading;
- `loading[this_action_name]: Parameters<typeof this_action>[]` is this action's all calling parameters, so you can do many things like debounce action;
- `loading[this_action_name].length > 0` is this action loading;

## examples
see git `examples` directory.

#### mobx 6
```ts
import { makeAutoObservable, autorun } from "mobx";
import { makeAutoLoading } from "@xialvjun/mobx-loading";

class A {
  // loading: makeAutoLoading<A, "loading">; makeAutoLoading(this, "loading"); 
  // the three 'loading' must be the same
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
    // we can access action a's all calling parameters to debounce
    const last_args = this.loading.a.slice(-1)[0];
    yield delay(2000);
    if (last_args !== this.loading.a.slice(-1)[0]) return;
    this.num += 1;
    console.log(this.num);
  }
  async b() {
  }
  c = function* (this: A) {
  };
  d = async () => {
  };
}

const t = new A();
autorun(() => console.log(t.loading.some, JSON.stringify(t)));
```

#### mobx 5 / mobx 4
```ts
import { observable, autorun, flow } from "mobx";
import { autoLoading } from "@xialvjun/mobx-loading";

const a = {
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
};

const b = autoLoading(a, "loading");
const t = observable(b);
autorun(() => console.log(t.loading.some, JSON.stringify(t)));
```
