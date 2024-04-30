import { Flex } from '@radix-ui/themes';
import { useStoreValue } from './store';
import { UserForm } from './user-form.tsx';
import { UserPreview } from './user-preview.tsx';

export const Root = () => {
  const [name] = useStoreValue('user.name');
  return (
    <Flex direction="column" gap="2">
      <Flex direction="row" gap="2" align={'center'}>
        <UserForm />
        <UserPreview />
      </Flex>

      <Flex direction="row" gap="2" align={'center'}>
        User name: {name}
      </Flex>
    </Flex>
  );
};
