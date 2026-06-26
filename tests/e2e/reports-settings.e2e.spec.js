const { test, expect } = require('@playwright/test');
const { TONO_ACCOUNT, expectAuthenticatedShell, loginViaUi } = require('../helpers/medistock');

test.describe('Reports, Settings, and Notifications @reports @settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, TONO_ACCOUNT);
  });

  test('TC-RPT-001 - Revenue report route opens and handles current data state @positive', async ({ page }) => {
    await page.goto('/laporan/pendapatan');
    await expect(page).toHaveURL(/\/laporan\/pendapatan$/);
    await expectAuthenticatedShell(page);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('TC-SET-001 - Account settings route shows tenant account context @positive', async ({ page }) => {
    await page.goto('/settings/account');
    await expect(page).toHaveURL(/\/settings\/account$/);
    await expectAuthenticatedShell(page);
    await expect(async () => {
      const text = await page.getByRole('main').innerText();
      expect(text.toLowerCase()).toContain(TONO_ACCOUNT.username.toLowerCase());
    }).toPass({ timeout: 10000 });
  });

  test('TC-SET-002 - Billing settings route is accessible @positive', async ({ page }) => {
    await page.goto('/settings/billing');
    await expect(page).toHaveURL(/\/settings\/billing$/);
    await expectAuthenticatedShell(page);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('TC-NOTIF-001 - Notification panel can be opened @positive', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Notifikasi' }).click();
    await expect(page.getByText(/Notifikasi|Belum dibaca|Sudah dibaca|Tidak ada/i).first()).toBeVisible();
  });

  test('TC-SET-003 - Editing user privileges in Pengaturan @settings', async () => {
    test.fixme(true, 'Requires safe role/permission fixture and rollback strategy.');
  });

  test('TC-RPT-002 - Profit and Loss report calculation with known transaction data @calculation', async () => {
    test.fixme(true, 'Requires stable paid sales and HPP fixture to assert exact Laba/Rugi numbers.');
  });
});
