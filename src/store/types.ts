import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';
import { State } from 'typesafereduxstate-js';

/**
 * Represents the basic store type.
 */
export interface Type {
  /**
   * Common state stream that emits state sequentially as changes are reduced
   * onto old states.
   * @returns {Observable<State.Self<any>>} An Observable instance.
   */
  stateStream(): Observable<State.Self<any>>;

  /**
   * Stream the value at a node.
   * @param {string} id A string value.
   * @returns {Observable<Try<any>>} An Observable instance.
   */
  valueAtNode(id: string): Observable<Try<any>>;

  /**
   * Convenience method to stream a string from a node.
   * @param {string} id A string value.
   * @returns {Observable<Try<string>>} An Observable instance. 
   */
  stringAtNode(id: string): Observable<Try<string>>;

  /**
   * Convenience method to stream a number from a node.
   * @param {string} id A string value.
   * @returns {Observable<Try<number>>} An Observable instance. 
   */
  numberAtNode(id: string): Observable<Try<number>>;

  /**
   * Convenience method to stream a boolean from a node.
   * @param {string} id A string value.
   * @returns {Observable<Try<boolean>>} An Observable instance. 
   */
  booleanAtNode(id: string): Observable<Try<boolean>>; 

  /**
   * Convenience method to stream R from a node.
   * @template R Generics parameter.
   * @param {new () => R} ctor Constructor function.
   * @param {string} id A string value.
   * @returns {Observable<Try<R>>} An Observable instance.
   */
  instanceAtNode<R>(ctor: new () => R, id: string): Observable<Try<R>>;
}