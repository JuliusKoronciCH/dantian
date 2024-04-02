import { BehaviorSubject, Observable } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  scan,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { GetValueType, NestedEvent, PropertyPath, SystemEvent } from './types';
import { set, get } from 'lodash/fp';
import { useCallback, useEffect, useState } from 'react';

export function createEventStore<T extends object>(
  initialState: T,
  hydrateStore?: () => Promise<T>,
) {
  const globalEventStore = new BehaviorSubject<NestedEvent<T> | SystemEvent<T>>(
    {
      type: '@@INIT',
      payload: initialState,
    },
  );
  const publish = (event: NestedEvent<T>) => globalEventStore.next(event);

  const subscribe = (
    eventType: PropertyPath<T>,
  ): Observable<GetValueType<T, PropertyPath<T>>> => {
    return globalEventStore.pipe(
      filter((event) => event.type === eventType),
      map((event) => event.payload as GetValueType<T, PropertyPath<T>>),
      scan((__, curr) => curr),
      distinctUntilChanged(),
    );
  };

  const state$ = new BehaviorSubject<T>(initialState);

  globalEventStore
    .pipe(
      switchMap(async (event) => {
        if (event.type === '@@INIT' && hydrateStore) {
          const hydratedState = await hydrateStore();
          return { type: '@@HYDRATED', payload: hydratedState };
        } else {
          return event;
        }
      }),
      scan((state, event) => {
        if (event.type === '@@INIT' || event.type === '@@HYDRATED') {
          return event.payload as T;
        }
        return set(event.type, event.payload, state);
      }, initialState),
      startWith(initialState),
    )
    .subscribe(state$);

  const useStateProp = (type: PropertyPath<T>) => {
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
      const subscription = subscribe(type).subscribe({
        next: setValue,
      });
      return () => {
        subscription.unsubscribe();
      };
    });

    return [value, handleUpdate];
  };

  const systemEvents$ = globalEventStore.pipe(
    filter((event) => event.type.startsWith('@@')),
  );

  return { useStateProp, publish, subscribe, state$, systemEvents$ };
}
