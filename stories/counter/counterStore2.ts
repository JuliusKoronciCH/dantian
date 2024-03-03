import { buildStore } from '../../lib';

export interface Counter2State {
  count: number;
}
const counter2StoreBuilder = buildStore<Counter2State>({ count: 0 });
const { useStore } = counter2StoreBuilder;

export default useStore;
