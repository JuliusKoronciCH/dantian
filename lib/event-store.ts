import { BehaviorSubject, type Observable } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  scan,
  startWith,
  tap,
} from 'rxjs/operators';
import {
  type GetValueType,
  type NestedEvent,
  type PropertyPath,
  type SystemEvent,
} from './types';
import { set, get } from 'lodash/fp';

import { useCallback, useEffect, useState } from 'react';

export function createEventStore<T extends object>(
  initialState: T,
  options?: {
    debug?: boolean;
    hydrator?: () => Promise<T>;
    persist?: (state: T) => Promise<void>;
  },
) {
  const debug = options?.debug === true ? options.debug : false;
  const globalEventStore = new BehaviorSubject<NestedEvent<T> | SystemEvent<T>>(
    {
      type: '@@INIT',
      payload: initialState,
    },
  );
  const publish = <
    TType extends PropertyPath<T>,
    TPayload extends GetValueType<T, TType>,
  >(
    type: TType,
    payload: TPayload,
  ) => {
    // eslint-disable-next-line
    const event = { type, payload } as NestedEvent<T>;
    globalEventStore.next(event);
  };

  const getPropertyObservable = <K extends PropertyPath<T>>(
    eventType: K,
  ): Observable<GetValueType<T, K>> => {
    return globalEventStore.pipe(
      filter((event) => event.type.startsWith(eventType)),
      map((event) => event.payload as GetValueType<T, K>),
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

  const useStoreValue = <K extends PropertyPath<T>>(
    type: K,
  ): [GetValueType<T, K>, (payload: GetValueType<T, K>) => void] => {
    const defaultValue: GetValueType<T, K> = get(type, state$.getValue());
    const [value, setValue] = useState<GetValueType<T, K>>(defaultValue);
    const handleUpdate = useCallback((payload: GetValueType<T, K>) => {
      publish(type, payload);
    }, []);

    useEffect(() => {
      const subscription = getHydrationObservable$().subscribe({
        next: (nextState) => {
          setValue(get(type, nextState) as GetValueType<T, K>);
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
    return useCallback((payload: T) => {
      globalEventStore.next({ type: '@@HYDRATED', payload });
    }, []);
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
