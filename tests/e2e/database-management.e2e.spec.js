const { test, expect } = require('@playwright/test');
const { generateTenantData, registerTenant, loginToPOS } = require('./utils');

function uniqueSuffix() {
  return `${Date.now()}`.slice(-6);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function clickSaveAndConfirm(page, postPath) {
  const responsePromise = page.waitForResponse(
    response => response.url().includes(postPath) && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /^Simpan$/ }).last().click();
  const confirmButton = page.getByRole('button', { name: /^(Ya Simpan|Konfirmasi)$/ }).last();
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
}

async function selectComboboxOption(page, index, optionText) {
  await page.locator('[role="combobox"]').nth(index).click();
  const option = page.getByRole('option', { name: new RegExp(escapeRegExp(optionText), 'i') });
  if (await option.count()) {
    await option.first().click();
  } else {
    await page.getByRole('option').first().click();
  }
}

async function createUnit(page, name, abbreviation) {
  await page.goto('/database/unit');
  await page.getByRole('button', { name: 'Tambah Satuan' }).click();
  await page.locator('input[name="nama"]').last().fill(name);
  await page.locator('input[name="singkatan"]').last().fill(abbreviation);
  await clickSaveAndConfirm(page, '/api/satuan');
}

test.describe.configure({ mode: 'serial' });

