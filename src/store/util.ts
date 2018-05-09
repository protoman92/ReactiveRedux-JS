import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Try } from 'javascriptutilities';
import { State } from 'type-safe-state-js';

export type STStream = Observable<State.Type<any>>;

/**
 * Stream the value at a node.
 * @param {STStream} The state stream.
 * @param {string} id A string value.
 * @returns {Observable<Try<any>>} An Observable instance.
 */
export function valueAtNode(stream: STStream, id: string): Observable<Try<any>> {
  return stream.pipe(map(v => v.valueAtNode(id)));
}

/**
 * Convenience method to stream a string from a node.
 * @param {STStream} The state stream.
 * @param {string} id A string value.
 * @returns {Observable<Try<string>>} An Observable instance. 
 */
export function stringAtNode(stream: STStream, id: string): Observable<Try<string>> {
  return stream.pipe(map(v => v.stringAtNode(id)));
}

/**
 * Convenience method to stream a number from a node.
 * @param {STStream} The state stream.
 * @param {string} id A string value.
 * @returns {Observable<Try<number>>} An Observable instance. 
 */
export function numberAtNode(stream: STStream, id: string): Observable<Try<number>> {
  return stream.pipe(map(v => v.numberAtNode(id)));
}

/**
 * Convenience method to stream a boolean from a node.
 * @param {STStream} The state stream.
 * @param {string} id A string value.
 * @returns {Observable<Try<boolean>>} An Observable instance. 
 */
export function booleanAtNode(stream: STStream, id: string): Observable<Try<boolean>> {
  return stream.pipe(map(v => v.booleanAtNode(id)));
}