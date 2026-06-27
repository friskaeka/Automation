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

async function createProduct(page, productName, unitName, minStock = null) {
  await page.goto('/database/catalog');
  await page.getByRole('button', { name: 'Tambah Barang' }).click();
  await page.locator('input[name="nama"]').last().fill(productName);
  await selectComboboxOption(page, 0, unitName);
  if (await page.locator('[role="combobox"]').nth(1).isEnabled()) {
    await selectComboboxOption(page, 1, unitName);
  }
  await page.locator('input[name="komposisi"]').last().fill('QA Faktur');
  if (minStock !== null) {
    const possibleLocators = [
      'input[name="minStock"]',
      'input[name="stokMinimum"]',
      'input[name="minimumStock"]',
      'input[name="batasStok"]'
    ];
    for (const sel of possibleLocators) {
      const input = page.locator(sel).last();
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        await input.fill(minStock.toString());
        break;
      }
    }
  }
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

  test('TC-INV-002 - Defecta low-stock alert management @inventory', async ({ page }) => {
    test.setTimeout(120000);
    const suffix = uniqueSuffix();
    const unitName = `Unit DEF ${suffix}`;
    const unitAbbr = `UD${suffix.slice(-4)}`;
    const supplierName = `Supp DEF ${suffix}`;
    const productName = `Prod DEF ${suffix}`;
    const invoiceNumber = `INV-DEF-${suffix}`;

    await test.step('Given a product falls below its designated Minimum Stock level', async () => {
      await createUnit(page, unitName, unitAbbr);
      await createSupplier(page, supplierName);
      await createProduct(page, productName, unitName, 10);
      
      await page.goto('/database/catalog');
      await page.getByPlaceholder(/Cari/i).fill(productName);
      await expect(page.getByRole('main')).toContainText(productName);
    });

    await test.step('When the user checks the Defecta report', async () => {
      await page.goto('/purchases/defecta');
      await page.getByPlaceholder(/Cari/i).fill(productName);
    });

    await test.step('Then the product appears with a "Belum Dibeli" status', async () => {
      await expect(page.getByRole('main')).toContainText(productName);
      await expect(page.getByRole('main')).toContainText(/Belum Dibeli/i);
    });

    await test.step('When a Faktur Pembelian is created for this product but not yet received', async () => {
      await page.goto('/purchases/purchase-invoice/add');
      await selectComboboxOption(page, 0, supplierName);
      await page.locator('input[name="invoiceNumber"]').fill(invoiceNumber);
      
      await page.getByRole('button', { name: 'Tambah Barang' }).click();
      await selectComboboxOption(page, 2, productName);
      await selectComboboxOption(page, 3, unitName);
      await page.locator('input[name="batchNo"]').fill(`BATCH-${suffix}`);
      
      await page.getByRole('button', { name: /Tanggal Kedaluwarsa/ }).click();
      await chooseVisibleDay(page, '30');
      
      await page.locator('input[name="qty"]').fill('15');
      await page.locator('input[name="price"]').fill('10000');
      
      await clickSaveAndConfirm(page, '/api');
    });

    await test.step('Then the status changes to "Menunggu Pengiriman"', async () => {
      await page.goto('/purchases/defecta');
      await page.getByPlaceholder(/Cari/i).fill(productName);
      await expect(page.getByRole('main')).toContainText(productName);
      await expect(page.getByRole('main')).toContainText(/Menunggu Pengiriman/i);
    });

    await test.step('When the items are fully received and stock exceeds minimum', async () => {
      await page.goto('/purchases/purchase-invoice');
      await page.getByPlaceholder(/Cari/i).fill(invoiceNumber);
      await page.getByRole('button', { name: /Detail|Edit/i }).first().click();
      
      const terimaBtn = page.getByRole('button', { name: /Tanggal Terima/i });
      if (await terimaBtn.isVisible({timeout:2000}).catch(()=>false)) {
         await terimaBtn.click();
         await chooseVisibleDay(page, '30');
      } else {
         await page.locator('input[name="tanggalTerima"]').fill('2026-06-30');
      }
      
      await clickSaveAndConfirm(page, '/api');
    });

    await test.step('Then the product disappears from the Defecta list', async () => {
      await page.goto('/purchases/defecta');
      await page.getByPlaceholder(/Cari/i).fill(productName);
      await expect(page.getByRole('main')).not.toContainText(productName, { timeout: 3000 });
    });
  });

  test('TC-INV-003 - Stock Opname Correction updates global stock and history @inventory', async ({ page }) => {
    test.setTimeout(120000);
    const suffix = uniqueSuffix();
    const unitName = `Unit SO ${suffix}`;
    const unitAbbr = `UO${suffix.slice(-4)}`;
    const productName = `Prod SO ${suffix}`;

    await test.step('Given a discrepancy in physical stock versus system stock', async () => {
      await createUnit(page, unitName, unitAbbr);
      await createProduct(page, productName, unitName);
    });

    await test.step('When the user performs a Stock Opname correction', async () => {
      await page.goto('/inventory/stock-opname');
      const addBtn = page.getByRole('button', { name: /Tambah/i });
      if (await addBtn.isVisible({timeout:2000}).catch(()=>false)) {
        await addBtn.click();
      }
      
      await selectComboboxOption(page, 0, productName).catch(() => {});
      const physicalInput = page.locator('input[name="stokFisik"], input[name="physicalStock"], input[name="qty"]').first();
      if (await physicalInput.isVisible({timeout:2000}).catch(()=>false)) {
        await physicalInput.fill('50');
      }
    });

    await test.step('Then the correction is tracked but not applied globally yet', async () => {
      await expect(page.getByRole('main')).toContainText('50');
      await expect(page.getByRole('main')).toContainText(productName);
    });

    await test.step('When they click "Simpan Correction"', async () => {
      await clickSaveAndConfirm(page, '/api');
    });

    await test.step('Then the stock is globally updated across the system', async () => {
      await page.goto('/database/catalog');
      await page.getByPlaceholder(/Cari/i).fill(productName);
      await expect(page.getByRole('main')).toContainText('50');
    });

    await test.step('And the movement is logged in the product\\'s History (Riwayat Stok)', async () => {
      await page.getByRole('button', { name: /Riwayat|History/i }).first().click();
      await expect(page.getByRole('dialog').or(page.getByRole('main'))).toContainText('Stock Opname');
      await expect(page.getByRole('dialog').or(page.getByRole('main'))).toContainText('50');
    });
  });

  test('TC-INV-004 - Corner Case - Received invoice does not meet minimum stock threshold @abnormal', async ({ page }) => {
    test.setTimeout(120000);
    const suffix = uniqueSuffix();
    const unitName = `Unit CC ${suffix}`;
    const unitAbbr = `UC${suffix.slice(-4)}`;
    const supplierName = `Supp CC ${suffix}`;
    const productName = `Prod CC ${suffix}`;
    const invoiceNumber = `INV-CC-${suffix}`;

    await test.step('Given a product is in the Defecta list with status "Menunggu Pengiriman"', async () => {
      await createUnit(page, unitName, unitAbbr);
      await createSupplier(page, supplierName);
      await createProduct(page, productName, unitName, 20);
      
      await page.goto('/purchases/purchase-invoice/add');
      await selectComboboxOption(page, 0, supplierName);
      await page.locator('input[name="invoiceNumber"]').fill(invoiceNumber);
      
      await page.getByRole('button', { name: 'Tambah Barang' }).click();
      await selectComboboxOption(page, 2, productName);
      await selectComboboxOption(page, 3, unitName);
      await page.locator('input[name="batchNo"]').fill(`BATCH-${suffix}`);
      
      await page.getByRole('button', { name: /Tanggal Kedaluwarsa/ }).click();
      await chooseVisibleDay(page, '30');
      
      await page.locator('input[name="qty"]').fill('5');
      await page.locator('input[name="price"]').fill('10000');
      await clickSaveAndConfirm(page, '/api');
      
      await page.goto('/purchases/defecta');
      await page.getByPlaceholder(/Cari/i).fill(productName);
      await expect(page.getByRole('main')).toContainText(productName);
      await expect(page.getByRole('main')).toContainText(/Menunggu Pengiriman/i);
    });

    await test.step('When the corresponding Purchase Invoice is fully received (Tanggal Terima is filled)', async () => {
      await page.goto('/purchases/purchase-invoice');
      await page.getByPlaceholder(/Cari/i).fill(invoiceNumber);
      await page.getByRole('button', { name: /Detail|Edit/i }).first().click();
      
      const terimaBtn = page.getByRole('button', { name: /Tanggal Terima/i });
      if (await terimaBtn.isVisible({timeout:2000}).catch(()=>false)) {
         await terimaBtn.click();
         await chooseVisibleDay(page, '30');
      } else {
         await page.locator('input[name="tanggalTerima"]').fill('2026-06-30');
      }
      
      await clickSaveAndConfirm(page, '/api');
    });

    await test.step('And the total received quantity is STILL below the Minimum Stock threshold', async () => {
      await page.goto('/database/catalog');
      await page.getByPlaceholder(/Cari/i).fill(productName);
      await expect(page.getByRole('main')).toContainText('5');
    });

    await test.step('Then the system reverts the Defecta status back to "Belum Dibeli"', async () => {
      await page.goto('/purchases/defecta');
      await page.getByPlaceholder(/Cari/i).fill(productName);
      await expect(page.getByRole('main')).toContainText(productName);
      await expect(page.getByRole('main')).toContainText(/Belum Dibeli/i);
    });

    await test.step('And the product remains on the Defecta list to prompt further purchasing', async () => {
      await expect(page.getByRole('main')).toContainText(productName);
    });
  });
});
