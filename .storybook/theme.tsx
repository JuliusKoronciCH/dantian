import '@radix-ui/themes/styles.css';
import React, { PropsWithChildren } from 'react';
import { Theme } from '@radix-ui/themes';

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  return <Theme>{children}</Theme>;
};
