import { BehaviorSubject, Observable } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  scan,
  startWith,
  tap,
} from 'rxjs/operators';
import { GetValueType, NestedEvent, PropertyPath, SystemEvent } from './types';
import { set, get } from 'lodash/fp';
import { useCallback, useEffect, useState } from 'react';

export function createEventStore<T extends object>(
  initialState: T,
  options?: {
    debug?: boolean;
    hydrator: () => Promise<T>;
    persist?: (state: T) => Promise<void>;
  },
) {
  const debug = !!options?.debug;
  const globalEventStore = new BehaviorSubject<NestedEvent<T> | SystemEvent<T>>(
    {
      type: '@@INIT',
      payload: initialState,
    },
  );
  const publish = (event: NestedEvent<T>) => globalEventStore.next(event);

  const getPropertyObservable = (
    eventType: PropertyPath<T>,
  ): Observable<GetValueType<T, PropertyPath<T>>> => {
    return globalEventStore.pipe(
      filter((event) => event.type === eventType),
      map((event) => event.payload as GetValueType<T, PropertyPath<T>>),
      scan((__, curr) => curr),
      distinctUntilChanged(),
    );
  };

  const getHydrationObservable$ = (): Observable<T> => {
    return globalEventStore.pipe(
      filter((event) => event.type === '@@HYDRATED'),
      map((event) => event.payload as T),
      scan((__, curr) => curr),
      distinctUntilChanged(),
    );
  };

  const state$ = new BehaviorSubject<T>(initialState);

  globalEventStore
    .pipe(
      tap((event) => {
        if (debug) {
          console.info(event);
        }
      }),
      scan((state, event) => {
        if (event.type === '@@INIT' || event.type === '@@HYDRATED') {
          return event.payload as T;
        }
        return set(event.type, event.payload, state);
      }, initialState),
      tap((state) => {
        if (debug) {
          console.info('State after update', state);
        }
      }),
      startWith(initialState),
    )
    .subscribe(state$);

  options
    ?.hydrator?.()
    .then((payload) => {
      globalEventStore.next({ type: '@@HYDRATED', payload });
    })
    .catch((error) => {
      console.error('Failed to hydrate store', error);
    });

  state$.subscribe({ next: options?.persist });

  const useStoreValue = (type: PropertyPath<T>) => {
    const [value, setValue] = useState<GetValueType<T, PropertyPath<T>>>(
      get(type, state$.getValue()),
    );
    const handleUpdate = useCallback(
      (payload: GetValueType<T, PropertyPath<T>>) => {
        publish({ type, payload });
      },
      [],
    );
    useEffect(() => {
      const subscription = getHydrationObservable$().subscribe({
        next: (nextState) => {
          setValue(get(type, nextState));
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, []);

    useEffect(() => {
      const subscription = getPropertyObservable(type).subscribe({
        next: (value) => {
          setValue(value);
        },
      });
      return () => {
        subscription.unsubscribe();
      };
    }, []);

    return [value, handleUpdate];
  };
  const useHydrateStore = () => {
    return (payload: T) =>
      globalEventStore.next({ type: '@@HYDRATED', payload });
  };
  const useIsHydrated = () => {
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
      const subscription = getHydrationObservable$().subscribe({
        next: () => {
          setIsHydrated(true);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, []);
    return isHydrated;
  };
  const systemEvents$ = globalEventStore.pipe(
    filter((event) => event.type.startsWith('@@')),
  );

  return {
    useStoreValue,
    useHydrateStore,
    useIsHydrated,
    publish,
    getPropertyObservable,
    state$,
    systemEvents$,
  };
}
