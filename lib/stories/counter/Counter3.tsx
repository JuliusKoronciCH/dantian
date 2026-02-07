import { Flex, Text, Button } from '@radix-ui/themes';
import useStore from './counterStore2';

export const Counter3 = () => {
  const [state, updateCount] = useStore();
  const increment = () => {
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));
  };

  return (
    <Flex direction="column" gap="2" data-testid="counter3">
      <Text data-testid="counter3-count">
        We are counting third: {state.count}
      </Text>
      <Button onClick={increment} data-testid="counter3-increment">
        Let&apos;s go, third counter, reusing second store
      </Button>
    </Flex>
  );
};
