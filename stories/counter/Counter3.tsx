import React from 'react';
import { Flex, Text, Button } from '@radix-ui/themes';
import useStore from './counterStore2';

export const Counter3 = () => {
  const [state, updateCount] = useStore();
  const increment = () =>
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));

  return (
    <Flex direction="column" gap="2">
      <Text>We are counting third: {state.count}</Text>
      <Button onClick={increment}>
        Let's go, third counter, reusing second store
      </Button>
    </Flex>
  );
};
