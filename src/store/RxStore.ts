import { Observable } from 'rxjs';
import { Nullable, Try, Types } from 'javascriptutilities';
import { State as S } from 'typesafereduxstate-js';
import { Type as StoreType } from './types';
import * as Utils from './util';

export namespace Action {
  /**
   * Represents a dispatchable action.
   * @template T Generics parameter.
   */
  export interface Type<T> {
    name: string;
    value: T;
  }
}

export namespace StateInfo {
  /**
   * Represents necessary state information.
   * @template T Generics parameter.
   */
  export interface Type<T> {
    state: S.Self<T>;
    lastAction: Nullable<Action.Type<T>>;
  }
}

export type ActionType<T> = Action.Type<T> | T;
export type Reducer<T> = (state: S.Self<T>, action: Action.Type<T>) => S.Self<T>;
export type RxReducer<T> = (state: S.Self<T>) => StateInfo.Type<T>;

/**
 * Convenience method to create an action with a default name.
 * @template T Generics parameter.
 * @param {ActionType<T>} action An ActionType instance.
 * @returns {Action.Type<T>} An Action type instance.
 */
function createAction<T>(action: ActionType<T>): Action.Type<T> {
  if (Types.isInstance<Action.Type<T>>(action, 'name', 'value')) {
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
  return obs.map(v => (state: S.Self<T>) => {
    let action = createAction(v);
    return { state: reducer(state, action), lastAction: createAction(action) };
  });
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
 * @template T Generics parameter.
 * @param {...Observable<RxReducer<T>>[]} reducers An Array of Observable.
 * @returns {Observable<StateInfo.Type<T>>} An Observable instance.
 */
export function create<T>(...reducers: Observable<RxReducer<T>>[]): Observable<StateInfo.Type<T>> {
  return Observable.merge(...reducers)
    .scan((v1, v2) => v2(v1.state), { state: S.empty<T>(), lastAction: undefined })
    .startWith({ state: S.empty<T>(), lastAction: undefined })
    .shareReplay(1);
}

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
  private store: Observable<StateInfo.Type<any>>;

  public constructor(...reducers: Observable<RxReducer<any>>[]) {
    this.store = create(...reducers);
  }

  public stateInfoStream = (): Observable<StateInfo.Type<any>> => this.store;
  public stateStream = (): Observable<S.Self<any>> => this.store.map(v => v.state);

  public valueAtNode = (id: string): Observable<Try<any>> => {
    return Utils.valueAtNode(this.stateStream(), id);
  }

  public stringAtNode = (id: string): Observable<Try<string>> => {
    return Utils.stringAtNode(this.stateStream(), id);
  }

  public numberAtNode = (id: string): Observable<Try<number>> => {
    return Utils.numberAtNode(this.stateStream(), id);
  }

  public booleanAtNode = (id: string): Observable<Try<boolean>> => {
    return Utils.booleanAtNode(this.stateStream(), id);
  }

  public instanceAtNode<R>(ctor: new () => R, id: string): Observable<Try<R>> {
    return Utils.instanceAtNode(this.stateStream(), ctor, id);
  }
}