import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto(
    'http://localhost:6006/?path=/story/dantian-counter--primary',
  );
});

test('page title', async ({ page }) => {
  await expect(page).toHaveTitle(/Dantian \/ Counter.*/);
});

test('get started link', async ({ page }) => {
  const counterButton = page
    .frameLocator('[id="storybook-preview-iframe"]')
    .locator('[data-component="counter"]');
  await expect(counterButton).toHaveText('Button-0');

  for (let i = 0; i < 10; i++) {
    await counterButton.click();
    await expect(counterButton).toHaveText(`Button-${i + 1}`);
  }
});
