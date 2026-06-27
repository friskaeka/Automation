const { test, expect } = require('@playwright/test');
const { registerTenant } = require('./utils');

test.describe('POS Authentication and Account Management', () => {
  test.setTimeout(90000); // Increase timeout to 90 seconds due to extensive setup (creating tenants, secondary accounts, and logging in/out)

  test('Scenario 1: Two-layer login process', async ({ browser, page }) => {
    // Dynamic User Setup in a separate context to preserve unauthenticated state for the main page
    const setupContext = await browser.newContext();
    const setupPage = await setupContext.newPage();
    const tenant = await registerTenant(setupPage);
    await setupContext.close();

    await test.step('Given a user navigates to the POS dashboard', async () => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*\/sign-in$/);
      await expect(page.getByRole('heading', { name: 'Login Akun Apotek' })).toBeVisible();
    });

    await test.step('When they perform the first layer login with the Apotek email', async () => {
      await page.getByRole('textbox', { name: 'Email Apotek' }).fill(tenant.email);
      await page.getByRole('button', { name: 'Lanjutkan' }).click();
    });

    await test.step('And they perform the second layer login with their User credentials (Username/Password)', async () => {
      await page.getByRole('textbox', { name: 'Username' }).fill(tenant.ownerUsername);
      await page.locator('input[type="password"]').fill(tenant.ownerPassword);
      await page.getByRole('button', { name: 'Masuk' }).click();
    });

    await test.step('Then they are successfully authenticated into the POS system', async () => {
      await expect(page).toHaveURL(/.*\/dashboard$/);
      await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
    });
  });

  test('Scenario 2: Role-based access for \'Pemilik\' (Owner)', async ({ page }) => {
    // Dynamic User Setup
    const tenant = await registerTenant(page);

    await test.step('Given an authenticated user with the \'Pemilik\' role', async () => {
      await expect(page).toHaveURL(/.*\/dashboard$/);
      await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
    });

    await test.step('When they navigate the dashboard', async () => {
      await page.goto('/dashboard');
    });

    await test.step('Then they can access all 7 menus (Profil, Database, Kasir, Pembelian, Barang, Laporan, Pengaturan, Notifikasi)', async () => {
      const menus = [
        'Profil',
        'Database',
        'Kasir',
        'Pembelian',
        'Barang',
        'Laporan',
        'Pengaturan',
        'Notifikasi'
      ];
      for (const menu of menus) {
        // Find the link by role and its name
        const menuLink = page.locator('nav, aside').getByRole('link', { name: new RegExp(menu, 'i') }).first();
        // Assert it is visible and clickable, then click it
        await expect(menuLink).toBeVisible();
        await menuLink.click();
        
        // Wait for the URL to change appropriately or the heading for that menu to become visible
        await expect(page.getByRole('heading', { name: new RegExp(menu, 'i') }).first()).toBeVisible();
      }
    });

    await test.step('And they can edit the Apotek profile', async () => {
      await page.locator('a, button').filter({ hasText: /Pengaturan/i }).first().click();
      await expect(page).toHaveURL(/.*\/settings\/account$/);
      await expect(page.getByRole('heading', { name: /Pengaturan/i })).toBeVisible();
      // Perform actual edit action
      await page.getByRole('textbox').first().fill('Apotek Edit');
      await page.getByRole('button', { name: /Simpan/i }).click();
      await expect(page.getByText(/berhasil|sukses|tersimpan/i).first()).toBeVisible();
    });
  });

  test('Scenario 3: Role-based access for \'Karyawan\' (Employee)', async ({ page }) => {
    await test.step('Given an authenticated user with the \'Karyawan\' role', async () => {
      // Dynamic User Setup
      const tenant = await registerTenant(page);
      
      // Navigate to Pengaturan -> Akun
      await page.locator('a, button').filter({ hasText: /Pengaturan/i }).first().click();
      await page.locator('a, button').filter({ hasText: /Akun/i }).first().click();
      
      // Click to add an account
      await page.getByRole('button', { name: /Tambah Akun/i }).click();
      
      const karyawanUsername = `karyawan_${Date.now()}`;
      const karyawanPassword = 'Password123!';
      
      // Fill in Username, check Karyawan, Password, Confirm Password
      await page.getByRole('textbox', { name: /Username/i }).fill(karyawanUsername);
      await page.getByRole('radio', { name: /Karyawan/i }).check();
      const pwInputs = page.locator('input[type="password"]');
      await pwInputs.nth(0).fill(karyawanPassword);
      await pwInputs.nth(1).fill(karyawanPassword);
      await page.getByRole('button', { name: /Simpan/i }).click();
      await expect(page.getByText(/berhasil|sukses|tersimpan/i).first()).toBeVisible();
      
      // Logout of the Pemilik via UI
      await page.getByRole('button', { name: /Keluar dari akun/i }).click();
      await page.getByRole('button', { name: /Ya, Logout/i }).click();
      
      // Log in as the new Karyawan
      await expect(page).toHaveURL(/.*\/sign-in\/user$/);
      await page.getByRole('textbox', { name: /Username/i }).fill(karyawanUsername);
      await page.locator('input[type="password"]').fill(karyawanPassword);
      await page.getByRole('button', { name: /Masuk/i }).click();
      
      // Verify final state
      await expect(page).toHaveURL(/.*\/(dashboard|kasir(\/pos)?)$/);
    });
    
    await test.step('When they navigate the dashboard', async () => {
      await page.goto('/dashboard');
    });
    
    await test.step('Then they have default access to the \'Kasir\' menu', async () => {
      const kasirLink = page.locator('a, button').filter({ hasText: /Kasir/i }).first();
      await expect(kasirLink).toBeVisible();
      await kasirLink.click();
      await expect(page.getByRole('heading', { name: /Kasir/i }).first()).toBeVisible();
    });
    
    await test.step('And they cannot access restricted menus (e.g., Pengaturan) unless explicitly granted by the Pemilik', async () => {
      await expect(page.getByRole('heading', { name: /Kasir|Dashboard/i }).first()).toBeVisible();
      await expect(page.locator('a, button').filter({ hasText: /Kasir/i }).first()).toBeVisible();
      const pengaturanLink = page.locator('a, button').filter({ hasText: /Pengaturan/i }).first();
      await expect(pengaturanLink).toBeHidden();
    });
  });

  test('Scenario 4: Two-layer logout process', async ({ page }) => {
    // Dynamic User Setup
    const tenant = await registerTenant(page);

    await test.step('Given an authenticated user in the POS system', async () => {
      await expect(page).toHaveURL(/.*\/dashboard$/);
      await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
    });

    await test.step('When they perform a user logout', async () => {
      await page.getByRole('button', { name: /Keluar dari akun/ }).click();
      await page.getByRole('button', { name: 'Ya, Logout' }).click();
    });

    await test.step('Then they are logged out of the user session but the Apotek session remains', async () => {
      // After user logout, they should be redirected to the user login page
      await expect(page).toHaveURL(/.*\/sign-in\/user$/);
    });

    await test.step('When they perform an Apotek logout', async () => {
      // Click the button directly; if it fails, the test will genuinely fail
      await page.getByText(/Ganti Apotek|Bukan/i).click();
    });

    await test.step('Then they are fully logged out of the application', async () => {
      await expect(page).toHaveURL(/.*\/sign-in$/);
      await expect(page.getByRole('heading', { name: 'Login Akun Apotek' })).toBeVisible();
    });
  });

  test('Scenario 5: Negative Case - Invalid credentials', async ({ browser, page }) => {
    // Generate valid tenant in background to test the second layer
    const setupContext = await browser.newContext();
    const setupPage = await setupContext.newPage();
    const tenant = await registerTenant(setupPage);
    await setupContext.close();

    const runNegativeTest = async (email, username, password) => {
      await test.step('Given a user is on the login page', async () => {
        await page.goto('/sign-in');
        await expect(page.getByRole('heading', { name: 'Login Akun Apotek' })).toBeVisible();
      });

      await test.step('When they attempt to login with an unregistered Apotek email or incorrect password', async () => {
        await page.getByRole('textbox', { name: 'Email Apotek' }).fill(email);
        await page.getByRole('button', { name: 'Lanjutkan' }).click();
        if (username && password) {
          const usernameInput = page.getByRole('textbox', { name: 'Username' });
          await usernameInput.waitFor({ state: 'visible' });
          await usernameInput.fill(username);
          await page.locator('input[type="password"]').fill(password);
          await page.getByRole('button', { name: 'Masuk' }).click();
        }
      });

      await test.step('Then the system rejects the login attempt', async () => {
        await expect(page).toHaveURL(/.*\/sign-in(\/user)?$/);
      });

      await test.step('And displays an appropriate error message without exposing sensitive system information', async () => {
        await expect(page.getByText(/salah|gagal|tidak ditemukan/i).first()).toBeVisible();
      });
    };

    await runNegativeTest('unregistered@example.com', null, null);
    await runNegativeTest(tenant.email, tenant.ownerUsername, 'WrongPassword123!');
  });

  test('Scenario 6: Edge Case - Direct URL access to restricted routes', async ({ page }) => {
    await test.step('Given a Karyawan is logged in (who does not have access to Pengaturan)', async () => {
      // Dynamic User Setup
      const tenant = await registerTenant(page);
      
      // Navigate to Pengaturan -> Akun
      await page.locator('a, button').filter({ hasText: /Pengaturan/i }).first().click();
      await page.locator('a, button').filter({ hasText: /Akun/i }).first().click();
      
      // Click to add an account
      await page.getByRole('button', { name: /Tambah Akun/i }).click();
      
      const karyawanUsername = `karyawan_${Date.now()}`;
      const karyawanPassword = 'Password123!';
      
      // Fill in Username, check Karyawan, Password, Confirm Password
      await page.getByRole('textbox', { name: /Username/i }).fill(karyawanUsername);
      await page.getByRole('radio', { name: /Karyawan/i }).check();
      const pwInputs = page.locator('input[type="password"]');
      await pwInputs.nth(0).fill(karyawanPassword);
      await pwInputs.nth(1).fill(karyawanPassword);
      await page.getByRole('button', { name: /Simpan/i }).click();
      await expect(page.getByText(/berhasil|sukses|tersimpan/i).first()).toBeVisible();
      
      // Logout of the Pemilik via UI
      await page.getByRole('button', { name: /Keluar dari akun/i }).click();
      await page.getByRole('button', { name: /Ya, Logout/i }).click();
      
      // Log in as the new Karyawan
      await expect(page).toHaveURL(/.*\/sign-in\/user$/);
      await page.getByRole('textbox', { name: /Username/i }).fill(karyawanUsername);
      await page.locator('input[type="password"]').fill(karyawanPassword);
      await page.getByRole('button', { name: /Masuk/i }).click();
      
      // Verify final state
      await expect(page).toHaveURL(/.*\/(dashboard|kasir(\/pos)?)$/);
      await expect(page.getByRole('heading', { name: /Kasir|Dashboard/i }).first()).toBeVisible();
      await expect(page.locator('a, button').filter({ hasText: /Kasir/i }).first()).toBeVisible();
      await expect(page.locator('a, button').filter({ hasText: /Pengaturan/i })).toBeHidden();
    });
    
    await test.step('When they attempt to directly navigate to the `/pengaturan` URL', async () => {
      await page.goto('/settings');
    });
    
    await test.step('Then the system intercepts the request', async () => {
      await expect(page).not.toHaveURL(/.*\/settings.*/);
    });
    
    await test.step('And redirects them back to their default allowed view (e.g., Dashboard or Kasir) with an "Access Denied" message', async () => {
      await expect(page).toHaveURL(/.*\/(dashboard|kasir).*/);
      await expect(page.getByText(/Akses Ditolak|Access Denied|tidak memiliki akses|restricted/i)).toBeVisible();
    });
  });
});
