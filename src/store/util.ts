import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';
import { State } from 'type-safe-state-js';

export type STStream = Observable<State.Type<any>>;

/**
 * Stream the value at a node.
 * @param {STStream} The state stream.
 * @param {string} id A string value.
 * @returns {Observable<Try<any>>} An Observable instance.
 */
export let valueAtNode = (stream: STStream, id: string): Observable<Try<any>> => {
  return stream.map(v => v.valueAtNode(id));
};

/**
 * Convenience method to stream a string from a node.
 * @param {STStream} The state stream.
 * @param {string} id A string value.
 * @returns {Observable<Try<string>>} An Observable instance. 
 */
export let stringAtNode = (stream: STStream, id: string): Observable<Try<string>> => {
  return stream.map(v => v.stringAtNode(id));
};

/**
 * Convenience method to stream a number from a node.
 * @param {STStream} The state stream.
 * @param {string} id A string value.
 * @returns {Observable<Try<number>>} An Observable instance. 
 */
export let numberAtNode = (stream: STStream, id: string): Observable<Try<number>> => {
  return stream.map(v => v.numberAtNode(id));
};

/**
 * Convenience method to stream a boolean from a node.
 * @param {STStream} The state stream.
 * @param {string} id A string value.
 * @returns {Observable<Try<boolean>>} An Observable instance. 
 */
export let booleanAtNode = (stream: STStream, id: string): Observable<Try<boolean>> => {
  return stream.map(v => v.booleanAtNode(id));
};

/**
 * Convenience method to stream R from a node.
 * @template R Generics parameter.
 * @param {STStream} The state stream.
 * @param {new () => R} ctor Constructor function.
 * @param {string} id A string value.
 * @returns {Observable<Try<R>>} An Observable instance.
 */
export function instanceAtNode<R>(stream: STStream, ctor: new () => R, id: string): Observable<Try<R>> {
  return stream.map(v => v.instanceAtNode(ctor, id));
}