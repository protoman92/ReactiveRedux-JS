import { Observable, Scheduler, merge } from 'rxjs';
import { map, scan, observeOn, startWith } from 'rxjs/operators';
import { Nullable, Types } from 'javascriptutilities';
import { Type as StoreType } from './types';

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
  export interface Type<State, T> {
    readonly state: State;
    readonly lastAction: Nullable<action.Type<T>>;
  }
}

export type ActionType<T> = action.Type<T> | T;
export type Reducer<State, T> = (state: State, action: action.Type<T>) => State;
export type RxReducer<State, T> = (state: State) => stateinfo.Type<State, T>;

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
 * @template State Generics parameter.
 * @template T Generics parameter.
 * @param {Observable<ActionType<T>>} obs An Observable instance.
 * @param {Reducer<State, T>} reducer A Reducer instance.
 * @returns {Observable<RxReducer<State, T>>} An Observable instance.
 */
export function createReducer<State, T>(obs: Observable<ActionType<T>>, reducer: Reducer<State, T>): Observable<RxReducer<State, T>> {
  return obs.pipe(map(v => (state: State) => {
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
 * @template State Generics paramter.
 * @template T Generics parameter.
 * @param {State} initialState Initial state.
 * @param {Scheduler} scheduler A Scheduler instance.
 * @param {...Observable<RxReducer<State, T>>[]} reducers An Array of Observable.
 * @returns {Observable<stateinfo.Type<State, T>>} An Observable instance.
 */
export function create<State, T>(
  initialState: State,
  scheduler: Scheduler,
  ...reducers: Observable<RxReducer<State, T>>[]
): Observable<stateinfo.Type<State, T>> {
  return merge(...reducers).pipe(
    scan((v1: stateinfo.Type<State, T>, v2: RxReducer<State, T>) => {
      return v2(v1.state);
    }, { state: initialState, lastAction: undefined }),
    startWith({ state: initialState, lastAction: undefined }),
    observeOn(scheduler),
  );
}

/**
 * Represents a rx-based store.
 * @extends {StoreType} StoreType extension.
 * @template State Generics paramter.
 */
export interface Type<State> extends StoreType<State> { }

/**
 * This store is optional. It only provides some convenience when dealing with
 * state streams.
 * @implements {Type} Type implementation.
 * @template State Generics paramter.
 */
export class Self<State> implements Type<State> {
  private store: Observable<stateinfo.Type<State, any>>;

  public constructor(
    initialState: State,
    scheduler: Scheduler,
    ...reducers: Observable<RxReducer<State, any>>[]
  ) {
    this.store = create(initialState, scheduler, ...reducers);
  }

  public get stateInfoStream(): Observable<stateinfo.Type<State, any>> {
    return this.store;
  }

  public get stateStream(): Observable<State> {
    return this.store.pipe(map(v => v.state));
  }
}
