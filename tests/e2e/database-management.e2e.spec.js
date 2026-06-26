const { test, expect } = require('@playwright/test');
const { TONO_ACCOUNT, loginViaUi } = require('../helpers/medistock');

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
  await page.getByRole('button', { name: /^(Ya Simpan|Konfirmasi)$/ }).last().click();
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

test.describe('Database & Master Data Management @database', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, TONO_ACCOUNT);
  });

  test('TC-DBM-001 - Creating a new Product/Katalog @positive', async ({ page }) => {
    const suffix = uniqueSuffix();
    const unitName = `Kapsul DBM ${suffix}`;
    const unitAbbr = `KD${suffix.slice(-4)}`;
    const productName = `Produk DBM ${suffix}`;

    await test.step('Given a unit exists for product configuration', async () => {
      await createUnit(page, unitName, unitAbbr);
    });

    await test.step('When user creates a catalog item using the unit', async () => {
      await page.goto('/database/catalog');
      await page.getByRole('button', { name: 'Tambah Barang' }).click();
      await page.locator('input[name="nama"]').last().fill(productName);
      await selectComboboxOption(page, 0, unitName);

      const mainUnitCombobox = page.locator('[role="combobox"]').nth(1);
      if (await mainUnitCombobox.isEnabled()) {
        await selectComboboxOption(page, 1, unitName);
      }

      await page.locator('input[name="komposisi"]').last().fill('QA DBM');
      await clickSaveAndConfirm(page, '/api/barang');
    });

    await test.step('Then product appears in catalog table', async () => {
      await page.goto('/database/catalog');
      await page.getByPlaceholder('Cari Barang atau Komposisi...').fill(productName);
      await expect(async () => {
        const text = await page.getByRole('main').innerText();
        expect(text.toLowerCase()).toContain(productName.toLowerCase());
      }).toPass({ timeout: 10000 });
    });
  });

  test('TC-DBM-002 - Automatic Selling Price calculation and overrides @calculation', async () => {
    test.fixme(true, 'Needs stable purchase/base-price fixture and expected max-markup notification rule.');
  });

  test('TC-DBM-003 - Managing Suppliers with basic configuration @positive', async ({ page }) => {
    const supplierName = `Supplier DBM ${uniqueSuffix()}`;

    await page.goto('/database/supplier');
    await page.getByRole('button', { name: 'Tambah Supplier' }).click();
    await page.locator('input[name="supplierName"]').last().fill(supplierName);
    await page.locator('input[name="phoneNumber"]').last().fill('081234560099');
    await clickSaveAndConfirm(page, '/api/supplier');

    await page.goto('/database/supplier');
    await page.getByPlaceholder('Cari Supplier...').fill(supplierName);
    await expect(page.getByRole('main')).toContainText(supplierName);
  });

  test('TC-DBM-004 - Negative case: duplicate entry creation is rejected case-insensitively @negative', async () => {
    test.fixme(true, 'Needs confirmed duplicate validation message and target master-data type before enforcing.');
  });
});
