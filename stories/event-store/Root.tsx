import { Flex } from '@radix-ui/themes';

import React from 'react';
import { state$, useStoreValue } from './store';

export const Root = () => {
  const [name] = useStoreValue('user.name');
  return (
    <Flex direction="column" gap="2">
      <Flex direction="row" gap="2" align={'center'}>
        State: <pre>{JSON.stringify(state$.getValue())}</pre>
      </Flex>

      <Flex direction="row" gap="2" align={'center'}>
        User name: {name}
      </Flex>
    </Flex>
  );
};
