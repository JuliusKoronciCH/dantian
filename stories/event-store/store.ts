import { wuji } from '../../lib';

export const { state$, useStoreValue, useHydrateStore, useIsHydrated } =
  wuji<State>(
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
