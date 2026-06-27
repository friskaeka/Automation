const { test, expect } = require('@playwright/test');
const { registerTenant } = require('./utils');

test('verify actual startCashierShift manually', async ({ page }) => {
  await registerTenant(page);
  
  // Navigation to the cashier page
  await page.getByRole('button', { name: /Kasir/i }).click();
  await page.getByRole('link', { name: 'Penjualan', exact: true }).click();

  // Wait for the pos URL
  await expect(page).toHaveURL(/.*\/cashier\/pos/);
  
  // Wait for dialog and fill it
  await page.getByRole('textbox', { name: /Saldo Awal/i }).fill('100000');
  await page.getByRole('button', { name: 'Mulai Sesi', exact: true }).click();

  // Let's assert something on the POS page after shift is started
  // e.g. there is a search box for items
  await expect(page.getByPlaceholder(/Cari produk/i).first()).toBeVisible({ timeout: 5000 });
});
