import { buildStore } from '../../lib';

export interface CounterState {
  count: number;
}
const counterStoreBuilder = buildStore<CounterState>({ count: 0 });
const { useStore } = counterStoreBuilder;

export default useStore;
