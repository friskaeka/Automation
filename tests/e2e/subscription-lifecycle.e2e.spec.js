const { test, expect } = require('@playwright/test');
const { registerTenantViaUi, uniqueTenant } = require('../helpers/medistock');

test.describe('Subscription Lifecycle @subscription', () => {
  test('TC-SUB-001 - Trial subscription is created after tenant registration @positive', async ({ page }) => {
    const tenant = await registerTenantViaUi(page, uniqueTenant('subtrial'));

    await test.step('Then auth storage contains trialing subscription status', async () => {
      const state = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-storage')).state);
      expect(state.user.username).toBe(tenant.username);
      expect(state.user.subscriptionStatus).toBe('trialing');
    });

    await test.step('And billing page is accessible during trial', async () => {
      await page.goto('/settings/billing');
      await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test('TC-SUB-002 - Applying active coupon within limit to a plan @calculation', async () => {
    test.fixme(true, 'Requires known active coupon test data and expected price/tax calculation contract.');
  });

  test('TC-SUB-003 - Subscription activation grants entitlements @webhook', async () => {
    test.fixme(true, 'Requires successful payment webhook or admin subscription activation fixture.');
  });

  test('TC-SUB-004 - Changing a plan updates entitlements @subscription', async () => {
    test.fixme(true, 'Requires active paid subscription fixture and selectable upgrade/downgrade plans.');
  });

  test('TC-SUB-005 - Downgrading blocked by current usage limits @negative', async () => {
    test.fixme(true, 'Requires tenant over-limit usage fixture and product rule for downgrade blocking.');
  });
});
