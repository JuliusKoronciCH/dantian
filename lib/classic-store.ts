import { BehaviorSubject } from 'rxjs';
import { useSyncExternalStore } from 'react';

type UpdateFunction<T> = (state: T) => T;
type Updater<T> = (cb: UpdateFunction<T>) => void;

type DefaultState<T> =
  | T
  | {
      hydrator: () => Promise<T>;
      beforeLoadState: T;
      persist?: (state: T) => Promise<void>;
    };

interface StoreBuilder<T> {
  defaultState: DefaultState<T>;
  useStore: () => [T, Updater<T>];
  useSelector: <S>(selector: (state: T) => S) => S;
  subject$: BehaviorSubject<T>;
  update: Updater<T>;
  getValue: () => T;
}

const isDefaultState = <T>(
  defaultState: DefaultState<T>,
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
  defaultState: DefaultState<T>,
): Promise<StoreBuilder<T>> => {
  const initialState = isDefaultState<T>(defaultState)
    ? defaultState
    : defaultState.beforeLoadState;

  const store = new BehaviorSubject<T>(initialState);
  const persist = isDefaultState<T>(defaultState)
    ? undefined
    : defaultState.persist;

  const persistState = (state: T) => {
    if (!persist) return;
    Promise.resolve(persist(state)).catch((error) => {
      console.error('Failed to persist store', error);
    });
  };

  const update: Updater<T> = (updater) => {
    const nextState = updater(store.getValue());
    store.next(nextState);
    persistState(nextState);
  };

  const useStore = () => {
    const subscribe = (onStoreChange: () => void) => {
      const subscription = store.subscribe({
        next: onStoreChange,
        error: console.error,
      });

      return () => {
        subscription.unsubscribe();
      };
    };
    const state: T = useSyncExternalStore(
      subscribe,
      () => store.getValue(),
      () => initialState,
    );

    return [state, update] satisfies [T, Updater<T>];
  };

  const useSelector = <S>(selector: (state: T) => S) => {
    const getSnapshot = () => selector(store.getValue());
    const subscribe = (onStoreChange: () => void) => {
      let lastSelected = getSnapshot();
      const subscription = store.subscribe({
        next: (state) => {
          const nextSelected = selector(state);
          if (!Object.is(lastSelected, nextSelected)) {
            lastSelected = nextSelected;
            onStoreChange();
          }
        },
        error: console.error,
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };

  if (!isDefaultState<T>(defaultState)) {
    defaultState
      .hydrator()
      .then((hydratedState) => {
        store.next(hydratedState);
        persistState(hydratedState);
      })
      .catch((error) => {
        console.error('Failed to hydrate store', error);
      });
  }

  return {
    defaultState,
    useStore,
    useSelector,
    subject$: store,
    update,
    getValue: () => store.getValue(),
  };
};
