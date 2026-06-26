const { test, expect } = require('@playwright/test');
const { registerTenantViaUi, uniqueTenant } = require('../helpers/medistock');

test.describe('BRD requirement regressions observed on deployed Medistock', () => {
  test('pricing CTA back navigation should return directly to landing page root @FR-003 @FR-005', async ({ page }) => {
    test.fail(true, 'Observed on 2026-06-24: after clicking navbar Harga then pricing CTA, browser back returns to /#pricing instead of landing page root /.');

    await page.goto('/');
    await page.getByLabel('Bagian halaman').getByRole('link', { name: 'Harga' }).click();
    await expect(page).toHaveURL(/\/#pricing$/);

    await page.getByRole('main').getByRole('link', { name: 'Mulai Gratis 14 Hari' }).first().click();
    await expect(page).toHaveURL(/\/sign-up$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: /Sistem Manajemen Apotek Modern/i })).toBeVisible();
  });

  test('fresh tenant account table must not expose users from other apotek @FR-001 @FR-003 @FR-004', async ({ page }) => {
    const tenant = await registerTenantViaUi(page, uniqueTenant('isolation'));
    await page.goto('/settings/account');

    const main = page.getByRole('main');
    await expect(main).toContainText(tenant.username);
    await expect(main).not.toContainText(/\b(annas|friska|beni|admin|saya)\b/i);
  });

  test('billing invoice creation should return success instead of HTTP 500 @FR-007 @FR-008 @FR-009', async ({ page }) => {
    await registerTenantViaUi(page, uniqueTenant('billing'));
    await page.goto('/settings/billing');

    const invoiceResponse = page.waitForResponse(
      response => response.url().includes('/api/billing/invoices') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Buat Invoice Pembayaran' }).click();

    expect((await invoiceResponse).ok()).toBe(true);
  });

  test('master data unit creation should persist the new satuan row @FR-001', async ({ page }) => {
    test.fail(true, 'Observed on 2026-06-24: the Tambah Satuan dialog closes without a create request or persisted row.');

    const suffix = Date.now();
    const name = `Botol QA ${suffix}`;
    const abbreviation = `BQA${suffix}`;

    await registerTenantViaUi(page, uniqueTenant('unit'));
    await page.goto('/database/unit');
    await page.getByRole('button', { name: 'Tambah Satuan' }).click();
    await page.getByRole('textbox', { name: 'Nama Satuan' }).fill(name);
    await page.getByRole('textbox', { name: 'Singkatan Satuan' }).fill(abbreviation);
    await page.getByRole('button', { name: 'Simpan' }).click();

    await expect(page.getByRole('main')).toContainText(name);
    await expect(page.getByRole('main')).toContainText(abbreviation);
  });
});
