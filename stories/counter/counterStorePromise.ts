import { buildClassicStore } from '../../lib';

export interface CounterState {
  count: number;
}

const counterStore3Builder = await buildClassicStore<CounterState>({
  hydrator: () => Promise.resolve({ count: 88 }),
  beforeLoadState: { count: 0 },
});
const { useStore, useSelector: useCounterPromiseSelector } =
  counterStore3Builder;

export { useCounterPromiseSelector };
export default useStore;
