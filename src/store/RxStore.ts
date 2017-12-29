import { Observable } from 'rxjs';
import { State as S } from 'typesafereduxstate-js';
import { Reducer } from './types';
import * as Wrapper from './Wrapper';

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
    .shareReplay(1);
};

/**
 * This store is optional. It only provides some convenience when dealing with
 * state streams.
 */
export class Self implements Wrapper.ConvertibleType, Wrapper.Type {
  private store: Observable<S.Self<any>>;

  public constructor(...reducers: Observable<RxReducer<any>>[]) {
    this.store = create(...reducers);
  }

  /**
   * Get a store wrapper.
   * @returns {Wrapper.Self} A Wrapper.Self instance.
   */
  public toWrapper = (): Wrapper.Self => new Wrapper.Self(this);

  /**
   * Expose the inner store.
   * @returns {Observable<S.Self<any>>} An Observable instance.
   */
  public stateStream = (): Observable<S.Self<any>> => this.store;
}