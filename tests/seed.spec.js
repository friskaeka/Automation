const { test, expect } = require('@playwright/test');

test('seed - opens Medistock public landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Sistem Manajemen Apotek/i })).toBeVisible();
});
