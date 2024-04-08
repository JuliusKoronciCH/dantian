import { buildClassicStore } from '../..';

export interface CounterState {
  count: number;
}

const counterStore3Builder = await buildClassicStore<CounterState>({
  hydrator: async () => await Promise.resolve({ count: 88 }),
  beforeLoadState: { count: 0 },
});
const { useStore, useSelector: useCounterPromiseSelector } =
  counterStore3Builder;

export { useCounterPromiseSelector };
export default useStore;
