const { test, expect } = require('@playwright/test');
const {
  TONO_ACCOUNT,
  expectAuthenticatedShell,
  loginViaUi,
  logoutViaUi
} = require('../helpers/medistock');

test.describe('POS Authentication and Account Management @auth', () => {
  test('TC-AUTH-001 - Two-layer login process with Tono account @critical @positive', async ({ page }) => {
    await test.step('Given user opens sign-in page', async () => {
      await page.goto('/sign-in');
      await expect(page.getByRole('heading', { name: 'Login Akun Apotek' })).toBeVisible();
    });

    await test.step('When user logs in through pharmacy email and user credentials', async () => {
      await loginViaUi(page, TONO_ACCOUNT);
    });

    await test.step('Then dashboard shell is authenticated', async () => {
      await expect(page).toHaveURL(/\/dashboard$/);
      await expectAuthenticatedShell(page);
    });
  });

  test('TC-AUTH-002 - Pemilik can access owner protected routes @positive', async ({ page }) => {
    await loginViaUi(page, TONO_ACCOUNT);

    const routes = [
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
      '/settings/account',
      '/settings/billing'
    ];

    for (const route of routes) {
      await test.step(`Then Pemilik can open ${route}`, async () => {
        await page.goto(route);
        await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
        await expectAuthenticatedShell(page);
      });
    }
  });

  test('TC-AUTH-003 - Karyawan role-based access @positive', async () => {
    test.fixme(true, 'Needs stable employee account credentials and expected permission matrix.');
  });

  test('TC-AUTH-004 - Two-layer logout process @positive', async ({ page }) => {
    await loginViaUi(page, TONO_ACCOUNT);
    await logoutViaUi(page);
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test('TC-AUTH-005 - Invalid user credentials are rejected @negative', async ({ page }) => {
    await page.goto('/sign-in');
    await page.getByRole('textbox', { name: 'Email Apotek' }).fill(TONO_ACCOUNT.email);
    await page.getByRole('button', { name: 'Lanjutkan' }).click();
    await expect(page).toHaveURL(/\/sign-in\/user$/);

    await page.getByRole('textbox', { name: 'Username' }).fill(TONO_ACCOUNT.username);
    await page.getByRole('textbox', { name: 'Password User' }).fill('WrongPassword123');

    const loginResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Masuk' }).click();

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.ok()).toBe(false);
    await expect(page).toHaveURL(/\/sign-in\/user$/);
  });

  test('TC-AUTH-006 - Direct URL access to protected route redirects unauthenticated user @negative', async ({ page }) => {
    await page.goto('/settings/account');
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login Akun Apotek' })).toBeVisible();
  });
});
