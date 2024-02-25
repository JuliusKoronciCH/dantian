import React from 'react';
import { Flex, Text, Button } from '@radix-ui/themes';
import { buildStore } from '../../lib/index';

interface CounterState {
  count: number;
}
const counterStoreBuilder = buildStore<CounterState>({ count: 0 });
const { useStore } = counterStoreBuilder;

export const Counter = () => {
  const [state, updateCount] = useStore();
  const increment = () =>
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));

  return (
    <Flex direction="column" gap="2">
      <Text>Hello from Radix Themes :) ..we are counting: {state.count}</Text>
      <Button onClick={increment}>Let's go</Button>
    </Flex>
  );
};
