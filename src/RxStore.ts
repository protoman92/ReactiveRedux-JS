import { Observable } from 'rxjs';
import { State as S } from 'typesafereduxstate-js';
import { Reducer } from './types';

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