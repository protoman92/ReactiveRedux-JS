import { BehaviorSubject } from 'rxjs';
import { Collections as Cols, Nullable, Numbers, Try } from 'javascriptutilities';
import { State } from 'typesafereduxstate-js';
import { ReduxStore } from './../src';
import { Reducer as DispatchReducer } from './../src/store/DispatchStore';

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

let testReduxStore = (store: ReduxStore.Type, actionFn: () => void): void => {
  /// Setup
  let numbers = [1, 2, 3, 4, 5];
  let strings = ['1', '2', '3', '4', '5'];
  let booleans = [true, false, true, false];
  var values1: Nullable<number>[] = [];
  var values2: Nullable<string>[] = [];
  var values3: Nullable<boolean>[] = [];
  var states: Nullable<State.Self<any>>[] = [];

  store.stateStream()
    .doOnNext(v => states.push(v))
    .logNext(v => v.flatten())
    .subscribe();

  store.numberAtNode(path1)
    .doOnNext(v => values1.push(v.value))
    .logNext(v => v.value)
    .subscribe();

  store.stringAtNode(path2)
    .doOnNext(v => values2.push(v.value))
    .logNext(v => v.value)
    .subscribe();

  store.booleanAtNode(path3)
    .doOnNext(v => values3.push(v.value))
    .logNext(v => v.value)
    .subscribe();

  /// When
  actionFn();

  /// Then
  expect(Cols.last(values1).value).toEqual(Numbers.sum(numbers));
  expect(Cols.last(values2).value).toEqual(strings.reduce((v1, v2) => v1 + v2));
  expect(Cols.last(values3).value).toEqual(Cols.last(booleans).value);
  expect(states.every(v => v !== undefined && v !== null)).toBeTruthy();
};

describe('Rx store should be implemented correctly', () => {
  var action1: BehaviorSubject<number>;
  var action2: BehaviorSubject<ReduxStore.Rx.Action.Type<string>>;
  var action3: BehaviorSubject<ReduxStore.Rx.Action.Type<boolean>>;
  var stateStore: ReduxStore.Rx.Self;

  let createStore = (): ReduxStore.Rx.Self => {
    let reducer1 = ReduxStore.Rx.createReducer(action1, (state, v) => {
      return state.mappingValue(path1, v1 => {
        return v1.map(v2 => v2 + v.value).successOrElse(Try.success(v.value));
      });
    });

    let reducer2 = ReduxStore.Rx.createReducer(action2, (state, v) => {
      return state.mappingValue(path2, v1 => {
        return v1.map(v2 => v2 + v.value).successOrElse(Try.success(v.value));
      });
    });

    let reducer3 = ReduxStore.Rx.createReducer(action3, (state, v) => {
      return state.updatingValue(path3, v.value);
    });

    return new ReduxStore.Rx.Self(reducer1, reducer2, reducer3);
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
  var stateStore: ReduxStore.Dispatch.Self;

  let actionFn1 = (v: number): ReduxStore.Dispatch.Action.Type<number> => ({
    id: actionKey1,
    fullValuePath: path1,
    payload: v,
  });

  let actionFn2 = (v: string): ReduxStore.Dispatch.Action.Type<string> => ({
    id: actionKey2,
    fullValuePath: path2,
    payload: v,
  });

  let actionFn3 = (v: boolean): ReduxStore.Dispatch.Action.Type<boolean> => ({
    id: actionKey3,
    fullValuePath: path3,
    payload: v,
  });

  let reducer: DispatchReducer<any> = (state, action) => {
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
    stateStore = ReduxStore.Dispatch.createDefault(reducer);
  });

  it.only('Dispatch action with subject - should work', () => {
    testReduxStore(stateStore, () => {
      numbers.map(v => actionFn1(v)).forEach(v => stateStore.dispatch(v));
      setTimeout(undefined, timeout);
      strings.map(v => actionFn2(v)).forEach(v => stateStore.dispatch(v));
      setTimeout(undefined, timeout);
      booleans.map(v => actionFn3(v)).forEach(v => stateStore.dispatch(v));
      setTimeout(undefined, timeout);
    });
  });
});