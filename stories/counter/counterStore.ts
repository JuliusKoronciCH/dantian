import { buildStore } from '../../lib';

export interface CounterState {
  count: number;
}

const counterStoreBuilder = buildStore<CounterState>({ count: 0 });
const { useStore, useSelector: useCounterSelector } = counterStoreBuilder;

export { useCounterSelector };
export default useStore;
