import { Flex, Text, Button } from '@radix-ui/themes';
import useStore, { useCounterSelector } from './counterStore';

const CountText = () => {
  const count = useCounterSelector((state) => state.count);

  return (
    <Text data-testid="counter1-count">We are counting first: {count}</Text>
  );
};

export const Counter = () => {
  const [, updateCount] = useStore();
  const increment = () => {
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));
  };

  return (
    <Flex direction="column" gap="2" data-testid="counter1">
      <CountText />
      <Button onClick={increment} data-testid="counter1-increment">
        Let&apos;s go, first counter
      </Button>
    </Flex>
  );
};
