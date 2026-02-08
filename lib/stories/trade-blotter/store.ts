import { createEventStore } from '../..';
import { createInitialState, type TradeBlotterState } from './state';

const initialState = createInitialState();

export const {
  state$,
  useStoreValue,
  publish,
  reset,
  feed,
  globalEventStore$,
  systemEvents$,
  getPropertyObservable,
  useHydrateStore,
  useIsHydrated,
} = createEventStore<TradeBlotterState>(initialState, { debug: false });
