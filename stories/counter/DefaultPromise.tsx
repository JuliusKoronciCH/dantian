import { Button, Flex, Text } from '@radix-ui/themes';
import React from 'react';
import useStore, { useCounterPromiseSelector } from './counterStorePromise';

export const DefaultPromise = () => {
  const [, updateCount] = useStore();
  const count = useCounterPromiseSelector((state) => state.count);
  const increment = () =>
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));
  return (
    <Flex direction="column" gap="2">
      <Text>We are counting hydrating default: {count}</Text>
      <Button onClick={increment}>Let's go, promise counter</Button>
    </Flex>
  );
};
