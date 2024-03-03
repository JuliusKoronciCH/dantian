import { BehaviorSubject } from 'rxjs';
import { useMemo, useSyncExternalStore } from 'react';

type UpdateFunction<T> = (state: T) => T;
type Updater<T> = (cb: UpdateFunction<T>) => void;
interface StoreBuilder<T> {
  defaultState: T
  useStore: () => [T, Updater<T>]
  useSelector: <S>(selector: (state: T) => S) => S
}

const createStore = <T>(initialState: T) => {
  let storeInstance: BehaviorSubject<T> | null = null;

  return () => {
    if (storeInstance === null) {
      storeInstance = new BehaviorSubject<T>(initialState);
    }
    return storeInstance;
  };
};

export const buildStore = <T>(defaultState: T): StoreBuilder<T> => {
  const getStoreInstance = createStore(defaultState);

  const useStore = () => {
    const store = getStoreInstance();

    const subscribe = (onStoreChange: () => void) => {
      const subscription = store.subscribe({
        next: onStoreChange,
        error: console.error
      });

      return () => {
        subscription.unsubscribe();
      };
    };
    const update: Updater<T> = (updater) => {
      store.next(updater(store.getValue()));
    };
    const state: T = useSyncExternalStore(subscribe, () => store.getValue());

    return [state, update] satisfies [T, Updater<T>];
  };

  const useSelector = <S>(selector: (state: T) => S) => {
    const [value] = useStore();

    const selectedValue = selector(value);

    return useMemo(() => selectedValue, [selectedValue]);
  };
  return {
    defaultState,
    useStore,
    useSelector
  };
};
