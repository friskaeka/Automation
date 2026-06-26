const { test, expect } = require('@playwright/test');
const {
  authState,
  expectAuthenticatedShell,
  loginViaUi,
  logoutViaUi,
  registerTenantViaUi,
  uniqueTenant
} = require('../helpers/medistock');

test.describe('Medistock BRD smoke coverage', () => {
  test('public landing page exposes plan and authentication entry points @smoke @FR-003 @FR-005', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Sistem Manajemen Apotek Modern/i })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Masuk' })).toHaveAttribute('href', '/sign-in');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Daftar Gratis' })).toHaveAttribute('href', '/sign-up');
    await expect(page.getByRole('heading', { name: 'Harga Transparan' })).toBeVisible();
    await expect(page.getByText(/Masa percobaan 14 hari/i).first()).toBeVisible();
  });

  test('registers a new apotek owner and starts a trial subscription @critical @FR-002 @FR-003 @FR-006', async ({ page }) => {
    const tenant = await registerTenantViaUi(page, uniqueTenant('register'));
    const state = await authState(page);

    expect(state.isAuthenticated).toBe(true);
    expect(state.user.username).toBe(tenant.username);
    expect(state.user.subscriptionStatus).toBe('trialing');
    expect(state.user.activeApotekId).toBeTruthy();
  });

  test('logs out and signs back in through the two-step apotek/user flow @critical @FR-003', async ({ page }) => {
    const tenant = await registerTenantViaUi(page, uniqueTenant('login'));

    await logoutViaUi(page);
    await loginViaUi(page, tenant);

    const state = await authState(page);
    expect(state.user.username).toBe(tenant.username);
    expect(state.isAuthenticated).toBe(true);
  });

  test('authenticated tenant can reach core protected POS and billing routes @smoke @FR-001 @FR-006 @FR-007 @FR-014', async ({ page }) => {
    test.setTimeout(90000);
    await registerTenantViaUi(page, uniqueTenant('routes'));

    const protectedRoutes = [
      '/dashboard',
      '/database/unit',
      '/database/catalog',
      '/database/supplier',
      '/database/payment-methods',
      '/database/doctor',
      '/database/patient',
      '/purchases/purchase-invoice',
      '/cashier/pos',
      '/products/stock',
      '/laporan/pendapatan',
      '/settings/account',
      '/settings/billing'
    ];

    for (const route of protectedRoutes) {
      await test.step(`open ${route}`, async () => {
        await expect(async () => {
          await page.goto(route);
          await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
          await expectAuthenticatedShell(page);
          await expect(page.getByRole('main')).toBeVisible();
        }).toPass({ intervals: [1000, 2000, 3000], timeout: 15000 });
      });
    }
  });
});
