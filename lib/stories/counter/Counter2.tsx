import { Flex, Text, Button } from '@radix-ui/themes';

import useStore, { useCounter2Selector } from './counterStore2';

const CountText = () => {
  const count = useCounter2Selector((state) => state.count);

  return (
    <Text data-testid="counter2-count">We are counting second: {count}</Text>
  );
};

export const Counter2 = () => {
  const [, updateCount] = useStore();
  const increment = () => {
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));
  };

  return (
    <Flex direction="column" gap="2" data-testid="counter2">
      <CountText />
      <Button onClick={increment} data-testid="counter2-increment">
        Let&apos;s go, second counter
      </Button>
    </Flex>
  );
};
