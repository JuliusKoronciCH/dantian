import { createEventStore } from '../../lib';
import { State } from './state';

export const {
  state$,
  useStoreValue,
  useHydrateStore,
  useIsHydrated,
  getPropertyObservable,
  globalEventStore$,
  publish,
  systemEvents$,
} = createEventStore<State>(
  {
    user: { address: { city: 'n/a', street: 'n/a' }, name: 'n/a' },
  },
  {
    hydrator: () => {
      return new Promise((resolve) => {
        setTimeout(
          () =>
            resolve({
              user: {
                address: {
                  city: 'Aubonne',
                  street: 'Chemin du Mont-Blanc 16',
                },
                name: 'Julius',
              },
            }),
          3000,
        );
      });
    },
    debug: true,
  },
);
