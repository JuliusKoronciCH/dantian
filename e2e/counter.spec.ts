import { test, expect } from '@playwright/test';
import { getStorybookLocator } from './getLocator';

test.beforeEach(async ({ page }) => {
  await page.goto(
    'http://localhost:6006/?path=/story/dantian-counter--primary',
  );
});

test('page title', async ({ page }) => {
  await expect(page).toHaveTitle(/Dantian \/ Counter.*/);
});

test('test counter with classic store', async ({ page }) => {
  const counter1Text = getStorybookLocator(page).locator(
    'text=We are counting first: 0',
  );
  const counter2Text = getStorybookLocator(page).locator(
    'text=We are counting second: 0',
  );
  const counter3Text = getStorybookLocator(page).locator(
    'text=We are counting third: 0',
  );

  await expect(counter1Text).toBeVisible();
  await expect(counter2Text).toBeVisible();
  await expect(counter3Text).toBeVisible();

  const button3 = getStorybookLocator(page).locator(
    'button:has-text("Let\'s go, third counter, reusing second store")',
  );
  await button3.click();
  await expect(
    getStorybookLocator(page).locator('text=We are counting first: 0'),
  ).toBeVisible();
  await expect(
    getStorybookLocator(page).locator('text=We are counting third: 1'),
  ).toBeVisible();
  await expect(
    getStorybookLocator(page).locator('text=We are counting second: 1'),
  ).toBeVisible();

  const button2 = getStorybookLocator(page).locator(
    'button:has-text("Let\'s go, second counter")',
  );
  await button2.click();
  await expect(
    getStorybookLocator(page).locator('text=We are counting first: 0'),
  ).toBeVisible();
  await expect(
    getStorybookLocator(page).locator('text=We are counting third: 2'),
  ).toBeVisible();
  await expect(
    getStorybookLocator(page).locator('text=We are counting second: 2'),
  ).toBeVisible();

  const button1 = getStorybookLocator(page).locator(
    'button:has-text("Let\'s go, first counter")',
  );
  await button1.click();

  await expect(
    getStorybookLocator(page).locator('text=We are counting first: 1'),
  ).toBeVisible();
  await expect(
    getStorybookLocator(page).locator('text=We are counting third: 2'),
  ).toBeVisible();
  await expect(
    getStorybookLocator(page).locator('text=We are counting second: 2'),
  ).toBeVisible();
});
