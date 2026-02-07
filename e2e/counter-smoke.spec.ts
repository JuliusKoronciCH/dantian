import { expect, test } from '@playwright/test';
import { getStorybookLocator } from './getLocator';

const storyUrl = 'http://localhost:6006/?path=/story/dantian-counter--primary';

test('counter story resets on reload', async ({ page }) => {
  await page.goto(storyUrl);
  const frame = getStorybookLocator(page);

  const button1 = frame.locator('button:has-text("Let\'s go, first counter")');

  await button1.click();
  await expect(frame.locator('text=We are counting first: 1')).toBeVisible();

  await page.reload();
  await page.goto(storyUrl);
  const frameAfter = getStorybookLocator(page);

  await expect(
    frameAfter.locator('text=We are counting first: 0'),
  ).toBeVisible();
});
