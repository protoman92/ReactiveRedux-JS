import { Observable } from 'rxjs';

/**
 * Represents the basic store type.
 * @template State Generics parameter.
 */
export interface Type<State> {
  /**
   * Common state stream that emits state sequentially as changes are reduced
   * onto old states.
   * @returns {Observable<State.Type<any>>} An Observable instance.
   */
  readonly stateStream: Observable<State>;
}
