import { Button, Flex, Text } from '@radix-ui/themes';
import useStore, { useCounterPromiseSelector } from './counterStorePromise';

export const DefaultPromise = () => {
  const [, updateCount] = useStore();
  const count = useCounterPromiseSelector((state) => state.count);
  const increment = () =>
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));
  return (
    <Flex direction="column" gap="2" data-testid="counter-promise">
      <Text data-testid="counter-promise-count">
        We are counting hydrating default: {count}
      </Text>
      <Button onClick={increment} data-testid="counter-promise-increment">
        Let&apos;s go, promise counter
      </Button>
    </Flex>
  );
};
