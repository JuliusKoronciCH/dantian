import React from 'react';
import { Flex, Text, Button } from '@radix-ui/themes';

import useStore from './counterStore2';

export const Counter2 = () => {
  const [state, updateCount] = useStore();
  const increment = () =>
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));

  return (
    <Flex direction="column" gap="2">
      <Text>We are counting second: {state.count}</Text>
      <Button onClick={increment}>Let's go, second counter</Button>
    </Flex>
  );
};
