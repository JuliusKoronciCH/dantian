import React, { useEffect } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { buildClassicStore } from '../classic-store';

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

describe('classic-store', () => {
  it('builds a store from a default state', async () => {
    const store = await buildClassicStore({ count: 0 });

    expect(store.getValue()).toEqual({ count: 0 });

    store.update((prev) => ({ count: prev.count + 1 }));

    expect(store.getValue()).toEqual({ count: 1 });
  });

  it('uses beforeLoadState until hydration resolves', async () => {
    vi.useFakeTimers();
    const store = await buildClassicStore({
      hydrator: async () =>
        await new Promise<{ count: number }>((resolve) => {
          setTimeout(() => resolve({ count: 88 }), 10);
        }),
      beforeLoadState: { count: 0 },
    });

    expect(store.getValue()).toEqual({ count: 0 });

    await act(async () => {
      vi.advanceTimersByTime(10);
      await Promise.resolve();
    });

    expect(store.getValue()).toEqual({ count: 88 });
    vi.useRealTimers();
  });

  it('useStore reflects updates', async () => {
    const store = await buildClassicStore({ count: 0 });
    const updateRef: {
      current?: (
        updater: (prev: { count: number }) => { count: number },
      ) => void;
    } = {};

    const App = () => {
      const [state, update] = store.useStore();
      useEffect(() => {
        updateRef.current = update;
      }, [update]);
      return <span data-testid="count">{state.count}</span>;
    };

    const { container, unmount } = render(<App />);

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '0',
    );

    act(() => {
      updateRef.current?.((prev) => ({ count: prev.count + 1 }));
    });

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '1',
    );

    unmount();
  });

  it('uses server snapshot during SSR', async () => {
    const store = await buildClassicStore({ count: 3 });

    const App = () => {
      const [state] = store.useStore();
      return <span>{state.count}</span>;
    };

    const html = renderToString(<App />);

    expect(html).toContain('3');
  });

  it('useSelector reflects selected values', async () => {
    const store = await buildClassicStore({ count: 2 });

    const App = () => {
      const count = store.useSelector((state) => state.count);
      return <span data-testid="count">{count}</span>;
    };

    const { container, unmount } = render(<App />);

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '2',
    );

    act(() => {
      store.update((prev) => ({ count: prev.count + 3 }));
    });

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '5',
    );

    unmount();
  });

  it('avoids re-render when selected value is unchanged', async () => {
    const store = await buildClassicStore({ count: 1, other: 0 });
    let renders = 0;

    const App = () => {
      renders += 1;
      const count = store.useSelector((state) => state.count);
      return <span data-testid="count">{count}</span>;
    };

    const { container, unmount } = render(<App />);

    expect(container.querySelector('[data-testid="count"]')?.textContent).toBe(
      '1',
    );
    expect(renders).toBe(1);

    act(() => {
      store.update((prev) => ({ ...prev, other: prev.other + 1 }));
    });

    expect(renders).toBe(1);

    act(() => {
      store.update((prev) => ({ ...prev, count: prev.count + 1 }));
    });

    expect(renders).toBe(2);

    unmount();
  });

  it('invokes persist callbacks on updates', async () => {
    const persist = vi.fn();

    const store = await buildClassicStore({
      hydrator: async () => ({ count: 0 }),
      beforeLoadState: { count: -1 },
      persist,
    });

    await Promise.resolve();
    persist.mockClear();

    store.update((prev) => ({ count: prev.count + 1 }));

    expect(persist).toHaveBeenLastCalledWith({ count: 1 });
  });

  it('logs persist errors instead of throwing', async () => {
    const error = new Error('persist failed');
    const persist = vi.fn().mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const store = await buildClassicStore({
      hydrator: async () => ({ count: 0 }),
      beforeLoadState: { count: 0 },
      persist,
    });

    await Promise.resolve();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to persist store', error);

    consoleSpy.mockClear();
    store.update((prev) => ({ count: prev.count + 1 }));
    await Promise.resolve();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to persist store', error);

    consoleSpy.mockRestore();
  });

  it('logs hydrate errors instead of throwing', async () => {
    const error = new Error('hydrate failed');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await buildClassicStore({
      hydrator: async () => {
        throw error;
      },
      beforeLoadState: { count: 0 },
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to hydrate store', error);

    consoleSpy.mockRestore();
  });
});
