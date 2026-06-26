const { test, expect } = require('@playwright/test');
const {
  loginViaUi,
  logoutViaUi,
  registerTenantViaUi,
  uniqueTenant
} = require('../helpers/medistock');

test.describe('Tenant Onboarding @tenant-onboarding', () => {
  test('TC-ONB-001 - A new pharmacy registers successfully @critical @positive', async ({ page }) => {
    const tenant = uniqueTenant('onboard');

    await test.step('Given user opens the public sign-up page', async () => {
      await page.goto('/sign-up');
      await expect(page.getByRole('heading', { name: 'Daftarkan Apotek Anda' })).toBeVisible();
    });

    await test.step('When user fills and submits valid unique pharmacy data', async () => {
      await registerTenantViaUi(page, tenant);
    });

    await test.step('Then user is redirected to dashboard and trial banner is visible', async () => {
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
    });
  });

  test('TC-ONB-002 - Secure two-step login works after logout @critical @positive', async ({ page }) => {
    const tenant = await registerTenantViaUi(page, uniqueTenant('loginflow'));

    await test.step('Given registered pharmacy owner has logged out', async () => {
      await logoutViaUi(page);
      await expect(page).toHaveURL(/\/sign-in$/);
    });

    await test.step('When user enters pharmacy email, username, and password', async () => {
      await loginViaUi(page, tenant);
    });

    await test.step('Then user is authenticated into dashboard', async () => {
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
    });
  });

  test('TC-ONB-003 - Negative case: registration with duplicate global data @negative', async () => {
    test.fixme(true, 'Needs a stable product error contract for duplicate pharmacy/SIA/email validation before automating.');
  });
});
