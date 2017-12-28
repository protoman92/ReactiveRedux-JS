import * as RxStore from './RxStore';
import { RxReducer } from './RxStore';
import { Reducer } from './types';

export namespace ReduxStore {
  export let Rx = RxStore;
}

export { Reducer, RxReducer };