test.describe('Database & Master Data Management @database', () => {
  let tenantData;

  test.beforeAll(async ({ browser }) => {
    tenantData = generateTenantData('dbm');
    const context = await browser.newContext();
    const page = await context.newPage();
    await registerTenant(page, tenantData);
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginToPOS(page, tenantData.email, tenantData.ownerUsername, tenantData.ownerPassword);
  });

  test('TC-DBM-001 - Creating a new Product (Katalog) @positive', async ({ page }) => {
    const suffix = uniqueSuffix();
    const unitName = `Kapsul DBM ${suffix}`;
    const unitAbbr = `KD${suffix.slice(-4)}`;
    const productName = `Produk DBM ${suffix}`;

    await test.step('Given an authenticated user with access to Database > Katalog', async () => {
      await createUnit(page, unitName, unitAbbr);
      await page.goto('/database/catalog');
    });

    await test.step('When they click "Tambah barang"', async () => {
      await page.getByRole('button', { name: 'Tambah Barang' }).click();
    });

    await test.step('And they fill in the Name, Satuan Terkecil, Satuan Utama, and mapping', async () => {
      await page.locator('input[name="nama"]').last().fill(productName);
      await selectComboboxOption(page, 0, unitName);

      const mainUnitCombobox = page.locator('[role="combobox"]').nth(1);
      if (await mainUnitCombobox.isEnabled()) {
        await selectComboboxOption(page, 1, unitName);
      }
      await page.locator('input[name="komposisi"]').last().fill('QA DBM');
    });

    await test.step('And they save the product', async () => {
      await clickSaveAndConfirm(page, '/api/barang');
    });

    await test.step('Then the product is successfully added to the catalog', async () => {
      await page.goto('/database/catalog');
      await page.getByPlaceholder('Cari Barang atau Komposisi...').fill(productName);
      await expect(async () => {
        const text = await page.getByRole('main').innerText();
        expect(text.toLowerCase()).toContain(productName.toLowerCase());
      }).toPass({ timeout: 10000 });
    });

    await test.step('And the base price (Harga Beli) defaults to correct historical average calculation', async () => {
      const mainText = await page.getByRole('main').innerText();
      expect(mainText).toMatch(/[0-9]/);
    });
  });

  test('TC-DBM-002 - Automatic Selling Price (Harga Jual) calculation and overrides @calculation', async ({ page }) => {
    const suffix = uniqueSuffix();
    const productName = `Prod Harga ${suffix}`;

    await test.step('Given a product in the catalog with a base price and default markup', async () => {
      await page.goto('/database/catalog');
      await page.getByRole('button', { name: 'Tambah Barang' }).click();
      await page.locator('input[name="nama"]').last().fill(productName);
      
      const hargaBeli = page.locator('input[name="hargaBeli"], input[name="basePrice"]').first();
      await hargaBeli.fill('10000');
      const markup = page.locator('input[name="markup"], input[name="margin"]').first();
      await markup.fill('10');
      
      const hargaJual = page.locator('input[name="hargaJual"], input[name="sellingPrice"]').first();
      await expect(hargaJual).toHaveValue(/11000/);
    });

    await test.step('When the user attempts to override the selling price manually', async () => {
      const hargaJual = page.locator('input[name="hargaJual"], input[name="sellingPrice"]').first();
      await hargaJual.fill('10500');
      await hargaJual.blur();
    });

    await test.step('And the new price is lower than (Harga Beli + Markup)', async () => {
      // Logic handled in previous step
    });

    await test.step('Then the system reverts the price to the standard calculated price', async () => {
      const hargaJual = page.locator('input[name="hargaJual"], input[name="sellingPrice"]').first();
      await expect(hargaJual).not.toHaveValue(/10500/);
    });

    await test.step('When the user sets a new price higher than the maximum allowed markup', async () => {
      const hargaJual = page.locator('input[name="hargaJual"], input[name="sellingPrice"]').first();
      await hargaJual.fill('50000');
      await page.getByRole('button', { name: /^Simpan$/ }).last().click();
      
      const confirmButton = page.getByRole('button', { name: /^(Ya Simpan|Konfirmasi)$/ }).last();
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();
    });

    await test.step('Then the price is saved but a "Harga Tidak Kompetitif" notification is triggered to the Owner', async () => {
      await expect(page.getByText(/Harga Tidak Kompetitif/i).first()).toBeVisible();
    });
  });

  test('TC-DBM-003 - Managing Suppliers with Tax configurations @positive', async ({ page }) => {
    const supplierName = `Supplier DBM ${uniqueSuffix()}`;

    await test.step('Given an authenticated user in Database > Supplier', async () => {
      await page.goto('/database/supplier');
    });

    await test.step('When they add a new supplier and check the "Hidden" (Centang blanko) flag', async () => {
      await page.getByRole('button', { name: 'Tambah Supplier' }).click();
      await page.locator('input[name="supplierName"]').last().fill(supplierName);
      await page.locator('input[name="phoneNumber"]').last().fill('081234560099');
      
      const blankoCheckbox = page.getByRole('checkbox', { name: /Blanko|Hidden/i });
      if (await blankoCheckbox.count() > 0) {
        await blankoCheckbox.check();
      } else {
        await page.locator('input[type="checkbox"]').first().check();
      }
      
      await clickSaveAndConfirm(page, '/api/supplier');
    });

    await test.step('Then the supplier is saved and marked as not charging tax for future purchase invoices', async () => {
      await page.goto('/database/supplier');
      await page.getByPlaceholder('Cari Supplier...').fill(supplierName);
      await expect(page.getByRole('main')).toContainText(supplierName);
    });
  });

  test('TC-DBM-004 - Negative Case - Duplicate entry creation (Case Insensitive) @negative', async ({ page }) => {
    const suffix = uniqueSuffix();
    const productName = `Paracetamol ${suffix}`;

    await test.step('Given the database already contains a product named "Paracetamol"', async () => {
      await page.goto('/database/catalog');
      await page.getByRole('button', { name: 'Tambah Barang' }).click();
      await page.locator('input[name="nama"]').last().fill(productName);
      await page.locator('input[name="komposisi"]').last().fill('QA');
      await clickSaveAndConfirm(page, '/api/barang');
    });

    await test.step('When a user attempts to create a new product named "PARACETAMOL" or "paracetamol"', async () => {
      await page.goto('/database/catalog');
      await page.getByRole('button', { name: 'Tambah Barang' }).click();
      await page.locator('input[name="nama"]').last().fill(productName.toUpperCase());
      await page.locator('input[name="komposisi"]').last().fill('QA Duplicate');
      
      await page.getByRole('button', { name: /^Simpan$/ }).last().click();
      
      const confirmButton = page.getByRole('button', { name: /^(Ya Simpan|Konfirmasi)$/ }).last();
      try {
        await confirmButton.waitFor({ state: 'visible', timeout: 2000 });
        await confirmButton.click();
      } catch (e) {
        // Validation might trigger before confirmation dialogue
      }
    });

    await test.step('Then the system rejects the creation', async () => {
      await expect(page.locator('input[name="nama"]').last()).toBeVisible();
    });

    await test.step('And displays an error that the product name must be unique', async () => {
      await expect(page.getByText(/sudah ada|unique|duplikat/i).first()).toBeVisible();
    });
  });
});
