import { Flex, Text, Button } from '@radix-ui/themes';
import useStore, { useCounterSelector } from './counterStore';

const CountText = () => {
  const count = useCounterSelector((state) => state.count);

  return <Text>We are counting first: {count}</Text>;
};

export const Counter = () => {
  const [, updateCount] = useStore();
  const increment = () => {
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));
  };

  return (
    <Flex direction="column" gap="2">
      <CountText />
      <Button onClick={increment}>Let's go, first counter</Button>
    </Flex>
  );
};
