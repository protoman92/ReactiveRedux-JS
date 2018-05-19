import { Observable } from 'rxjs';
import { State } from 'type-safe-state-js';

/**
 * Represents the basic store type.
 */
export interface Type {
  /**
   * Common state stream that emits state sequentially as changes are reduced
   * onto old states.
   * @returns {Observable<State.Type<any>>} An Observable instance.
   */
  readonly stateStream: Observable<State.Type<any>>;
}
