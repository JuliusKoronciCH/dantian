import { BehaviorSubject, Subject, type Observable } from 'rxjs';
import {
  auditTime,
  distinctUntilChanged,
  filter,
  map,
  scan,
  share,
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

import { useCallback, useEffect, useMemo, useState } from 'react';

export function createEventStore<T extends object>(
  initialState: T,
  options?: {
    debug?: boolean;
    hydrator?: () => Promise<T>;
    persist?: (state: T) => Promise<void>;
  },
) {
  const debug = options?.debug === true ? options.debug : false;
  const globalEventStore$ = new BehaviorSubject<
    NestedEvent<T> | SystemEvent<T>
  >({
    type: '@@INIT',
    payload: initialState,
  });
  const publish = <
    TType extends PropertyPath<T>,
    TPayload extends GetValueType<T, TType>,
  >(
    type: TType,
    payload: TPayload,
  ) => {
    // eslint-disable-next-line
    const event = { type, payload } as NestedEvent<T>;
    globalEventStore$.next(event);
  };

  const getPropertyObservable = <K extends PropertyPath<T>>(
    eventType: K,
    throttle?: number,
  ): Observable<GetValueType<T, K>> => {
    const observable = globalEventStore$.pipe(
      filter((event) => event.type === eventType),
      map((event) => event.payload as GetValueType<T, K>),
      share({ connector: () => new Subject(), resetOnRefCountZero: true }),
    );
    if (throttle) {
      observable.pipe(auditTime(throttle));
    }
    return observable;
  };

  const getChildPropertyObservable = <K extends PropertyPath<T>>(
    eventType: K,
    throttle?: number,
  ) => {
    const observable = globalEventStore$.pipe(
      filter((event) => event.type.startsWith(`${eventType}.`)),
      share({ connector: () => new Subject(), resetOnRefCountZero: true }),
    );
    if (throttle) {
      observable.pipe(auditTime(throttle));
    }
    return observable;
  };

  const getHydrationObservable$ = (): Observable<T> => {
    return globalEventStore$.pipe(
      filter((event) => event.type === '@@HYDRATED'),
      map((event) => event.payload as T),
      scan((__, curr) => curr),
      distinctUntilChanged(),
    );
  };

  const getResetObservable$ = (): Observable<T> => {
    return globalEventStore$.pipe(
      filter((event) => event.type === '@@RESET'),
      map((event) => event.payload as T),
      scan((__, curr) => curr),
      distinctUntilChanged(),
    );
  };
  const getFeedObservable$ = (): Observable<T> => {
    return globalEventStore$.pipe(
      filter((event) => event.type === '@@FEED'),
      map((event) => event.payload as T),
      scan((__, curr) => curr),
      distinctUntilChanged(),
    );
  };

  const state$ = new BehaviorSubject<T>(initialState);
  const hydrationState$ = new BehaviorSubject(false);

  globalEventStore$
    .pipe(
      tap((event) => {
        if (debug) {
          console.info(event);
        }
      }),
      scan((state, event) => {
        if (
          event.type === '@@INIT' ||
          event.type === '@@HYDRATED' ||
          event.type === '@@RESET' ||
          event.type === '@@FEED'
        ) {
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

  globalEventStore$.pipe(scan((state, event) => {
    if (
      event.type === '@@INIT' ||
      event.type === '@@RESET'
    ) {
      return false;
    }
    if (event.type === '@@HYDRATED') {
      return true;
    }
    return state;
  }, false)).subscribe(hydrationState$);

  options
    ?.hydrator?.()
    .then((payload) => {
      globalEventStore$.next({ type: '@@HYDRATED', payload });
    })
    .catch((error) => {
      console.error('Failed to hydrate store', error);
    });

  state$.subscribe({ next: options?.persist });

  const useStoreValue = <K extends PropertyPath<T>>(
    type: K,
    options?: { disableCache?: boolean; throtle?: number },
  ): [GetValueType<T, K>, (payload: GetValueType<T, K>) => void] => {
    const disableCache = options?.disableCache ?? false;

    const defaultValue: GetValueType<T, K> = get(type, state$.getValue());

    const [value, setValue] = useState<GetValueType<T, K>>(defaultValue);

    const handleUpdate = useCallback((payload: GetValueType<T, K>) => {
      if (!disableCache) setValue(payload);
      publish(type, payload);
    }, []);

    const restoreValueFromState$ = () => {
      const stateValue: GetValueType<T, K> = get(type, state$.getValue());
      setValue(stateValue);
    };

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
      const subscription = getResetObservable$().subscribe({
        next: (nextState) => {
          setValue(get(type, nextState) as GetValueType<T, K>);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, []);
    useEffect(() => {
      const subscription = getFeedObservable$().subscribe({
        next: (nextState) => {
          setValue(get(type, nextState) as GetValueType<T, K>);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, []);

    useEffect(() => {
      const subscription = getPropertyObservable(
        type,
        options?.throtle,
      ).subscribe({
        next: (value) => {
          setValue(value);
        },
      });
      return () => {
        subscription.unsubscribe();
      };
    }, []);
    useEffect(() => {
      const subscription = getChildPropertyObservable(
        type,
        options?.throtle,
      ).subscribe({
        next: (event) => {
          if (debug) console.log('CHILD PROPERTY OBSERVABLE', event);
          setTimeout(restoreValueFromState$);
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
      globalEventStore$.next({ type: '@@HYDRATED', payload });
    }, []);
  };
  const useIsHydrated = () => {
    const [isHydrated, setIsHydrated] = useState(hydrationState$.getValue());
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
    useEffect(() => {
      const subscription = getResetObservable$().subscribe({
        next: () => {
          setIsHydrated(false);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, []);

    return useMemo(() => isHydrated, [isHydrated]);
  };
  const systemEvents$ = globalEventStore$.pipe(
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
    globalEventStore$,
  };
}
