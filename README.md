# Dantian

Event-based state management for React, powered by RxJS. Dantian exposes a small event store API and React hooks that subscribe to specific property paths, so only the parts of UI that care about a given event re-render.

## Installation

```bash
npm install dantian
```

## Compatibility

| Runtime | Supported versions |
| ------- | ------------------ |
| React   | 18, 19             |
| RxJS    | 7, 8               |
| Node    | 18, 20, 22         |

## Use Cases & FAQ

### Quickstart: event store basics

```ts
// store.ts
import { createEventStore } from 'dantian';

export const store = createEventStore({
  count: 0,
  user: { name: 'n/a' },
});

export const {
  useStoreValue,
  publish,
  useHydrateStore,
  useIsHydrated,
  reset,
  feed,
  destroy,
  state$,
  systemEvents$,
} = store;
```

```tsx
// Counter.tsx
import { useStoreValue } from './store';

export function Counter() {
  const [count, setCount] = useStoreValue('count');

  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

At a glance, `createEventStore` maintains a stream of events and derives state from them. Updates are published by property path (for example, `user.name`), and hooks subscribe to those paths.

### How do I update nested fields?

```tsx
const [name, setName] = useStoreValue('user.name');
setName('Ada');

// Or outside React:
publish('user.name', 'Ada');
```

### How do I hydrate from an async source?

```ts
const store = createEventStore(
  { user: { name: 'n/a' } },
  {
    hydrator: async () => {
      const response = await fetch('/api/profile');
      return (await response.json()) as { user: { name: string } };
    },
  },
);
```

### How do I persist state?

```ts
const store = createEventStore(
  { count: 0 },
  {
    persist: async (state) => {
      localStorage.setItem('dantianState', JSON.stringify(state));
    },
  },
);
```

If hydration or persistence fails, you can observe the error via system events
while console errors remain intact:

```ts
systemEvents$.subscribe((event) => {
  if (event.type === '@@HYDRATE_ERROR' || event.type === '@@PERSIST_ERROR') {
    console.error('store error', event.payload.error);
  }
});
```

### How do I avoid flicker from concurrent updates?

If updates are coming from multiple sources, you can disable local caching per hook:

```tsx
const [value, setValue] = useStoreValue('profile.name', {
  disableCache: true,
});
```

You can also throttle update propagation with `throttle` (milliseconds):

```tsx
const [user] = useStoreValue('user', { throttle: 50 });
```

### How do I reset or feed state?

```ts
reset({ count: 0, user: { name: 'n/a' } });
feed({ count: 5, user: { name: 'Julius' } });
```

### How do I subscribe outside React?

```ts
const subscription = state$.subscribe((state) => {
  console.log('state changed', state);
});

subscription.unsubscribe();
```

### Dispose of a store

If a store is no longer needed, dispose of it to complete internal subjects and
prevent lingering subscriptions:

```ts
store.destroy();
```

After `destroy()`, calls to `publish`, `reset`, `feed`, and the callback from
`useHydrateStore()` are no-ops.

## Task Guides

### Create a store

```ts
import { createEventStore } from 'dantian';

const store = createEventStore({ count: 0 }, { debug: false });
```

### Read and update values in components

```tsx
const [count, setCount] = store.useStoreValue('count');
setCount(count + 1);

// Or publish directly
store.publish('count', 42);
```

`useStoreValue` options:

- `disableCache`: bypasses local caching to avoid flicker in edge cases.
- `throttle`: throttles updates in milliseconds.
- `throtle`: legacy alias for `throttle` (kept for backward compatibility).

### Hydrate and persist

```ts
const store = createEventStore(
  { count: 0 },
  {
    hydrator: async () => ({ count: 10 }),
    persist: async (state) => {
      localStorage.setItem('dantianState', JSON.stringify(state));
    },
  },
);
```

In React, you can trigger hydration manually:

```tsx
const hydrate = store.useHydrateStore();
const isHydrated = store.useIsHydrated();
```

### Reset and feed

```ts
store.reset({ count: 0 });
store.feed({ count: 5 });
```

### Destroy

```ts
store.destroy();
```

### Observe with RxJS

```ts
const sub = store.getPropertyObservable('count').subscribe((value) => {
  console.log('count changed', value);
});

sub.unsubscribe();
```

### Classic store basics

If you need a minimal store with selectors and updates, use `buildClassicStore`:

```ts
import { buildClassicStore } from 'dantian';

const classic = await buildClassicStore({ count: 0 });
const [state, update] = classic.useStore();
const count = classic.useSelector((s) => s.count);
update((prev) => ({ ...prev, count: prev.count + 1 }));
```

With hydration and persistence:

```ts
const classic = await buildClassicStore({
  beforeLoadState: { count: 0 },
  hydrator: async () => ({ count: 2 }),
  persist: async (state) => {
    localStorage.setItem('classicState', JSON.stringify(state));
  },
});
```

## API Reference

### `createEventStore<T extends object>(initialState, options?)`

Options:

- `debug?: boolean` — log events and state transitions.
- `hydrator?: () => Promise<T>` — async hydration source.
- `persist?: (state: T) => Promise<void>` — persistence callback.

Returns:

- `useStoreValue<K>(path, options?)`: React hook for reading/updating a property path.
- `publish(path, payload)`: publish an event for a property path.
- `getPropertyObservable(path, throttle?)`: RxJS observable for a property path.
- `useHydrateStore()`: returns a function to emit `@@HYDRATED` with payload.
- `useIsHydrated()`: returns a boolean hydration flag.
- `reset(payload)`: emit `@@RESET` system event.
- `feed(payload)`: emit `@@FEED` system event.
- `state$`: `BehaviorSubject<T>` with current state.
- `globalEventStore$`: `BehaviorSubject` of all events.
- `systemEvents$`: observable of system events (event types starting with `@@`,
  including `@@HYDRATE_ERROR` and `@@PERSIST_ERROR`).
- `destroy()`: dispose the store, completing internal subjects and stopping
  further publishes.

`useStoreValue` options:

- `disableCache?: boolean`
- `throttle?: number`
- `throtle?: number` (legacy alias)

### `buildClassicStore<T>(defaultState)`

`defaultState` can be either a plain initial state or an object with:

- `beforeLoadState: T`
- `hydrator: () => Promise<T>`
- `persist?: (state: T) => Promise<void>`

Returns:

- `useStore()`: React hook for `[state, update]`.
- `useSelector(selector)`: React hook for derived values.
- `update(updater)`: update function.
- `getValue()`: current value getter.
- `subject$`: `BehaviorSubject<T>`.
- `defaultState`: the provided default state.

### `wuji`

Alias of `createEventStore`.

## Troubleshooting

- Hydration errors: `systemEvents$` emits `@@HYDRATE_ERROR` and the console logs
  `Failed to hydrate store`. Verify the hydrator resolves with the same shape
  as the initial state and handle thrown errors.
- Persist errors: `systemEvents$` emits `@@PERSIST_ERROR` and the console logs
  `Failed to persist store`. Ensure your persist callback returns a promise and
  handles storage quotas or serialization failures.
- Disposed stores still referenced: call `destroy()` when a store is no longer
  used, and avoid calling `publish/reset/feed` afterward.

## 1.0 Migration Notes

- No breaking changes are required.
- `destroy()` is now available to explicitly dispose of stores.
- `systemEvents$` now includes `@@HYDRATE_ERROR` and `@@PERSIST_ERROR` events.

## License

MIT
