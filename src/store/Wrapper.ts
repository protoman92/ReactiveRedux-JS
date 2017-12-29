import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';
import { State } from 'typesafereduxstate-js';

export interface ConvertibleType {
  /**
   * Convert to a store wrapper.
   * @returns {Self} A Self instance.
   */
  toWrapper(): Self;
}

export interface Type {
  /**
   * Common state stream that emits state sequentially as changes are reduced
   * onto old states.
   * @returns {Observable<State.Self<any>>} An Observable instance.
   */
  stateStream(): Observable<State.Self<any>>;
}

/**
 * Use this class for convenience when dealing with state streams. It accepts
 * a Type implementation, so it does not matter how the actual store is 
 * implemented, so long as it exposes its inner state stream.
 */
export class Self implements ConvertibleType, Type {
  private store: Type;

  public constructor(store: Type) {
    this.store = store;
  }

  /**
   * Return self as wrapper.
   * @returns {Self} A Self instance.
   */
  public toWrapper = (): Self => this;

  /**
   * Get the state stream from the inner store. 
   * @returns {Observable<State.Self<any>>} An Observable instance.
   */
  public stateStream = (): Observable<State.Self<any>> => {
    return this.store.stateStream();
  }

  /**
   * Stream the value at a node.
   * @param {string} id A string value.
   * @returns {Observable<Try<any>>} An Observable instance.
   */
  public valueAtNode = (id: string): Observable<Try<any>> => {
    return this.stateStream().map(v => v.valueAtNode(id));
  }

  /**
   * Convenience value to stream a string from a node.
   * @param {string} id A string value.
   * @returns {Observable<Try<string>>} An Observable instance. 
   */
  public stringAtNode = (id: string): Observable<Try<string>> => {
    return this.valueAtNode(id)
      .map(v => v.filter(v1 => typeof(v1) === 'string', `No string at ${id}`))
      .map(v => v.map(v1 => <string>v1))
      .distinctUntilChanged((v1, v2) => v1.value === v2.value);
  } 

  /**
   * Convenience value to stream a number from a node.
   * @param {string} id A string value.
   * @returns {Observable<Try<number>>} An Observable instance. 
   */
  public numberAtNode = (id: string): Observable<Try<number>> => {
    return this.valueAtNode(id)
      .map(v => v.filter(v1 => typeof(v1) === 'number', `No number at ${id}`))
      .map(v => v.map(v1 => <number>v1))
      .distinctUntilChanged((v1, v2) => v1.value === v2.value);
  }

  /**
   * Convenience value to stream a boolean from a node.
   * @param {string} id A string value.
   * @returns {Observable<Try<boolean>>} An Observable instance. 
   */
  public booleanAtNode = (id: string): Observable<Try<boolean>> => {
    return this.valueAtNode(id)
      .map(v => v.filter(v1 => typeof(v1) === 'boolean', `No boolean at ${id}`))
      .map(v => v.map(v1 => <boolean>v1))
      .distinctUntilChanged((v1, v2) => v1.value === v2.value);
  }
}