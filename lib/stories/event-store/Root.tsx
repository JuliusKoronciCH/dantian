import { Flex } from '@radix-ui/themes';
import { state$, useStoreValue } from './store';

export const Root = () => {
  const [name] = useStoreValue('user.name');
  return (
    <Flex direction="column" gap="2" data-testid="event-store-root">
      <Flex
        direction="row"
        gap="2"
        align="center"
        data-testid="event-store-state-row"
      >
        State:{' '}
        <pre data-testid="event-store-state">
          {JSON.stringify(state$.getValue())}
        </pre>
      </Flex>

      <Flex
        direction="row"
        gap="2"
        align="center"
        data-testid="event-store-user-row"
      >
        User name: <span data-testid="event-store-user-name">{name}</span>
      </Flex>
    </Flex>
  );
};
