import { buildClassicStore } from '../../lib';

export interface Counter2State {
  count: number;
}

const counter2StoreBuilder = await buildClassicStore<Counter2State>({
  count: 0,
});
const { useStore, useSelector: useCounter2Selector } = counter2StoreBuilder;

export { useCounter2Selector };
export default useStore;
