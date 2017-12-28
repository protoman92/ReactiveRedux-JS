import { BehaviorSubject } from 'rxjs';
import { Collections as Cols, Nullable, Numbers, Try } from 'javascriptutilities';
import { State as S } from 'typesafereduxstate-js';
import { ReduxStore } from './../src';
import { Observable } from 'rxjs';

describe('Rx store should be implemented correctly', () => {
  let path1 = 'a.b.c.d';
  let path2 = 'a.b.c.d.e';
  let path3 = 'a.b.c';
  var action1: BehaviorSubject<number>;
  var action2: BehaviorSubject<string>;
  var action3: BehaviorSubject<boolean>;
  var stateStore: Observable<S.Self<any>>;

  let createStore = (): Observable<S.Self<any>> => {
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

    return ReduxStore.Rx.create(reducer1, reducer2, reducer3);
  };

  beforeEach(() => {
    action1 = new BehaviorSubject(0);
    action2 = new BehaviorSubject('');
    action3 = new BehaviorSubject(false);
    stateStore = createStore(); 
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

    stateStore
      .map(v => v.valueAtNode(path1)
        .filter(v1 => typeof(v1) === 'number', '')
        .map(v1 => <number>v1))
      .distinctUntilChanged((v1, v2) => v1.value === v2.value)
      .doOnNext(v => values1.push(v.value))
      .subscribe();

    stateStore
      .map(v => v.valueAtNode(path2)
        .filter(v1 => typeof(v1) === 'string', '')
        .map(v1 => <string>v1))
      .distinctUntilChanged((v1, v2) => v1.value === v2.value)
      .doOnNext(v => values2.push(v.value))
      .subscribe();

    stateStore
      .map(v => v.valueAtNode(path3)
        .filter(v1 => typeof(v1) === 'boolean', '')
        .map(v1 => <boolean>v1))
      .distinctUntilChanged((v1, v2) => v1.value === v2.value)
      .doOnNext(v => values3.push(v.value))
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
  });
});