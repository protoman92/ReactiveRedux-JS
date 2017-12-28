import { State } from 'typesafereduxstate-js';

export type Reducer<T> = (state: State.Self<T>, value: T) => State.Self<T>;