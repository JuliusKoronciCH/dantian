# Dantian - Event-Based State Management
# Dantian - Event-Based State Management

[![npm version](https://badge.fury.io/js/dantian.svg)](https://badge.fury.io/js/dantian)

Dantian is an event-based state management library designed specifically for React applications. By embracing an event-driven architecture, Dantian offers a fresh approach to managing application state, providing developers with flexibility, efficiency, and simplicity.

```
import { useStoreValue } from './store';

function ProfileForm() {
  const [name, setName] = useStoreValue('profile.name');
  const [city, setCity] = useStoreValue('profile.city');

  return (
    <form>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
    </form>
  );
}
```

## Why Dantian?

```mermaid
flowchart LR
  subgraph Initialization
    InitState["Initial State"] --> CreateStore["createEventStore() <br/> Dantian Event Store"]
  end

  subgraph Hydration
    HydrationSource["Hydration Source <br/> (API, localStorage, etc.)"] --> |@@HYDRATED| CreateStore
  end

  subgraph PropertyUpdate
    PublishEvent["publish(type, payload) <br/> Publish Event"] --> |type| CreateStore
    CreateStore --> |type| SubscribedComponents["Subscribed Components"]
    SubscribedComponents --> StateUpdate["Component State Update"]
    StateUpdate --> UI["UI Update"]
  end

```

### Efficient Updates

Dantian leverages events as triggers for state updates, ensuring that only components subscribed to relevant events are re-rendered. This approach minimizes unnecessary re-renders and improves overall performance, especially in applications with complex state interactions.

### Flexibility

With Dantian, developers have complete control over how state updates are handled. There's no need to adhere to predefined structures or patterns imposed by a library. Instead, developers can define their own logic and workflows tailored to their specific needs, empowering them to build React applications that are both powerful and flexible.

### Simplicity

By embracing a declarative and functional approach, Dantian simplifies state management logic. Developers can focus on defining pure functions and utilities to handle state updates, leading to cleaner, more maintainable code. With Dantian, state management becomes intuitive and straightforward, even for complex applications.

## Key Features

- **Event-Based Architecture**: Dantian relies on events to trigger state updates, providing a clear and efficient mechanism for managing application state.
- **Fine-Grained Control**: Developers can subscribe to specific events and define custom logic for handling state updates, giving them precise control over how their applications behave.
- **Optimized Performance**: By minimizing unnecessary re-renders and focusing on efficient updates, Dantian ensures optimal performance even in large-scale applications with complex state interactions.
- **Simplified Development**: With its intuitive API and focus on simplicity, Dantian makes state management easy and accessible for developers of all skill levels, reducing the learning curve and speeding up development time.

## The React Landscape

In the realm of React state management, various solutions like Zustand, Redux, and even React's built-in `useState` and `useReducer` hooks have become popular choices. However, they each come with their own set of trade-offs and considerations.

### Zustand and Redux

Zustand and Redux are excellent choices for managing global state in React applications. They offer centralized stores, actions, and reducers, making it easier to manage complex state interactions. However, they can sometimes introduce unnecessary boilerplate and complexity, especially for smaller applications or simple state management needs.

### useState and useReducer

On the other end of the spectrum, React's built-in `useState` and `useReducer` hooks provide a lightweight and straightforward way to manage local component state. They are perfect for managing state within individual components or handling simple UI interactions. However, they lack built-in mechanisms for managing global state or handling complex state interactions across multiple components.

## The Downside of Traditional Approaches

While these solutions have their merits, they often suffer from one common issue: excessive re-renders. Whether it's due to shallow comparisons, unnecessary updates, or complex state management logic, the result is the same: decreased performance and potential UI glitches.

## The Promise of Event Sourcing

Event-based state management offers a compelling alternative. By decoupling state updates from the underlying logic and relying solely on events to trigger updates, it provides a more predictable and efficient way to manage state.

### Benefits of Event Sourcing

- **Efficient Updates:** Events provide a clear trigger for state updates, ensuring that only the components subscribed to relevant events are re-rendered. This minimizes unnecessary re-renders and improves overall performance.
- **Flexibility:** With event sourcing, developers have complete control over how state updates are handled. There's no need to adhere to predefined structures or patterns imposed by a library. Instead, developers can define their own logic and workflows tailored to their specific needs.
- **Simplicity:** By embracing a more declarative and functional approach, event-based state management simplifies state management logic. Developers can focus on defining pure functions and utilities to handle state updates, leading to cleaner and more maintainable code.

## Conclusion

In a landscape filled with state management solutions, event-based state management offers a refreshing alternative. By prioritizing efficiency, flexibility, and simplicity, it empowers developers to build React applications that are performant, scalable, and easy to maintain.

---

This readme aims to shed light on the benefits of event-based state management in React applications, highlighting its advantages over traditional approaches and offering insights into its potential impact on application development. By embracing event sourcing, developers can unlock new possibilities and overcome the limitations of existing state management solutions.

## Installation
Dantian is an event-based state management library designed specifically for React applications. By embracing an event-driven architecture, Dantian offers a fresh approach to managing application state, providing developers with flexibility, efficiency, and simplicity.

```
import { useStoreValue } from './store';

function ProfileForm() {
  const [name, setName] = useStoreValue('profile.name');
  const [city, setCity] = useStoreValue('profile.city');

  return (
    <form>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
    </form>
  );
}
```

## Why Dantian?

```mermaid
flowchart LR
  subgraph Initialization
    InitState["Initial State"] --> CreateStore["createEventStore() <br/> Dantian Event Store"]
  end

  subgraph Hydration
    HydrationSource["Hydration Source <br/> (API, localStorage, etc.)"] --> |@@HYDRATED| CreateStore
  end

  subgraph PropertyUpdate
    PublishEvent["publish(type, payload) <br/> Publish Event"] --> |type| CreateStore
    CreateStore --> |type| SubscribedComponents["Subscribed Components"]
    SubscribedComponents --> StateUpdate["Component State Update"]
    StateUpdate --> UI["UI Update"]
  end

```

### Efficient Updates

Dantian leverages events as triggers for state updates, ensuring that only components subscribed to relevant events are re-rendered. This approach minimizes unnecessary re-renders and improves overall performance, especially in applications with complex state interactions.

### Flexibility

With Dantian, developers have complete control over how state updates are handled. There's no need to adhere to predefined structures or patterns imposed by a library. Instead, developers can define their own logic and workflows tailored to their specific needs, empowering them to build React applications that are both powerful and flexible.

### Simplicity

By embracing a declarative and functional approach, Dantian simplifies state management logic. Developers can focus on defining pure functions and utilities to handle state updates, leading to cleaner, more maintainable code. With Dantian, state management becomes intuitive and straightforward, even for complex applications.

## Key Features

- **Event-Based Architecture**: Dantian relies on events to trigger state updates, providing a clear and efficient mechanism for managing application state.
- **Fine-Grained Control**: Developers can subscribe to specific events and define custom logic for handling state updates, giving them precise control over how their applications behave.
- **Optimized Performance**: By minimizing unnecessary re-renders and focusing on efficient updates, Dantian ensures optimal performance even in large-scale applications with complex state interactions.
- **Simplified Development**: With its intuitive API and focus on simplicity, Dantian makes state management easy and accessible for developers of all skill levels, reducing the learning curve and speeding up development time.

## The React Landscape

In the realm of React state management, various solutions like Zustand, Redux, and even React's built-in `useState` and `useReducer` hooks have become popular choices. However, they each come with their own set of trade-offs and considerations.

### Zustand and Redux

Zustand and Redux are excellent choices for managing global state in React applications. They offer centralized stores, actions, and reducers, making it easier to manage complex state interactions. However, they can sometimes introduce unnecessary boilerplate and complexity, especially for smaller applications or simple state management needs.

### useState and useReducer

On the other end of the spectrum, React's built-in `useState` and `useReducer` hooks provide a lightweight and straightforward way to manage local component state. They are perfect for managing state within individual components or handling simple UI interactions. However, they lack built-in mechanisms for managing global state or handling complex state interactions across multiple components.

## The Downside of Traditional Approaches

While these solutions have their merits, they often suffer from one common issue: excessive re-renders. Whether it's due to shallow comparisons, unnecessary updates, or complex state management logic, the result is the same: decreased performance and potential UI glitches.

## The Promise of Event Sourcing

Event-based state management offers a compelling alternative. By decoupling state updates from the underlying logic and relying solely on events to trigger updates, it provides a more predictable and efficient way to manage state.

### Benefits of Event Sourcing

- **Efficient Updates:** Events provide a clear trigger for state updates, ensuring that only the components subscribed to relevant events are re-rendered. This minimizes unnecessary re-renders and improves overall performance.
- **Flexibility:** With event sourcing, developers have complete control over how state updates are handled. There's no need to adhere to predefined structures or patterns imposed by a library. Instead, developers can define their own logic and workflows tailored to their specific needs.
- **Simplicity:** By embracing a more declarative and functional approach, event-based state management simplifies state management logic. Developers can focus on defining pure functions and utilities to handle state updates, leading to cleaner and more maintainable code.

## Conclusion

In a landscape filled with state management solutions, event-based state management offers a refreshing alternative. By prioritizing efficiency, flexibility, and simplicity, it empowers developers to build React applications that are performant, scalable, and easy to maintain.

---

This readme aims to shed light on the benefits of event-based state management in React applications, highlighting its advantages over traditional approaches and offering insights into its potential impact on application development. By embracing event sourcing, developers can unlock new possibilities and overcome the limitations of existing state management solutions.

## Installation

```bash
npm install dantian
```

## Basic example

```
// store.ts
import { createEventStore } from 'dantian';

export const {
  state$,
  useStoreValue,
  useHydrateStore,
  useIsHydrated,
  getPropertyObservable,
  globalEventStore$,
  publish,
  systemEvents$,
} = createEventStore({
  count: 0,
  profile: { name: '', city: '' },
  data: null,
  isLoading: false
});

```

### Basic counter

```
// counter.tsx
import { useStoreValue, publish }  from './store';

function Counter() {
  const [count, setCount] = useStoreValue('count');
## Basic example

```
// store.ts
import { createEventStore } from 'dantian';

export const {
  state$,
  useStoreValue,
  useHydrateStore,
  useIsHydrated,
  getPropertyObservable,
  globalEventStore$,
  publish,
  systemEvents$,
} = createEventStore({
  count: 0,
  profile: { name: '', city: '' },
  data: null,
  isLoading: false
});

```

### Basic counter

```
// counter.tsx
import { useStoreValue, publish }  from './store';

function Counter() {
  const [count, setCount] = useStoreValue('count');

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}

```

### Profile form

```
import { useStoreValue, publish } from './store';

function ProfileForm() {
  const [name, setName] = useStoreValue('profile.name');
  const [city, setCity] = useStoreValue('profile.city');

  return (
    <form>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
    </form>
  );
}
```

### Hydration at store creation

```
import { createEventStore } from 'dantian';

export const {
  useStoreValue,
  useHydrateStore,
  useIsHydrated,
  publish,
  systemEvents$,
} = createEventStore({
  // Initial state ...
}, {
  hydrator: async () => {
    // Check if we have saved state in localStorage
    const storedState = localStorage.getItem('dantianState');
    if (storedState) {
      return JSON.parse(storedState);
    }

    // If no localStorage state, perhaps load defaults or fetch from API:
    // return await fetch('/api/initial-state').then(res => res.json());
  },
  persist: (state) => {
    try {
      localStorage.setItem('dantianState', JSON.stringify(state));
    } catch (error) {
      // Handle potential errors during state saving
      console.error('Failed to persist state', error);
    }
  }
});

```

```
import { useStoreValue, useIsHydrated } from './store';

function App() {
  const isHydrated = useIsHydrated();

  // ... other components

  return (
    <div>
      {isHydrated ? (
        {/* Render your main application content here */}
      ) : (
        <div>Loading application state...</div>
      )}
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}

```

### Profile form

```
import { useStoreValue, publish } from './store';

function ProfileForm() {
  const [name, setName] = useStoreValue('profile.name');
  const [city, setCity] = useStoreValue('profile.city');

  return (
    <form>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
    </form>
  );
}
```

### Hydration at store creation

```
import { createEventStore } from 'dantian';

export const {
  useStoreValue,
  useHydrateStore,
  useIsHydrated,
  publish,
  systemEvents$,
} = createEventStore({
  // Initial state ...
}, {
  hydrator: async () => {
    // Check if we have saved state in localStorage
    const storedState = localStorage.getItem('dantianState');
    if (storedState) {
      return JSON.parse(storedState);
    }

    // If no localStorage state, perhaps load defaults or fetch from API:
    // return await fetch('/api/initial-state').then(res => res.json());
  },
  persist: (state) => {
    try {
      localStorage.setItem('dantianState', JSON.stringify(state));
    } catch (error) {
      // Handle potential errors during state saving
      console.error('Failed to persist state', error);
    }
  }
});

```

```
import { useStoreValue, useIsHydrated } from './store';

function App() {
  const isHydrated = useIsHydrated();

  // ... other components

  return (
    <div>
      {isHydrated ? (
        {/* Render your main application content here */}
      ) : (
        <div>Loading application state...</div>
      )}
    </div>
  );
}
```

### Hydration within React

```
import { useStoreValue, useHydrateStore, useIsHydrated } from './store';
import { useEffect } from 'react';

function UserProfile() {
  const [profile, setProfile] = useStoreValue('profile');
  const hydrateProfile = useHydrateStore();
  const isHydrated = useIsHydrated();

  useEffect(() => {
    if (isHydrated) return;  // Exit if already hydrated

    const loadUserProfile = async () => {
      try {
        const fetchedProfile = await fetch('/api/profile').then((res) => res.json());
        hydrateProfile(fetchedProfile);
      } catch (error) {
        console.error('Error fetching profile', error);
      }
    };

    loadUserProfile();
  }, [isHydrated]); // Run useEffect when isHydrated changes

  return (
    <div>
      {isHydrated ? (
        <div>
          <p>Name: {profile.name}</p>
          <p>City: {profile.city}</p>
        </div>
      ) : (
        <div className="spinner-container">Loading profile...</div>
      )}
    </div>
  );
}

```

### Hydration and SSR

SSR offers performance and SEO benefits, but careful state management is crucial. Global singleton-based state libraries can introduce unintended side effects when rendering an application on the server:

- Shared State Across Requests: A single store instance shared across multiple user requests can lead to state contamination, with data from one user potentially bleeding into another's rendered output.
- Hydration Mismatches: Client-side hydration assumes it begins with the same global state the server rendered. Singleton-based stores can make this challenging.

#### Dantian's Approach

Dantian addresses these challenges through its approach to hydration and event-based state updates:

1. Hydration as Initialization: In Dantian, hydration is a method for initializing store values on the client. Updates are still driven by targeted events, preserving state isolation across user sessions.

2. Request-Specific Stores (If Needed): For SSR frameworks requiring independent stores per request, Dantian can be adapted:

- Create a new store instance within each server-side rendering request.
- Pass the initial state from this store to the client for hydration.

#### Example Code Snippet (Illustrative)

```
// Simplified SSR scenario
import { createEventStore } from 'dantian';

function renderAppToString(request) {
  // 1. Create a fresh store instance for each request
  const { useStoreValue } = createEventStore({
    ...requestSpecificInitialState
  });

  // ... Use useStoreValue within components during SSR ...

  // 3. Extract the store's state for client-side hydration
  const clientHydrationState = /* Get current store state */;

  return `
    ... HTML markup ...
    <script>
      window.__INITIAL_STATE__ = ${JSON.stringify(clientHydrationState)}
    </script>
  `;
}

```

## RxJS

```
import { useEffect } from 'react';
import { state$ } from './store';

function usePersistState(storageKey = 'dantianState') {
  useEffect(() => {
    const subscription = state$.subscribe((state) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save state', error);
      }
    });

    return () => subscription.unsubscribe();
  }, [storageKey]);
}

```

### useStoreValue

The `useStoreValue` hook is a fundamental part of the Dantian library, providing a powerful mechanism for accessing and updating state within React components. What sets `useStoreValue` apart is its integration with RxJS, a reactive programming library that enables efficient event handling and state management.

### Leveraging RxJS Observables

At its core, the `useStoreValue` hook utilizes RxJS observables to subscribe to changes in the underlying state. When you initially access a property using `useStoreValue`, it creates a subscription to the `state$` observable, which represents the current state of the application.

```javascript
const [count, setCount] = useStoreValue('count');
```

This initial subscription ensures that your component receives the latest value of the specified property and automatically updates whenever the state changes.

#### Event-Based Updates

In addition to the initial subscription to the state observable, useStoreValue also subscribes to the global event bus (globalEventStore$). This event bus emits events whenever state updates occur, allowing components to react to specific changes efficiently.

```
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

```

By combining the initial value subscription with event-based updates, useStoreValue achieves a balance between performance and flexibility. Components receive immediate updates from the local state, ensuring smooth user interactions, while also staying in sync with the global event store to handle changes from other parts of the application.

#### Caching

The `useStoreValue` hook offers control over local state caching, allowing you to fine-tune component updates for optimal performance.

```
import { useStoreValue } from './store';

// Access a property with default caching behavior
const [count, setCount] = useStoreValue('count');

// Access a property and disable caching
const [profileName, setProfileName] = useStoreValue('profile.name', { disableCache: true });

// Emit updates every 300ms to avoid too many rerenders
const [email, setEmail] = useStoreValue('profile.email', { throttle: 300 });

```

By default, useStoreValue maintains local state, ensuring immediate updates without waiting for a roundtrip through the global store. When the store is updated, the value is propagated back to the hook, synchronizing the local state.

This approach is generally effective and particularly powerful with controlled inputs, where there's no discernible difference from having a useState next to the input field. However, in certain edge cases where there are high-frequency updates originating from multiple sources, visual glitches may occur.

Imagine two events being fired almost simultaneously with different values. Although this scenario is typically indicative of a code smell, the result may be that the user sees one value immediately overwritten by another value. In such cases, disabling the local cache will yield a smoother outcome.

## License

MIT

## API Overview

- `createEventStore<T extends object>(initialState: T, options?: {...})`

  - Creates a new Dantian event store.
  - Parameters:
    - `initialState`: The initial state object of your store.
    - `options`: An optional object containing configuration settings:
      - `debug`: Enables debug logging (default: `false`).
      - `hydrator`: An asynchronous function returning a promise resolving to the hydration data.
      - `persist`: An asynchronous function to handle state persistence.

- `publish<TType extends PropertyPath<T>, TPayload extends GetValueType<T, TType>>(type: TType, payload: TPayload)`

  - Publishes an event to update the store.
  - Parameters:
    - `type`: The property path within the store to be updated (e.g., 'count', 'profile.name').
    - `payload`: The new value for the specified property.

- `getPropertyObservable<K extends PropertyPath<T>>(eventType: K, throtle?: number)`

  - Returns an RxJS Observable that emits values whenever the specified property in the store is updated.

- `getHydrationObservable$()`

  - Returns an RxJS Observable that emits values when the store is hydrated.

- `state$`

  - An RxJS BehaviorSubject that holds the current state of the store.

- `useStoreValue<K extends PropertyPath<T>>(type: K, options?: {...})`

  - React hook to access and update a specific property within the store.
  - Parameters:
    - `type`: The property path within the store.
    - `options.disableCache`:  property to control local caching behavior.
    - `options.throtle`: property to control frequency of updates.
  - Returns: An array containing:
    - The current value of the property.
    - A function to update the property.

- `useHydrateStore()`

  - React hook to trigger store hydration.
  - Returns: A function to initialize the store with hydrated data.

- `useIsHydrated()`

  - React hook to determine if the store is hydrated.
  - Returns: A boolean indicating hydration status.

- `systemEvents$`

  - An RxJS Observable that emits Dantian system events (e.g., '@@INIT', '@@HYDRATED').
