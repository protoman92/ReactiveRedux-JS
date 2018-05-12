import { Observable, merge, queueScheduler } from 'rxjs';
import { map, scan, observeOn, startWith } from 'rxjs/operators';
import { Nullable, Try, Types } from 'javascriptutilities';
import { State as S } from 'type-safe-state-js';
import { Type as StoreType } from './types';
import * as Utils from './util';

export namespace action {
  /**
   * Represents a dispatchable action.
   * @template T Generics parameter.
   */
  export interface Type<T> {
    readonly name: string;
    readonly value: T;
  }
}

export namespace stateinfo {
  /**
   * Represents necessary state information.
   * @template T Generics parameter.
   */
  export interface Type<T> {
    readonly state: S.Type<T>;
    readonly lastAction: Nullable<action.Type<T>>;
  }
}

export type ActionType<T> = action.Type<T> | T;
export type Reducer<T> = (state: S.Type<T>, action: action.Type<T>) => S.Type<T>;
export type RxReducer<T> = (state: S.Type<T>) => stateinfo.Type<T>;

/**
 * Convenience method to create an action with a default name.
 * @template T Generics parameter.
 * @param {ActionType<T>} action An ActionType instance.
 * @returns {action.Type<T>} An Action type instance.
 */
function createAction<T>(action: ActionType<T>): action.Type<T> {
  if (Types.isInstance<action.Type<T>>(action, 'name', 'value')) {
    return action;
  } else {
    return { name: 'DummyAction', value: action };
  }
}

/**
 * Create reducer streams that can be used to calculate states. Beware that the
 * resulting Observable emits a function that takes a state and returns another
 * state. The value stream from the original Observable is responsible for
 * providing values to the reducer.
 * @template T Generics parameter.
 * @param {Observable<ActionType<T>>} obs An Observable instance.
 * @param {Reducer<T>} reducer A Reducer instance.
 * @returns {Observable<RxReducer<T>>} An Observable instance.
 */
export function createReducer<T>(obs: Observable<ActionType<T>>, reducer: Reducer<T>): Observable<RxReducer<T>> {
  return obs.pipe(map(v => (state: S.Type<T>) => {
    let action = createAction(v);
    return { state: reducer(state, action), lastAction: createAction(action) };
  }));
}

/**
 * Create a Redux store that accepts an Array of reducer streams, then scan them 
 * to derive the latest state.
 * 
 * The setup should be as follows:
 *  - Define BehaviorSubject instances that accept state values.
 *  - Create reducer streams using createReducer.
 *  - Pass the resulting reducer streams to this method.
 *  - When a new state value should be updated, call next(value).
 *  - The new state will be calculated and pushed onto the store stream.
 * @template T Generics parameter.
 * @param {...Observable<RxReducer<T>>[]} reducers An Array of Observable.
 * @returns {Observable<stateinfo.Type<T>>} An Observable instance.
 */
export function create<T>(...reducers: Observable<RxReducer<T>>[]): Observable<stateinfo.Type<T>> {
  return merge(...reducers).pipe(
    scan((v1: stateinfo.Type<T>, v2: RxReducer<T>) => {
      return v2(v1.state);
    }, { state: S.empty<T>(), lastAction: undefined }),
    startWith({ state: S.empty<T>(), lastAction: undefined }),
    observeOn(queueScheduler),
  );
}

/**
 * Represents a rx-based store.
 * @extends {StoreType} StoreType extension.
 */
export interface Type extends StoreType { }

/**
 * This store is optional. It only provides some convenience when dealing with
 * state streams.
 * @implements {Type} Type implementation.
 */
export class Self implements Type {
  private store: Observable<stateinfo.Type<any>>;

  public constructor(...reducers: Observable<RxReducer<any>>[]) {
    this.store = create(...reducers);
  }

  public stateInfoStream(): Observable<stateinfo.Type<any>> {
    return this.store;
  }

  public stateStream(): Observable<S.Type<any>> {
    return this.store.pipe(map(v => v.state));
  }

  public valueAtNode(id: string): Observable<Try<any>> {
    return Utils.valueAtNode(this.stateStream(), id);
  }

  public stringAtNode(id: string): Observable<Try<string>> {
    return Utils.stringAtNode(this.stateStream(), id);
  }

  public numberAtNode(id: string): Observable<Try<number>> {
    return Utils.numberAtNode(this.stateStream(), id);
  }

  public booleanAtNode(id: string): Observable<Try<boolean>> {
    return Utils.booleanAtNode(this.stateStream(), id);
  }
}