import { BehaviorSubject, queueScheduler as scheduler } from 'rxjs';
import { map } from 'rxjs/operators';
import { Collections, Nullable, Try } from 'javascriptutilities';
import { doOnNext } from 'rx-utilities-js';
import { State as S } from 'type-safe-state-js';
import { reduxstore as Store } from './../src';
import { Reducer as DispatchReducer } from './../src/store/dispatch';

type State = S.Type<any>;
type DispatchStore = Store.dispatch.Self<State>;
type RxStore = Store.rx.Self<State>;
type StoreType = Store.Type<State>;

let timeout = 100;
let path1 = 'a.b.c.d';
let path2 = 'a.b.c.d.e';
let path3 = 'a.b.c';
let actionKey1 = 'action1';
let actionKey2 = 'action2';
let actionKey3 = 'action3';
let numbers = [1, 2, 3, 4, 5];
let strings = ['1', '2', '3', '4', '5'];
let booleans = [true, false, true, false];

let testReduxStore = (store: StoreType, actionFn: () => void): void => {
  /// Setup
  let numbers = [1, 2, 3, 4, 5];
  let strings = ['1', '2', '3', '4', '5'];
  let booleans = [true, false, true, false];
  var values1: Nullable<number>[] = [];
  var values2: Nullable<string>[] = [];
  var values3: Nullable<boolean>[] = [];
  var states: Nullable<State>[] = [];

  store.stateStream.pipe(doOnNext(v => states.push(v))).subscribe();

  store.stateStream.pipe(
    map(v => v.numberAtNode(path1)),
    doOnNext(v => values1.push(v.value))
  ).subscribe();

  store.stateStream.pipe(
    map(v => v.stringAtNode(path2)),
    doOnNext(v => values2.push(v.value)),
  ).subscribe();

  store.stateStream.pipe(
    map(v => v.booleanAtNode(path3)),
    doOnNext(v => values3.push(v.value)),
  ).subscribe();

  /// When
  actionFn();

  /// Then
  expect(Collections.last(values1).value).toEqual(numbers.reduce((acc, v) => acc + v));
  expect(Collections.last(values2).value).toEqual(strings.reduce((v1, v2) => v1 + v2));
  expect(Collections.last(values3).value).toEqual(Collections.last(booleans).value);
  expect(states.every(v => v !== undefined && v !== null)).toBeTruthy();
};

describe('Rx store should be implemented correctly', () => {
  var action1: BehaviorSubject<number>;
  var action2: BehaviorSubject<Store.rx.action.Type<string>>;
  var action3: BehaviorSubject<Store.rx.action.Type<boolean>>;
  var stateStore: RxStore;

  let createStore = (): RxStore => {
    let reducer1 = Store.rx.createReducer(action1, (state: State, v) => {
      return state.mappingValue(path1, v1 => {
        return v1.map(v2 => v2 + v.value).successOrElse(Try.success(v.value));
      });
    });

    let reducer2 = Store.rx.createReducer(action2, (state: State, v) => {
      return state.mappingValue(path2, v1 => {
        return v1.map(v2 => v2 + v.value).successOrElse(Try.success(v.value));
      });
    });

    let reducer3 = Store.rx.createReducer(action3, (state: State, v) => {
      return state.updatingValue(path3, v.value);
    });

    return new Store.rx.Self(S.empty(), scheduler, reducer1, reducer2, reducer3);
  };

  beforeEach(() => {
    /// Here we mix both Action.Type and normal values.
    action1 = new BehaviorSubject(0);
    action2 = new BehaviorSubject({ name: actionKey2, value: '' });
    action3 = new BehaviorSubject({ name: actionKey3, value: false });
    stateStore = createStore();
  });

  it('Dispatch action with subject - should work', () => {
    testReduxStore(stateStore, () => {
      numbers.forEach(v => action1.next(v));
      setTimeout(undefined, timeout);
      strings.forEach(v => action2.next({ name: actionKey2, value: v }));
      setTimeout(undefined, timeout);
      booleans.forEach(v => action3.next({ name: actionKey3, value: v }));
      setTimeout(undefined, timeout);
    });
  });
});

describe('Dispatch store should be implemented correctly', () => {
  var stateStore: DispatchStore;

  let actionFn1 = (v: number): Store.dispatch.action.Type<number> => ({
    id: actionKey1,
    fullValuePath: path1,
    payload: v,
  });

  let actionFn2 = (v: string): Store.dispatch.action.Type<string> => ({
    id: actionKey2,
    fullValuePath: path2,
    payload: v,
  });

  let actionFn3 = (v: boolean): Store.dispatch.action.Type<boolean> => ({
    id: actionKey3,
    fullValuePath: path3,
    payload: v,
  });

  let reducer: DispatchReducer<State, any> = (state, action) => {
    let payload = action.payload;

    switch (action.id) {
      case actionKey1:
        return state.mappingValue(action.fullValuePath, v => {
          return v.map(v1 => <number>v1).getOrElse(0) + payload;
        });

      case actionKey2:
        return state.mappingValue(action.fullValuePath, v => {
          return v.map(v1 => <string>v1).getOrElse('') + payload;
        });

      case actionKey3:
        return state.updatingValue(action.fullValuePath, action.payload);

      default:
        return state;
    }
  };

  beforeEach(() => {
    stateStore = Store.dispatch.createDefault(S.empty(), reducer, scheduler);
  });

  it('Dispatch action with action creators - should work', () => {
    testReduxStore(stateStore, () => {
      numbers.map(v => actionFn1(v)).forEach(v => stateStore.dispatch(v));
      setTimeout(undefined, timeout);
      strings.map(v => actionFn2(v)).forEach(v => stateStore.dispatch(v));
      setTimeout(undefined, timeout);
      booleans.map(v => actionFn3(v)).forEach(v => stateStore.dispatch(v));
      setTimeout(undefined, timeout);
    });

    expect(stateStore.lastState.valueAtNode(path1).isSuccess()).toBeTruthy();
    expect(stateStore.lastState.valueAtNode(path2).isSuccess()).toBeTruthy();
    expect(stateStore.lastState.valueAtNode(path3).isSuccess()).toBeTruthy();
  });
});
