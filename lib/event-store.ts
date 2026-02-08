import {
  BehaviorSubject,
  Subject,
  type Observable,
  type Subscription,
} from 'rxjs';
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
  let destroyed = false;
  const internalSubscriptions: Subscription[] = [];
  const globalEventStore$ = new BehaviorSubject<
    NestedEvent<T> | SystemEvent<T>
  >({
    type: '@@INIT',
    payload: initialState,
  });
  const emitEvent = (event: NestedEvent<T> | SystemEvent<T>) => {
    if (destroyed) return;
    globalEventStore$.next(event);
  };
  const publish = <
    TType extends PropertyPath<T>,
    TPayload extends GetValueType<T, TType>,
  >(
    type: TType,
    payload: TPayload,
  ) => {
    const event = { type, payload } as NestedEvent<T>;
    emitEvent(event);
  };

  const getPropertyObservable = <K extends PropertyPath<T>>(
    eventType: K,
    throttle?: number,
  ): Observable<GetValueType<T, K>> => {
    let observable = globalEventStore$.pipe(
      filter((event) => event.type === eventType),
      map((event) => event.payload as GetValueType<T, K>),
      share({ connector: () => new Subject(), resetOnRefCountZero: true }),
    );
    if (throttle) {
      observable = observable.pipe(auditTime(throttle));
    }
    return observable;
  };

  const getChildPropertyObservable = <K extends PropertyPath<T>>(
    eventType: K,
    throttle?: number,
  ) => {
    let observable = globalEventStore$.pipe(
      filter((event) => event.type.startsWith(`${eventType}.`)),
      share({ connector: () => new Subject(), resetOnRefCountZero: true }),
    );
    if (throttle) {
      observable = observable.pipe(auditTime(throttle));
    }
    return observable;
  };

  const getHydrationObservable$ = (): Observable<T> => {
    return globalEventStore$.pipe(
      filter((event) => event.type === '@@HYDRATED'),
      map((event) => event.payload as T),
      distinctUntilChanged(),
    );
  };

  const getResetObservable$ = (): Observable<T> => {
    return globalEventStore$.pipe(
      filter((event) => event.type === '@@RESET'),
      map((event) => event.payload as T),
      distinctUntilChanged(),
    );
  };
  const getFeedObservable$ = (): Observable<T> => {
    return globalEventStore$.pipe(
      filter((event) => event.type === '@@FEED'),
      map((event) => event.payload as T),
      distinctUntilChanged(),
    );
  };

  const state$ = new BehaviorSubject<T>(initialState);
  const hydrationState$ = new BehaviorSubject(false);

  const stateSubscription = globalEventStore$
    .pipe(
      tap((event) => {
        if (debug) {
          console.info(event);
        }
      }),
      filter(
        (event) =>
          event.type !== '@@HYDRATE_ERROR' && event.type !== '@@PERSIST_ERROR',
      ),
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
  internalSubscriptions.push(stateSubscription);

  const hydrationSubscription = globalEventStore$
    .pipe(
      scan((state, event) => {
        if (event.type === '@@INIT' || event.type === '@@RESET') {
          return false;
        }
        if (event.type === '@@HYDRATED') {
          return true;
        }
        return state;
      }, false),
    )
    .subscribe(hydrationState$);
  internalSubscriptions.push(hydrationSubscription);

  options
    ?.hydrator?.()
    .then((payload) => {
      emitEvent({ type: '@@HYDRATED', payload });
    })
    .catch((error) => {
      console.error('Failed to hydrate store', error);
      emitEvent({ type: '@@HYDRATE_ERROR', payload: { error } });
    });

  const persist = options?.persist;
  if (persist) {
    const persistSubscription = state$.subscribe({
      next: (state) => {
        Promise.resolve(persist(state)).catch((error) => {
          console.error('Failed to persist store', error);
          emitEvent({ type: '@@PERSIST_ERROR', payload: { error } });
        });
      },
    });
    internalSubscriptions.push(persistSubscription);
  }

  const useStoreValue = <K extends PropertyPath<T>>(
    type: K,
    options?: { disableCache?: boolean; throttle?: number; throtle?: number },
  ): [GetValueType<T, K>, (payload: GetValueType<T, K>) => void] => {
    const disableCache = options?.disableCache ?? false;
    const throttle = options?.throttle ?? options?.throtle;

    const defaultValue: GetValueType<T, K> = get(type, state$.getValue());

    const [value, setValue] = useState<GetValueType<T, K>>(defaultValue);

    const handleUpdate = useCallback(
      (payload: GetValueType<T, K>) => {
        if (destroyed) return;
        if (!disableCache) setValue(payload);
        publish(type, payload);
      },
      [disableCache, publish, type],
    );

    const restoreValueFromState$ = useCallback(() => {
      const stateValue: GetValueType<T, K> = get(type, state$.getValue());
      setValue(stateValue);
    }, [type]);

    useEffect(() => {
      const subscription = getHydrationObservable$().subscribe({
        next: (nextState) => {
          setValue(get(type, nextState) as GetValueType<T, K>);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [getHydrationObservable$, type]);

    useEffect(() => {
      const subscription = getResetObservable$().subscribe({
        next: (nextState) => {
          setValue(get(type, nextState) as GetValueType<T, K>);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [getResetObservable$, type]);
    useEffect(() => {
      const subscription = getFeedObservable$().subscribe({
        next: (nextState) => {
          setValue(get(type, nextState) as GetValueType<T, K>);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [getFeedObservable$, type]);

    useEffect(() => {
      const subscription = getPropertyObservable(type, throttle).subscribe({
        next: (value) => {
          setValue(value);
        },
      });
      return () => {
        subscription.unsubscribe();
      };
    }, [getPropertyObservable, throttle, type]);
    useEffect(() => {
      const subscription = getChildPropertyObservable(type, throttle).subscribe(
        {
          next: (event) => {
            if (debug) console.log('CHILD PROPERTY OBSERVABLE', event);
            setTimeout(restoreValueFromState$, 0);
          },
        },
      );
      return () => {
        subscription.unsubscribe();
      };
    }, [
      debug,
      getChildPropertyObservable,
      restoreValueFromState$,
      throttle,
      type,
    ]);

    return [value, handleUpdate];
  };

  const useHydrateStore = () => {
    return useCallback(
      (payload: T) => {
        emitEvent({ type: '@@HYDRATED', payload });
      },
      [emitEvent],
    );
  };
  const reset = (payload: T) => {
    emitEvent({ type: '@@RESET', payload });
  };
  const feed = (payload: T) => {
    emitEvent({ type: '@@FEED', payload });
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
    }, [getHydrationObservable$]);
    useEffect(() => {
      const subscription = getResetObservable$().subscribe({
        next: () => {
          setIsHydrated(false);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [getResetObservable$]);

    return useMemo(() => isHydrated, [isHydrated]);
  };
  const systemEvents$ = globalEventStore$.pipe(
    filter((event) => event.type.startsWith('@@')),
  );
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    internalSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    globalEventStore$.complete();
    state$.complete();
    hydrationState$.complete();
  };

  return {
    useStoreValue,
    useHydrateStore,
    reset,
    feed,
    useIsHydrated,
    publish,
    getPropertyObservable,
    state$,
    systemEvents$,
    globalEventStore$,
    destroy,
  };
}
