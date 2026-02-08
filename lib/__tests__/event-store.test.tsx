import React, { useEffect } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { createEventStore } from '../event-store';

const globalWithAct = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};
globalWithAct.IS_REACT_ACT_ENVIRONMENT = true;

const render = (ui: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
};

describe('event-store', () => {
  it('publishes updates into state$', () => {
    const store = createEventStore({
      count: 0,
      user: { name: 'n/a' },
    });

    store.publish('count', 2);
    store.publish('user.name', 'Julius');

    expect(store.state$.getValue().count).toBe(2);
    expect(store.state$.getValue().user.name).toBe('Julius');
  });

  it('emits values from getPropertyObservable', () => {
    const store = createEventStore({ count: 0 });
    const values: number[] = [];

    const subscription = store
      .getPropertyObservable('count')
      .subscribe((value) => values.push(value));

    store.publish('count', 1);
    store.publish('count', 2);

    expect(values).toEqual([1, 2]);

    subscription.unsubscribe();
  });

  it('updates hook values via useStoreValue', () => {
    const store = createEventStore({ count: 0 });
    const updateRef: { current?: (next: number) => void } = {};

    const App = () => {
      const [value, update] = store.useStoreValue('count');
      useEffect(() => {
        updateRef.current = update;
      }, [update]);
      return <span data-testid="count">{value}</span>;
    };

    const { container, unmount } = render(<App />);

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '0',
    );

    act(() => {
      updateRef.current?.(1);
    });

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '1',
    );

    unmount();
  });

  it('honors disableCache by still reflecting published updates', () => {
    const store = createEventStore({ count: 0 });
    const updateRef: { current?: (next: number) => void } = {};

    const App = () => {
      const [value, update] = store.useStoreValue('count', {
        disableCache: true,
      });
      useEffect(() => {
        updateRef.current = update;
      }, [update]);
      return <span data-testid="count">{value}</span>;
    };

    const { container, unmount } = render(<App />);

    act(() => {
      updateRef.current?.(5);
    });

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '5',
    );

    unmount();
  });

  it('tracks hydration state changes via system events', () => {
    const store = createEventStore({ count: 0 });
    const hydrateRef: { current?: (payload: { count: number }) => void } = {};

    const App = () => {
      const hydrate = store.useHydrateStore();
      const isHydrated = store.useIsHydrated();
      useEffect(() => {
        hydrateRef.current = hydrate;
      }, [hydrate]);
      return <span data-testid="hydrated">{String(isHydrated)}</span>;
    };

    const { container, unmount } = render(<App />);

    expect(
      container.querySelector('[data-testid="hydrated"]')?.textContent,
    ).toBe('false');

    act(() => {
      hydrateRef.current?.({ count: 1 });
    });

    expect(
      container.querySelector('[data-testid="hydrated"]')?.textContent,
    ).toBe('true');

    act(() => {
      store.globalEventStore$.next({
        type: '@@RESET',
        payload: { count: 0 },
      });
    });

    expect(
      container.querySelector('[data-testid="hydrated"]')?.textContent,
    ).toBe('false');

    unmount();
  });

  it('resets and feeds state via helpers', () => {
    const store = createEventStore({ count: 0 });

    store.publish('count', 2);
    expect(store.state$.getValue().count).toBe(2);

    store.reset({ count: 0 });
    expect(store.state$.getValue().count).toBe(0);

    store.feed({ count: 5 });
    expect(store.state$.getValue().count).toBe(5);
  });

  it('hydrates from options.hydrator', async () => {
    vi.useFakeTimers();
    const store = createEventStore(
      { count: 0 },
      {
        hydrator: async () =>
          await new Promise<{ count: number }>((resolve) => {
            setTimeout(() => resolve({ count: 3 }), 10);
          }),
      },
    );

    await act(async () => {
      vi.advanceTimersByTime(10);
      await Promise.resolve();
    });

    expect(store.state$.getValue().count).toBe(3);
    vi.useRealTimers();
  });

  it('invokes persist callback for state changes', () => {
    const persist = vi.fn();
    const store = createEventStore({ count: 0 }, { persist });

    expect(persist).toHaveBeenCalledWith({ count: 0 });

    store.publish('count', 2);

    expect(persist).toHaveBeenLastCalledWith({ count: 2 });
  });

  it('logs persist errors instead of throwing', async () => {
    const error = new Error('persist failed');
    const persist = vi.fn().mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const store = createEventStore({ count: 0 }, { persist });
    const events: Array<{ type: string; payload: { error: unknown } }> = [];
    const subscription = store.systemEvents$.subscribe((event) => {
      if (event.type === '@@PERSIST_ERROR') {
        events.push(event);
      }
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to persist store', error);
    expect(events).toEqual([{ type: '@@PERSIST_ERROR', payload: { error } }]);

    subscription.unsubscribe();
    consoleSpy.mockRestore();
  });

  it('emits hydrate error events while keeping console errors', async () => {
    const error = new Error('hydrate failed');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const store = createEventStore(
      { count: 0 },
      {
        hydrator: async () => {
          throw error;
        },
      },
    );

    const events: Array<{ type: string; payload: { error: unknown } }> = [];
    const subscription = store.systemEvents$.subscribe((event) => {
      if (event.type === '@@HYDRATE_ERROR') {
        events.push(event);
      }
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to hydrate store', error);
    expect(events).toEqual([{ type: '@@HYDRATE_ERROR', payload: { error } }]);

    subscription.unsubscribe();
    consoleSpy.mockRestore();
  });

  it('updates hook values on hydrate/reset/feed events', () => {
    const store = createEventStore({ count: 0 });
    const hydrateRef: { current?: (payload: { count: number }) => void } = {};

    const App = () => {
      const [value] = store.useStoreValue('count');
      const hydrate = store.useHydrateStore();
      useEffect(() => {
        hydrateRef.current = hydrate;
      }, [hydrate]);
      return <span data-testid="count">{value}</span>;
    };

    const { container, unmount } = render(<App />);

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '0',
    );

    act(() => {
      store.feed({ count: 5 });
    });

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '5',
    );

    act(() => {
      store.reset({ count: 2 });
    });

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '2',
    );

    act(() => {
      hydrateRef.current?.({ count: 7 });
    });

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '7',
    );

    unmount();
  });

  it('no-ops publish/reset/feed/hydrate after destroy and completes subjects', () => {
    const store = createEventStore({ count: 0 });
    const hydrateRef: { current?: (payload: { count: number }) => void } = {};
    const updateRef: { current?: (payload: number) => void } = {};

    const App = () => {
      const [value, update] = store.useStoreValue('count');
      const hydrate = store.useHydrateStore();
      useEffect(() => {
        hydrateRef.current = hydrate;
        updateRef.current = update;
      }, [hydrate, update]);
      return <span data-testid="count">{value}</span>;
    };

    const { container, unmount } = render(<App />);

    act(() => {
      updateRef.current?.(1);
    });

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '1',
    );

    const stateSubscription = store.state$.subscribe(() => {});
    const systemSubscription = store.systemEvents$.subscribe(() => {});

    store.destroy();
    store.destroy();

    store.publish('count', 2);
    store.reset({ count: 0 });
    store.feed({ count: 5 });

    act(() => {
      hydrateRef.current?.({ count: 10 });
      updateRef.current?.(2);
    });

    expect(store.state$.getValue().count).toBe(1);
    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '1',
    );
    expect(stateSubscription.closed).toBe(true);
    expect(systemSubscription.closed).toBe(true);

    unmount();
  });

  it('logs debug events when debug mode is enabled', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const store = createEventStore({ user: { name: 'n/a' } }, { debug: true });

    const App = () => {
      const [user] = store.useStoreValue('user');
      return <span data-testid="name">{user.name}</span>;
    };

    const { unmount } = render(<App />);

    act(() => {
      store.publish('user.name', 'Ada');
    });

    expect(infoSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();

    unmount();
    infoSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('throttles getPropertyObservable emissions', () => {
    vi.useFakeTimers();
    const store = createEventStore({ count: 0 });
    const values: number[] = [];

    const subscription = store
      .getPropertyObservable('count', 25)
      .subscribe((value) => values.push(value));

    store.publish('count', 1);
    store.publish('count', 2);

    expect(values).toEqual([]);

    vi.advanceTimersByTime(24);
    expect(values).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(values).toEqual([2]);

    subscription.unsubscribe();
    vi.useRealTimers();
  });

  it('throttles child event restores when throttle is provided', () => {
    vi.useFakeTimers();
    const store = createEventStore({ user: { name: 'n/a' } });
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    const App = () => {
      const [user] = store.useStoreValue('user', { throttle: 25 });
      return <span data-testid="name">{user.name}</span>;
    };

    const { unmount } = render(<App />);

    act(() => {
      store.publish('user.name', 'A');
      store.publish('user.name', 'B');
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(0);

    act(() => {
      vi.advanceTimersByTime(25);
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

    setTimeoutSpy.mockRestore();
    unmount();
    vi.useRealTimers();
  });

  it('updates parent values from child events even with legacy throtle option', () => {
    vi.useFakeTimers();
    const store = createEventStore({ user: { name: 'n/a' } });

    const App = () => {
      const [user] = store.useStoreValue('user', { throtle: 25 });
      return <span data-testid="name">{user.name}</span>;
    };

    const { container, unmount } = render(<App />);

    act(() => {
      store.publish('user.name', 'A');
      store.publish('user.name', 'B');
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(container.querySelector('[data-testid="name"]')?.textContent).toBe(
      'B',
    );

    unmount();
    vi.useRealTimers();
  });
});
