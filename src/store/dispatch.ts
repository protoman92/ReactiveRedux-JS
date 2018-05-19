import { BehaviorSubject, Observable, Subscription, queueScheduler } from 'rxjs';
import { observeOn, scan } from 'rxjs/operators';
import { Nullable } from 'javascriptutilities';
import { State as S } from 'type-safe-state-js';
import { Type as StoreType } from './types';

import {
  IncompletableSubject,
  MappableObserver,
  mapNonNilOrEmpty,
} from 'rx-utilities-js';

export namespace action {
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

export type Reducer<T> = (state: S.Type<T>, action: action.Type<T>) => S.Type<T>;

/**
 * Represents a dispatch store type.
 * @extends {StoreType} Store type extension.
 */
export interface Type extends StoreType {
  readonly actionTrigger: MappableObserver.Type<Nullable<action.Type<any>>>;
  readonly actionStream: Observable<action.Type<any>>;
  dispatch(action: action.Type<any>): void;
}

/**
 * Act as a centralized storage for state. This store can dispatch actions that
 * will be reduced onto the existing state.
 * @implements {Type} Type implementation.
 */
export class Self implements Type {
  private readonly action: IncompletableSubject<Nullable<action.Type<any>>>;
  private readonly state: BehaviorSubject<S.Type<any>>;
  private readonly subscription: Subscription;

  public constructor() {
    this.action = new IncompletableSubject(new BehaviorSubject(undefined));
    this.state = new BehaviorSubject(S.empty<any>());
    this.subscription = new Subscription();
  }

  public get actionTrigger(): MappableObserver.Type<Nullable<action.Type<any>>> {
    return this.action;
  }

  public get actionStream(): Observable<action.Type<any>> {
    return this.action.asObservable().pipe(mapNonNilOrEmpty(v => v));
  }

  public get stateStream(): Observable<S.Type<any>> {
    return this.state;
  }

  public initialize(reducer: Reducer<any>): void {
    let disposable = this.action.asObservable()
      .pipe(
        mapNonNilOrEmpty(v => v),
        scan((acc: S.Type<any>, action: action.Type<any>): S.Type<any> => {
          return reducer(acc, action);
        }, this.state.value),
        observeOn(queueScheduler),
    )
      .subscribe(this.state);

    this.subscription.add(disposable);
  }

  public deinitialize(): void {
    this.subscription.unsubscribe();
  }

  public dispatch(action: action.Type<any>): void {
    this.actionTrigger.next(action);
  }
}

/**
 * Create and initialize a dispatch store.
 * @param {Reducer<any>} reducer A Reducer instance.
 * @returns {Self} A dispatch store instance.
 */
export function createDefault(reducer: Reducer<any>): Self {
  let store = new Self();
  store.initialize(reducer);
  return store;
}
