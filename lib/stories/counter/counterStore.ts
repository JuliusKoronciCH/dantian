import { buildClassicStore } from '../..';

export interface CounterState {
  count: number;
}

const counterStoreBuilder = await buildClassicStore<CounterState>({ count: 0 });
const { useStore, useSelector: useCounterSelector } = counterStoreBuilder;

export { useCounterSelector };
export default useStore;
