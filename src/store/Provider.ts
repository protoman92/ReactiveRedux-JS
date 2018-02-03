import { Type as StoreType } from './types';
import * as DispatchStore from './DispatchStore';
import * as RxStore from './RxStore';

/**
 * Provide a store for external usage.
 */
export interface Type {
  readonly store: StoreType;

  /**
   * Provide the separator here to avoid duplicating elsewhere.
   */
  readonly substateSeparator: string;
}

/**
 * Provide a rx-based store.
 * @extends {Type} Type implementation.
 */
export interface RxType extends Type {
  readonly store: RxStore.Self;
}

/**
 * Provide a dispatch-based store.
 * @extends {Type} Type implementation.
 */
export interface DispatchType extends Type {
  readonly store: DispatchStore.Type;
}