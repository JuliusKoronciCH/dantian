**Dantian - React State Management Reimagined**

[![npm version](https://badge.fury.io/js/dantian.svg)](https://badge.fury.io/js/dantian)

Dantian is an event-based state management library for React applications that delivers pinpoint performance and effortless integration with forms. Say goodbye to unnecessary rerenders and complex state comparisons – Dantian ensures that components only update when they subscribe to specific state changes.

**The Problem**

Traditional state management solutions in React often lead to performance issues, especially in applications with frequent updates or large forms. Unnecessary rerenders can slow down the user experience.

**Our Solution**

Dantian's event-driven approach focuses on precision. State updates are triggered by events, and only components subscribed to those events rerender. This provides granular control and optimizes performance where it matters most.

**Features**

- **useState-like hooks:** Familiar interface for ease of use.
- **Custom events:** Power and flexibility for complex scenarios.
- **Asynchronous state updates:** Handle async patterns gracefully.
- **Optimized form integration:** Tackle large forms without performance compromises.

**Installation**

```bash
npm install dantian
```

**Basic usage**

```TypeScript
import { useEventState } from 'dantian';

function MyComponent() {
  const [count, setCount] = useEventState('counter', 0);

  const increment = () => setCount(count + 1);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

**Getting Started**

**Why Dantian?**

Performance by design: Avoid unnecessary rerenders, especially in complex forms.
Developer-friendly: Intuitive API and seamless form integration.
**License**

MIT
