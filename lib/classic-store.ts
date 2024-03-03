import { BehaviorSubject } from 'rxjs';
import { useMemo, useSyncExternalStore } from 'react';

type UpdateFunction<T> = (state: T) => T;
type Updater<T> = (cb: UpdateFunction<T>) => void;

type DefaultState<T> =
  | T
  | {
    hydrator: () => Promise<T>
    beforeLoadState: T
    persist?: (state: T) => Promise<void>
  };

interface StoreBuilder<T> {
  defaultState: DefaultState<T>
  useStore: () => [T, Updater<T>]
  useSelector: <S>(selector: (state: T) => S) => S
  $subject: BehaviorSubject<T>
  update: Updater<T>
  getValue: () => T
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

const isDefaultState = <T>(
  defaultState: DefaultState<T>
): defaultState is T => {
  if (
    typeof defaultState === 'object' &&
    defaultState !== null &&
    'hydrator' in defaultState
  ) {
    return false;
  }
  return true;
};

export const buildClassicStore = async <T>(
  defaultState: DefaultState<T>
): Promise<StoreBuilder<T>> => {
  const initialState = isDefaultState<T>(defaultState)
    ? defaultState
    : await defaultState.hydrator();

  const getStoreInstance = createStore(initialState);

  const store = getStoreInstance();

  const update: Updater<T> = (updater) => {
    store.next(updater(store.getValue()));
  };

  const useStore = () => {
    const subscribe = (onStoreChange: () => void) => {
      const subscription = store.subscribe({
        next: onStoreChange,
        error: console.error
      });

      return () => {
        subscription.unsubscribe();
      };
    };
    const state: T = useSyncExternalStore(
      subscribe,
      () => store.getValue(),
      () => initialState
    );

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
    useSelector,
    $subject: store,
    update,
    getValue: () => store.getValue()
  };
};
