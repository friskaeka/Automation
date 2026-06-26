import { test, expect } from '@playwright/test';

test.describe('Tenant Onboarding', () => {
  test('Scenario 1: A new pharmacy registers successfully', async ({ page }) => {
    await test.step('Given a prospective pharmacy owner navigates to the public landing page', async () => {
      // TODO: Navigate to /
    });

    await test.step('When they click "Daftar Gratis" to go to the sign-up page', async () => {
      // TODO: Click sign up link
    });

    await test.step('And they fill out the registration form with valid, unique details', async () => {
      // TODO: Fill out form
    });

    await test.step('And they submit the form', async () => {
      // TODO: Submit form
    });

    await test.step('Then a new tenant record and owner user are created in the system', async () => {
      // TODO: Assert registration success
    });

    await test.step('And they are redirected to the /dashboard', async () => {
      // TODO: Check URL
    });

    await test.step('And they see a banner indicating "Masa percobaan aktif" (Trial active)', async () => {
      // TODO: Check banner visibility
    });
  });

  test('Scenario 2: Secure Two-Step Login', async ({ page }) => {
    await test.step('Given a registered pharmacy owner has just logged out and is on the /sign-in page', async () => {
      // TODO: Log out and navigate to /sign-in
    });

    await test.step('When they enter their pharmacy email and proceed', async () => {
      // TODO: Enter email and click next
    });

    await test.step('And they enter their correct username and password', async () => {
      // TODO: Enter credentials and submit
    });

    await test.step('Then they successfully log into the system', async () => {
      // TODO: Assert login success
    });

    await test.step('And they are redirected back to the /dashboard', async () => {
      // TODO: Check URL
    });
  });

  test('Scenario 3: Negative Case - Registration with duplicate global data', async ({ page }) => {
    // ... setup and test steps verifying global uniqueness of SIA and Pharmacy Name
  });
});
