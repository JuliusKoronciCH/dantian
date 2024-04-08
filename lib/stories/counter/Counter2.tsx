import { Flex, Text, Button } from '@radix-ui/themes';

import useStore, { useCounter2Selector } from './counterStore2';

const CountText = () => {
  const count = useCounter2Selector((state) => state.count);

  return <Text>We are counting second: {count}</Text>;
};

export const Counter2 = () => {
  const [, updateCount] = useStore();
  const increment = () => {
    updateCount((prevState) => ({ ...prevState, count: prevState.count + 1 }));
  };

  return (
    <Flex direction="column" gap="2">
      <CountText />
      <Button onClick={increment}>Let's go, second counter</Button>
    </Flex>
  );
};
