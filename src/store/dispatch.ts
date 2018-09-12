import {Never} from 'javascriptutilities';
import {
  IncompletableSubject,
  mapNonNilOrEmpty,
  MappableObserver,
} from 'rx-utilities-js';
import {BehaviorSubject, Observable, Scheduler, Subscription} from 'rxjs';
import {observeOn, scan} from 'rxjs/operators';
import {Type as StoreType} from './types';

export namespace Action {
  /**
   * Represents an action to be dispatched to the global state.
   * @template T Generics parameter.
   */
  export interface Type<T> {
    readonly id: string;
    readonly fullValuePath: string;
    readonly payload: T;
  }
}

export type Reducer<State, T> = (state: State, action: Action.Type<T>) => State;

/**
 * Represents a dispatch store type.
 * @extends {StoreType} Store type extension.
 * @template State Generics parameter.
 */
export interface Type<State> extends StoreType<State> {
  readonly actionTrigger: MappableObserver.Type<Never<Action.Type<any>>>;
  readonly actionStream: Observable<Action.Type<any>>;
  readonly lastState: State;
  dispatch(action: Action.Type<any>): void;
}

/**
 * Act as a centralized storage for state. This store can dispatch actions that
 * will be reduced onto the existing state.
 * @implements {Type} Type implementation.
 * @template State Generics parameter.
 */
export class Impl<State> implements Type<State> {
  private readonly action: IncompletableSubject<Never<Action.Type<any>>>;
  private readonly state: BehaviorSubject<State>;
  private readonly subscription: Subscription;

  public constructor(initialState: State) {
    this.action = new IncompletableSubject(new BehaviorSubject(undefined));
    this.state = new BehaviorSubject(initialState);
    this.subscription = new Subscription();
  }

  public get actionTrigger(): MappableObserver.Type<Never<Action.Type<any>>> {
    return this.action;
  }

  public get actionStream(): Observable<Action.Type<any>> {
    return this.action.asObservable().pipe(mapNonNilOrEmpty(v => v));
  }

  public get stateStream(): Observable<State> {
    return this.state;
  }

  public get lastState(): State {
    return this.state.value;
  }

  public initialize(reducer: Reducer<State, any>, scheduler: Scheduler): void {
    this.subscription.add(
      this.action
        .asObservable()
        .pipe(
          mapNonNilOrEmpty(v => v),
          scan((acc: State, action: Action.Type<any>): State => {
            return reducer(acc, action);
          }, this.state.value),
          observeOn(scheduler)
        )
        .subscribe(this.state)
    );
  }

  public deinitialize(): void {
    this.subscription.unsubscribe();
  }

  public dispatch(action: Action.Type<any>): void {
    this.actionTrigger.next(action);
  }
}

/**
 * Create and initialize a dispatch store.
 * @template State Generics parameter.
 * @param {State} initialState Initial state.
 * @param {Reducer<State, any>} reducer A Reducer instance.
 * @param {Scheduler} scheduler A Scheduler instance.
 * @returns {Impl} A dispatch store instance.
 */
export function createDefault<State>(
  initialState: State,
  reducer: Reducer<State, any>,
  scheduler: Scheduler
): Impl<State> {
  let store = new Impl(initialState);
  store.initialize(reducer, scheduler);
  return store;
}
