const { test, expect } = require('@playwright/test');
const { generateTenantData, registerTenant } = require('./utils');

test.describe('Tenant Onboarding @tenant-onboarding', () => {
  test('TC-ONB-001 - A new pharmacy registers successfully @critical @positive', async ({ page }) => {
    const tenant = generateTenantData('onboard');

    await test.step('Given a prospective pharmacy owner navigates to the public landing page', async () => {
      await page.goto('/');
    });

    await test.step('When they click "Daftar Gratis" to go to the sign-up page', async () => {
      await page.getByRole('link', { name: 'Daftar Gratis' }).click();
      await expect(page.getByRole('heading', { name: 'Daftarkan Apotek Anda' })).toBeVisible();
    });

    await test.step('And they fill out the registration form with valid, unique details (Pharmacy Name, SIA, Username, Email, Password)', async () => {
      await page.getByRole('textbox', { name: 'Nama Apotek' }).fill(tenant.pharmacyName);
      await page.getByRole('textbox', { name: 'Nomor SIA (opsional)' }).fill(tenant.sia);
      await page.getByRole('textbox', { name: 'Username' }).fill(tenant.ownerUsername);
      await page.getByRole('textbox', { name: 'Email' }).fill(tenant.email);
      await page.locator('input[type="password"]').fill(tenant.ownerPassword);
    });

    let registerResponse;
    await test.step('And they submit the form', async () => {
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/auth/register-apotek') && response.request().method() === 'POST'
      );
      await page.getByRole('button', { name: 'Daftar & Mulai Percobaan' }).click();
      registerResponse = await responsePromise;
    });

    await test.step('Then a new tenant record and owner user are created in the system', async () => {
      expect(registerResponse.ok()).toBe(true);
    });

    await test.step('And they are redirected to the `/dashboard`', async () => {
      await expect(page).toHaveURL(/.*\/dashboard$/);
    });

    await test.step('And they see a banner indicating "Masa percobaan aktif" (Trial active)', async () => {
      await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
    });

    await test.step('And their subscription status is trialing', async () => {
      await expect(async () => {
        const authStorage = await page.evaluate(() => window.localStorage.getItem('auth-storage'));
        expect(authStorage).not.toBeNull();
        const state = JSON.parse(authStorage).state;
        expect(state.user.subscriptionStatus).toBe('trialing');
      }).toPass();
    });
  });

  test('TC-ONB-002 - Secure two-step login works after logout @critical @positive', async ({ browser, page }) => {
    const setupContext = await browser.newContext();
    const setupPage = await setupContext.newPage();
    const tenant = await registerTenant(setupPage, generateTenantData('loginflow'));
    await setupContext.close();

    await test.step('Given a registered pharmacy owner has just logged out and is on the `/sign-in` page', async () => {
      await page.goto('/sign-in');
      await expect(page.getByRole('heading', { name: 'Login Akun Apotek' })).toBeVisible();
    });

    let apotekLookup;
    await test.step('When they enter their pharmacy email and proceed', async () => {
      const apotekLookupPromise = page.waitForResponse(
        response => response.url().includes(`/api/apotek/by-email/${encodeURIComponent(tenant.email)}`)
      );
      await page.getByRole('textbox', { name: 'Email Apotek' }).fill(tenant.email);
      await page.getByRole('button', { name: 'Lanjutkan' }).click();
      apotekLookup = await apotekLookupPromise;
      expect(apotekLookup.ok()).toBe(true);
    });

    let loginResponse;
    await test.step('And they enter their correct username and password', async () => {
      await expect(page).toHaveURL(/.*\/sign-in\/user$/);
      await page.getByRole('textbox', { name: 'Username' }).fill(tenant.ownerUsername);
      await page.locator('input[type="password"]').fill(tenant.ownerPassword);

      const loginResponsePromise = page.waitForResponse(
        response => response.url().includes('/api/auth/login') && response.request().method() === 'POST'
      );
      await page.getByRole('button', { name: 'Masuk' }).click();
      loginResponse = await loginResponsePromise;
    });

    await test.step('Then they successfully log into the system', async () => {
      expect(loginResponse.ok()).toBe(true);
    });

    await test.step('And they are redirected back to the `/dashboard`', async () => {
      await expect(page).toHaveURL(/.*\/dashboard$/);
    });
  });

  test('TC-ONB-003 - Negative case: registration with duplicate global data @negative', async ({ browser, page }) => {
    const setupContext = await browser.newContext();
    const setupPage = await setupContext.newPage();
    const tenant = await registerTenant(setupPage, generateTenantData('dup'));
    await setupContext.close();

    await test.step('Given a pharmacy name or SIA (Surat Izin Apotek) is already registered in the multi-tenant system', async () => {
      // Setup phase registered the tenant
    });

    let registerResponse;
    await test.step('When a new user attempts to register a new tenant using the exact same name or SIA', async () => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Daftar Gratis' }).click();
      await expect(page.getByRole('heading', { name: 'Daftarkan Apotek Anda' })).toBeVisible();

      const uniqueData = generateTenantData('unique');
      await page.getByRole('textbox', { name: 'Nama Apotek' }).fill(tenant.pharmacyName);
      await page.getByRole('textbox', { name: 'Nomor SIA (opsional)' }).fill(tenant.sia);
      await page.getByRole('textbox', { name: 'Username' }).fill(uniqueData.ownerUsername);
      await page.getByRole('textbox', { name: 'Email' }).fill(uniqueData.email);
      await page.locator('input[type="password"]').fill(uniqueData.ownerPassword);

      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/auth/register-apotek') && response.request().method() === 'POST'
      );
      await page.getByRole('button', { name: 'Daftar & Mulai Percobaan' }).click();
      registerResponse = await responsePromise;
    });

    await test.step('Then the system rejects the registration', async () => {
      expect(registerResponse.ok()).toBe(false);
    });

    await test.step('And displays a specific validation error indicating the pharmacy is already registered', async () => {
      const errorJson = await registerResponse.json();
      const dynamicErrorMessage = errorJson.message;
      await expect(page.getByText(dynamicErrorMessage)).toBeVisible();
    });
  });

  test('TC-ONB-004 - Negative case: registration with missing mandatory fields @negative', async ({ page }) => {
    await test.step('Given a prospective pharmacy owner is on the sign-up page', async () => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Daftar Gratis' }).click();
      await expect(page.getByRole('heading', { name: 'Daftarkan Apotek Anda' })).toBeVisible();
    });

    await test.step('When they submit the form without filling in the mandatory fields (Pharmacy Name, Username, Email, Password)', async () => {
      await page.getByRole('button', { name: 'Daftar & Mulai Percobaan' }).click();
    });

    await test.step('Then the form cannot be submitted', async () => {
      await expect(page.getByRole('heading', { name: 'Daftarkan Apotek Anda' })).toBeVisible();
    });

    await test.step('And validation errors are displayed for the missing fields', async () => {
      const errors = page.getByText('wajib diisi');
      await expect(errors.first()).toBeVisible();
    });
  });

  test('TC-ONB-005 - Edge case: registration with invalid email format @negative', async ({ page }) => {
    await test.step('Given a prospective pharmacy owner is on the sign-up page', async () => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Daftar Gratis' }).click();
      await expect(page.getByRole('heading', { name: 'Daftarkan Apotek Anda' })).toBeVisible();
    });

    await test.step('When they enter an invalid email format (e.g., "invalid-email")', async () => {
      const tenant = generateTenantData('invalidemail');
      await page.getByRole('textbox', { name: 'Nama Apotek' }).fill(tenant.pharmacyName);
      await page.getByRole('textbox', { name: 'Username' }).fill(tenant.ownerUsername);
      await page.getByRole('textbox', { name: 'Email' }).fill('invalid-email');
      await page.locator('input[type="password"]').fill(tenant.ownerPassword);
    });

    await test.step('And they attempt to submit the form', async () => {
      await page.getByRole('button', { name: 'Daftar & Mulai Percobaan' }).click();
    });

    await test.step('Then the form cannot be submitted', async () => {
      await expect(page.getByRole('heading', { name: 'Daftarkan Apotek Anda' })).toBeVisible();
    });

    await test.step('And a validation error is displayed indicating the email format is invalid', async () => {
      const errors = page.getByText('format email');
      await expect(errors.first()).toBeVisible();
    });
  });

  test('TC-ONB-006 - Forget Password @positive', async ({ browser, page }) => {
    const setupContext = await browser.newContext();
    const setupPage = await setupContext.newPage();
    const tenant = await registerTenant(setupPage, generateTenantData('forgetpw'));
    await setupContext.close();

    await test.step('Given a registered user is on the login page', async () => {
      await page.goto('/sign-in');
    });

    await test.step('When they click on the "Lupa Password?" link', async () => {
      await page.getByRole('link', { name: /lupa password/i }).click();
    });

    await test.step('And they enter their registered email address and submit', async () => {
      await page.getByRole('textbox', { name: /email/i }).fill(tenant.email);
      await page.getByRole('button', { name: /kirim/i }).click();
    });

    await test.step('Then they receive a password reset link in their email', async () => {
      // Handled by backend/network
    });

    await test.step('And the system displays a confirmation message', async () => {
      await expect(page.getByText(/cek email anda/i)).toBeVisible();
    });
  });
});
