const { expect } = require('@playwright/test');

const DEFAULT_PASSWORD = 'CodexTest123!';
const TONO_ACCOUNT = {
  email: process.env.MEDISTOCK_TONO_EMAIL || 'tono12@yopmail.com',
  username: process.env.MEDISTOCK_TONO_USERNAME || 'Tono',
  password: process.env.MEDISTOCK_TONO_PASSWORD || 'Tono1234'
};

function uniqueTenant(prefix = 'qa') {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    pharmacyName: `QA Codex Apotek ${suffix}`,
    sia: `SIA-QA-${suffix}`,
    username: `${prefix}_${suffix}`,
    email: `${prefix}.${suffix}@example.com`,
    password: DEFAULT_PASSWORD
  };
}

async function registerTenantViaUi(page, tenant = uniqueTenant()) {
  await page.goto('/sign-up');
  await expect(page.getByRole('heading', { name: 'Daftarkan Apotek Anda' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Nama Apotek' }).fill(tenant.pharmacyName);
  await page.getByRole('textbox', { name: 'Nomor SIA (opsional)' }).fill(tenant.sia);
  await page.getByRole('textbox', { name: 'Username' }).fill(tenant.username);
  await page.getByRole('textbox', { name: 'Email' }).fill(tenant.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(tenant.password);

  const registerResponse = page.waitForResponse(
    response => response.url().includes('/api/auth/register-apotek') && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Daftar & Mulai Percobaan' }).click();
  expect((await registerResponse).ok()).toBe(true);

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
  return tenant;
}

async function loginViaUi(page, tenant) {
  await page.goto('/sign-in');
  await expect(page.getByRole('heading', { name: 'Login Akun Apotek' })).toBeVisible();

  const apotekLookup = page.waitForResponse(
    response => response.url().includes(`/api/apotek/by-email/${tenant.email}`)
  );
  await page.getByRole('textbox', { name: 'Email Apotek' }).fill(tenant.email);
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  expect((await apotekLookup).ok()).toBe(true);

  await expect(page).toHaveURL(/\/sign-in\/user$/);
  await page.getByRole('textbox', { name: 'Username' }).fill(tenant.username);
  await page.getByRole('textbox', { name: 'Password User' }).fill(tenant.password);

  const loginResponse = page.waitForResponse(
    response => response.url().includes('/api/auth/login') && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Masuk' }).click();
  expect((await loginResponse).ok()).toBe(true);

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
}

async function logoutViaUi(page) {
  await page.getByRole('button', { name: /Keluar dari akun/ }).click();
  await expect(page.getByRole('dialog', { name: 'Konfirmasi Logout' })).toBeVisible();
  await page.getByRole('button', { name: 'Ya, Logout' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
}

async function expectAuthenticatedShell(page) {
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Keluar dari akun/ })).toBeVisible();
}

async function authState(page) {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem('auth-storage');
    return raw ? JSON.parse(raw).state : null;
  });
}

module.exports = {
  DEFAULT_PASSWORD,
  TONO_ACCOUNT,
  authState,
  expectAuthenticatedShell,
  loginViaUi,
  logoutViaUi,
  registerTenantViaUi,
  uniqueTenant
};
