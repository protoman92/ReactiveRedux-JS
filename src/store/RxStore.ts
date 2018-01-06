import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';
import { State as S } from 'typesafereduxstate-js';
import { Type as StoreType } from './types';
import * as Utils from './util';

export type Reducer<T> = (state: S.Self<T>, value: T) => S.Self<T>;
export type RxReducer<T> = (state: S.Self<T>) => S.Self<T>;

/**
 * Create reducer streams that can be used to calculate states. Beware that the
 * resulting Observable emits a function that takes a state and returns another
 * state. The value stream from the original Observable is responsible for
 * providing values to the reducer.
 * @template T Generics parameter.
 * @param {Observable<T>} obs An Observable instance.
 * @param {Reducer<T>} reducer A Reducer instance.
 * @returns {Observable<RxReducer<T>>} An Observable instance.
 */
export function createReducer<T>(obs: Observable<T>, reducer: Reducer<T>): Observable<RxReducer<T>> {
  return obs.map(v => (state: S.Self<T>) => reducer(state, v));
}

/**
 * Create a Redux store that accepts an Array of reducer streams, then scan them 
 * to derive the latest state. We also use shareReplay to relay the last value 
 * to new subscribers and share a common subscription.
 * 
 * The setup should be as follows:
 *  - Define BehaviorSubject instances that accept state values.
 *  - Create reducer streams using createReducer.
 *  - Pass the resulting reducer streams to this method.
 *  - When a new state value should be updated, call next(value).
 *  - The new state will be calculated and pushed onto the store stream.
 * 
 * @param {...Observable<RxReducer<any>>[]} reducers An Array of Observable.
 * @returns {Observable<S.Self<any>>} An Observable instance.
 */
export let create = (...reducers: Observable<RxReducer<any>>[]): Observable<S.Self<any>> => {
  return Observable.merge(...reducers)
    .scan((v1, v2) => v2(v1), S.empty<any>())
    .startWith(S.empty<any>())
    .shareReplay(1);
};

/**
 * Represents a rx-based store.
 * @extends {StoreType} StoreType extension.
 */
export interface Type extends StoreType {}

/**
 * This store is optional. It only provides some convenience when dealing with
 * state streams.
 * @implements {Type} Type implementation.
 */
export class Self implements Type {
  private store: Observable<S.Self<any>>;

  public constructor(...reducers: Observable<RxReducer<any>>[]) {
    this.store = create(...reducers);
  }

  public stateStream = (): Observable<S.Self<any>> => this.store;

  public valueAtNode = (id: string): Observable<Try<any>> => {
    return Utils.valueAtNode(this.store, id);
  }

  public stringAtNode = (id: string): Observable<Try<string>> => {
    return Utils.stringAtNode(this.store, id);
  }

  public numberAtNode = (id: string): Observable<Try<number>> => {
    return Utils.numberAtNode(this.store, id);
  }

  public booleanAtNode = (id: string): Observable<Try<boolean>> => {
    return Utils.booleanAtNode(this.store, id);
  }

  public instanceAtNode<R>(ctor: new () => R, id: string): Observable<Try<R>> {
    return Utils.instanceAtNode(this.store, ctor, id);
  }
}