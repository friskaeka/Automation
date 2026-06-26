const { test, expect } = require('@playwright/test');
const { TONO_ACCOUNT, loginViaUi } = require('../helpers/medistock');

function uniqueSuffix() {
  return `${Date.now()}`.slice(-6);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function confirmSave(page) {
  const dialog = page.getByRole('dialog').last();
  if (await dialog.isVisible().catch(() => false)) {
    const confirm = dialog.getByRole('button', { name: /^(Ya Simpan|Konfirmasi|Simpan)$/ }).last();
    await expect(confirm).toBeVisible();
    await confirm.click();
  }
}

async function clickSaveAndConfirm(page, postPath) {
  const responsePromise = page.waitForResponse(
    response => response.url().includes(postPath) && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /^Simpan$/ }).last().click();
  await confirmSave(page);
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

async function createSupplier(page, name) {
  await page.goto('/database/supplier');
  await page.getByRole('button', { name: 'Tambah Supplier' }).click();
  await page.locator('input[name="supplierName"]').last().fill(name);
  await page.locator('input[name="phoneNumber"]').last().fill('081234560077');
  await clickSaveAndConfirm(page, '/api/supplier');
}

async function createProduct(page, productName, unitName) {
  await page.goto('/database/catalog');
  await page.getByRole('button', { name: 'Tambah Barang' }).click();
  await page.locator('input[name="nama"]').last().fill(productName);
  await selectComboboxOption(page, 0, unitName);
  if (await page.locator('[role="combobox"]').nth(1).isEnabled()) {
    await selectComboboxOption(page, 1, unitName);
  }
  await page.locator('input[name="komposisi"]').last().fill('QA Faktur');
  await clickSaveAndConfirm(page, '/api/barang');
}

async function chooseVisibleDay(page, dayText) {
  await page.getByRole('button', { name: dayText, exact: true }).last().click();
}

test.describe('Inventory and Purchase Management @inventory @purchase', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, TONO_ACCOUNT);
  });

  test('TC-INV-001 - Recording a Purchase Invoice and validating item calculation @positive @invoice', async ({ page }) => {
    test.setTimeout(120000);

    const suffix = uniqueSuffix();
    const unitName = `Unit INV ${suffix}`;
    const unitAbbr = `UI${suffix.slice(-4)}`;
    const supplierName = `Supplier INV ${suffix}`;
    const productName = `Produk INV ${suffix}`;
    const invoiceNumber = `INV-AUTO-${suffix}`;

    await test.step('Given supplier, unit, and product data exist', async () => {
      await createUnit(page, unitName, unitAbbr);
      await createSupplier(page, supplierName);
      await createProduct(page, productName, unitName);
    });

    await test.step('When user fills purchase invoice header', async () => {
      await page.goto('/purchases/purchase-invoice/add');
      await selectComboboxOption(page, 0, supplierName);
      await page.locator('input[name="invoiceNumber"]').fill(invoiceNumber);
    });

    await test.step('And user adds one invoice item with nominal discount', async () => {
      await page.getByRole('button', { name: 'Tambah Barang' }).click();
      await selectComboboxOption(page, 2, productName);
      await selectComboboxOption(page, 3, unitName);
      await page.locator('input[name="batchNo"]').fill(`BATCH-${suffix}`);

      await page.getByRole('button', { name: /Tanggal Kedaluwarsa/ }).click();
      await chooseVisibleDay(page, '30');

      await page.locator('input[name="qty"]').fill('2');
      await page.locator('input[name="price"]').fill('10000');
      await page.locator('input[name="discountValue"]').fill('1000');

      await expect(page.getByText('Rp 19.000')).toBeVisible();
      await page.getByRole('button', { name: /^Simpan$/ }).last().click();
    });

    await test.step('Then invoice totals are calculated correctly before saving', async () => {
      const main = page.getByRole('main');
      await expect(main).toContainText(productName);
      await expect(main).toContainText('Rp 19.000');
      await expect(main).toContainText('Rp 2.090');
      await expect(main).toContainText('Rp 21.090');
      await expect(main).toContainText('Total Faktur');
    });

    await test.step('And invoice is saved and searchable in invoice list', async () => {
      const invoiceResponsePromise = page.waitForResponse(
        response => response.url().includes('/api') && response.request().method() === 'POST'
      );
      await page.getByRole('button', { name: /^Simpan$/ }).last().click();
      await confirmSave(page);
      const invoiceResponse = await invoiceResponsePromise;
      expect(invoiceResponse.ok()).toBe(true);

      await page.goto('/purchases/purchase-invoice');
      await page.getByPlaceholder('Cari berdasarkan No Faktur atau No Batch').fill(invoiceNumber);
      await expect(page.getByRole('main')).toContainText(invoiceNumber);
      await expect(page.getByRole('main')).toContainText(/Rp\s*21\.090/);
    });
  });

  test('TC-INV-002 - Defecta low-stock alert management @inventory', async () => {
    test.fixme(true, 'Needs a stable low-stock fixture and expected defecta lifecycle data.');
  });

  test('TC-INV-003 - Stock Opname correction updates global stock and history @inventory', async () => {
    test.fixme(true, 'Needs stock-opname page contract and stock history verification fixture.');
  });

  test('TC-INV-004 - Corner case: invoice receipt below minimum stock keeps Defecta unresolved @abnormal', async () => {
    test.fixme(true, 'Needs product with configured minimum stock and defecta precondition.');
  });
});
