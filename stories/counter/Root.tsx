import { Flex } from '@radix-ui/themes';
import { Counter } from './Counter';
import React from 'react';
import { Counter2 } from './Counter2';
import { Counter3 } from './Counter3';
import { DefaultPromise } from './DefaultPromise';

export const Root = () => {
  return (
    <Flex direction="column" gap="2">
      <Counter />
      <Counter2 />
      <Counter3 />
      <DefaultPromise />
    </Flex>
  );
};
