import { expect, test } from '@playwright/test';
import { getStorybookLocator } from './getLocator';

test.beforeEach(async ({ page }) => {
  await page.goto(
    'http://localhost:6006/?path=/story/dantian-event-store--primary',
  );
});

test('event store hydrates and updates UI', async ({ page }) => {
  const frame = getStorybookLocator(page);

  await expect(frame.locator('text=User name: n/a')).toBeVisible();

  await expect(frame.locator('text=User name: Julius')).toBeVisible({
    timeout: 10_000,
  });
});
