import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import {
  IncompletableSubject,
  MappableObserver,
  Nullable,
  Try,
} from 'javascriptutilities';

import { State as S } from 'type-safe-state-js';
import { Type as StoreType } from './types';
import * as Utils from './util';

export namespace Action {
  /**
   * Represents an action to be dispatched to the global state.
   * @template T Generics parameter.
   */
  export interface Type<T> {
    id: string;
    fullValuePath: string;
    payload: T;
  }
}

export type Reducer<T> = (state: S.Self<T>, action: Action.Type<T>) => S.Self<T>;

/**
 * Represents a dispatch store type.
 * @extends {StoreType} Store type extension.
 */
export interface Type extends StoreType {
  dispatch(action: Action.Type<any>): void;
  actionTrigger(): MappableObserver.Type<Nullable<Action.Type<any>>>;
  actionStream(): Observable<Action.Type<any>>;
}

/**
 * Act as a centralized storage for state. This store can dispatch actions that
 * will be reduced onto the existing state.
 * @implements {Type} Type implementation.
 */
export class Self implements Type {
  private readonly action: IncompletableSubject<Nullable<Action.Type<any>>>;
  private readonly state: BehaviorSubject<S.Self<any>>;
  private readonly subscription: Subscription;

  public constructor() {
    this.action = new IncompletableSubject(new BehaviorSubject(undefined));
    this.state = new BehaviorSubject(S.empty<any>());
    this.subscription = new Subscription();
  }

  public initialize = (reducer: Reducer<any>): void => {
    this.action.asObservable()
      .mapNonNilOrEmpty(v => v)
      .scan((acc, action) => reducer(acc, action), this.state.value)
      .subscribe(this.state)
      .toBeDisposedBy(this.subscription);
  }

  public deinitialize = (): void => {
    this.subscription.unsubscribe();
  }

  public dispatch = (action: Action.Type<any>): void => {
    this.actionTrigger().next(action);
  }

  public actionTrigger = (): MappableObserver.Type<Nullable<Action.Type<any>>> => {
    return this.action;
  }

  public actionStream = (): Observable<Action.Type<any>> => {
    return this.action.asObservable().mapNonNilOrEmpty(v => v);
  }

  public stateStream = (): Observable<S.Self<any>> => this.state;

  public valueAtNode = (id: string): Observable<Try<any>> => {
    return Utils.valueAtNode(this.state, id);
  }

  public stringAtNode = (id: string): Observable<Try<string>> => {
    return Utils.stringAtNode(this.state, id);
  }

  public numberAtNode = (id: string): Observable<Try<number>> => {
    return Utils.numberAtNode(this.state, id);
  }

  public booleanAtNode = (id: string): Observable<Try<boolean>> => {
    return Utils.booleanAtNode(this.state, id);
  }

  public instanceAtNode<R>(ctor: new () => R, id: string): Observable<Try<R>> {
    return Utils.instanceAtNode(this.state, ctor, id);
  }
}

/**
 * Create and initialize a dispatch store.
 * @param {Reducer<any>} reducer A Reducer instance.
 * @returns {Self} A dispatch store instance.
 */
export let createDefault = (reducer: Reducer<any>): Self => {
  let store = new Self();
  store.initialize(reducer);
  return store;
};