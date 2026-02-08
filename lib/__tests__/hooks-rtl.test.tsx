import { act } from 'react-dom/test-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildClassicStore } from '../classic-store';
import { createEventStore } from '../event-store';

describe('hooks (React Testing Library)', () => {
  it('updates useStoreValue via user interaction', () => {
    const store = createEventStore({ count: 0 });

    const App = () => {
      const [count, update] = store.useStoreValue('count');
      return (
        <button
          type="button"
          data-testid="count"
          onClick={() => update(count + 1)}
        >
          {count}
        </button>
      );
    };

    render(<App />);

    const button = screen.getByTestId('count');
    expect(button.textContent).toBe('0');

    fireEvent.click(button);

    expect(button.textContent).toBe('1');
  });

  it('toggles useIsHydrated after hydrate', () => {
    const store = createEventStore({ count: 0 });

    const App = () => {
      const hydrate = store.useHydrateStore();
      const hydrated = store.useIsHydrated();
      return (
        <div>
          <span data-testid="hydrated">{String(hydrated)}</span>
          <button type="button" onClick={() => hydrate({ count: 1 })}>
            hydrate
          </button>
        </div>
      );
    };

    render(<App />);

    expect(screen.getByTestId('hydrated').textContent).toBe('false');

    fireEvent.click(screen.getByText('hydrate'));

    expect(screen.getByTestId('hydrated').textContent).toBe('true');
  });

  it('reflects classic-store useSelector updates', async () => {
    const store = await buildClassicStore({ count: 1 });

    const App = () => {
      const count = store.useSelector((state) => state.count);
      return <span data-testid="count">{count}</span>;
    };

    render(<App />);

    expect(screen.getByTestId('count').textContent).toBe('1');

    act(() => {
      store.update((prev) => ({ count: prev.count + 1 }));
    });

    expect(screen.getByTestId('count').textContent).toBe('2');
  });
});
