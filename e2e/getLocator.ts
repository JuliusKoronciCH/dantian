import { Page } from '@playwright/test';

export const getStorybookLocator = (page: Page) =>
  page.frameLocator('[id="storybook-preview-iframe"]');
