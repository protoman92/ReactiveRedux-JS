import { BehaviorSubject } from 'rxjs';
import { Collections as Cols, Nullable, Numbers, Try } from 'javascriptutilities';
import { State } from 'typesafereduxstate-js';
import { ReduxStore } from './../src';

describe('Rx store should be implemented correctly', () => {
  let path1 = 'a.b.c.d';
  let path2 = 'a.b.c.d.e';
  let path3 = 'a.b.c';
  var action1: BehaviorSubject<number>;
  var action2: BehaviorSubject<string>;
  var action3: BehaviorSubject<boolean>;
  var stateStore: ReduxStore.Rx.Self;
  var wrapper: ReduxStore.Wrapper.Self;

  let createStore = (): ReduxStore.Rx.Self => {
    let reducer1 = ReduxStore.Rx.createReducer(action1, (state, v) => {
      return state.mappingValue(path1, v1 => {
        return v1.map(v2 => v2 + v).successOrElse(Try.success(v));
      });
    });

    let reducer2 = ReduxStore.Rx.createReducer(action2, (state, v) => {
      return state.mappingValue(path2, v1 => {
        return v1.map(v2 => v2 + v).successOrElse(Try.success(v));
      });
    });

    let reducer3 = ReduxStore.Rx.createReducer(action3, (state, v) => {
      return state.updatingValue(path3, v);
    });

    return new ReduxStore.Rx.Self(reducer1, reducer2, reducer3);
  };

  beforeEach(() => {
    action1 = new BehaviorSubject(0);
    action2 = new BehaviorSubject('');
    action3 = new BehaviorSubject(false);
    stateStore = createStore();
    wrapper = stateStore.toWrapper();
  });

  it('Dispatch action with subject - should work', () => {
    /// Setup
    let timeout = 100;
    let numbers = [1, 2, 3, 4, 5];
    let strings = ['1', '2', '3', '4', '5'];
    let booleans = [true, false, true, false];
    var values1: Nullable<number>[] = [];
    var values2: Nullable<string>[] = [];
    var values3: Nullable<boolean>[] = [];
    var states: Nullable<State.Self<any>>[] = [];
   
    wrapper.stateStream()
      .doOnNext(v => states.push(v))
      .logNext(v => v.flatten())
      .subscribe();

    wrapper.numberAtNode(path1)
      .doOnNext(v => values1.push(v.value))
      .logNext(v => v.value)
      .subscribe();

    wrapper.stringAtNode(path2)
      .doOnNext(v => values2.push(v.value))
      .logNext(v => v.value)
      .subscribe();

    wrapper.booleanAtNode(path3)
      .doOnNext(v => values3.push(v.value))
      .logNext(v => v.value)
      .subscribe();

    /// When
    numbers.forEach(v => action1.next(v));
    setTimeout(undefined, timeout);
    strings.forEach(v => action2.next(v));
    setTimeout(undefined, timeout);
    booleans.forEach(v => action3.next(v));
    setTimeout(undefined, timeout);

    /// Then
    expect(Cols.last(values1).value).toEqual(Numbers.sum(numbers));
    expect(Cols.last(values2).value).toEqual(strings.reduce((v1, v2) => v1 + v2));
    expect(Cols.last(values3).value).toEqual(Cols.last(booleans).value);
    expect(states.every(v => v !== undefined && v !== null)).toBeTruthy();
  });
});