import { expect, test } from '@playwright/test';
import { getStorybookLocator } from './getLocator';

test.beforeEach(async ({ page }) => {
  await page.goto(
    'http://localhost:6006/?path=/story/dantian-trade-blotter--primary',
  );
});

test('trade blotter streams updates when started', async ({ page }) => {
  const frame = getStorybookLocator(page);

  const toggle = frame.getByTestId('trade-blotter-stream-toggle');
  const lastUpdate = frame.getByTestId('trade-blotter-last-update');

  await page.waitForTimeout(2000);

  await toggle.click();
  await expect(toggle).toHaveText(/Start Streaming/);
  await expect(lastUpdate).toHaveText(/Last update: none/);

  await toggle.click();
  await expect(toggle).toHaveText(/Stop Streaming/);

  await expect(lastUpdate).not.toHaveText(/Last update: none/, {
    timeout: 10_000,
  });
});
