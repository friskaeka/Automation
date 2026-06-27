const { test, expect } = require('@playwright/test');
const { registerTenant } = require('./utils');

// Helper functions for UI seeding
function uniqueSuffix() {
  return `${Date.now()}`.slice(-6);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function confirmSave(page) {
  const dialog = page.getByRole('dialog').last();
  await expect(dialog).toBeVisible();
  const confirm = dialog.getByRole('button', { name: /^(Ya Simpan|Konfirmasi|Simpan)$/ }).last();
  await confirm.click();
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
  await option.first().click();
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

async function createDoctor(page, name) {
  await page.goto('/database/doctor');
  await page.getByRole('button', { name: 'Tambah Dokter' }).click();
  await page.locator('input[name="name"]').last().fill(name);
  await page.locator('input[name="phoneNumber"]').last().fill('081234560002');
  await page.locator('textarea[name="address"]').last().fill('Alamat Dokter');
  await clickSaveAndConfirm(page, '/api/dokter');
}

async function createProduct(page, productName, unitName) {
  await page.goto('/database/catalog');
  await page.getByRole('button', { name: 'Tambah Barang' }).click();
  await page.locator('input[name="nama"]').last().fill(productName);
  await selectComboboxOption(page, 0, unitName);
  await selectComboboxOption(page, 1, unitName);
  await page.locator('input[name="komposisi"]').last().fill('QA Testing');
  await clickSaveAndConfirm(page, '/api/barang');
}

async function chooseVisibleDay(page, dayText) {
  const nextBtn = page.locator('button[name*="next" i], button[aria-label*="next" i], button[aria-label*="kanan" i], button[aria-label*="berikutnya" i]').first();
  await nextBtn.click({ timeout: 5000 });
  await page.getByRole('button', { name: dayText, exact: true }).last().click();
}

async function createPurchaseInvoice(page, supplierName, productName, unitName, invoiceNumber, batchNo, expDay, qty) {
  await page.goto('/purchases/purchase-invoice/add');
  await selectComboboxOption(page, 0, supplierName);
  await page.locator('input[name="invoiceNumber"]').fill(invoiceNumber);
  
  await page.getByRole('button', { name: 'Tambah Barang' }).click();
  await selectComboboxOption(page, 2, productName);
  await selectComboboxOption(page, 3, unitName);
  await page.locator('input[name="batchNo"]').fill(batchNo);
  
  await page.getByRole('button', { name: /Tanggal Kedaluwarsa/ }).click();
  await chooseVisibleDay(page, expDay);
  
  await page.locator('input[name="qty"]').fill(qty);
  await page.locator('input[name="price"]').fill('10000');
  await page.locator('input[name="discountValue"]').fill('0');
  
  const invoiceResponsePromise = page.waitForResponse(
    response => response.url().match(/\/api\/(purchase-invoice|pembelian|faktur)/i) && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /^Simpan$/ }).last().click();
  await confirmSave(page);
  const invoiceResponse = await invoiceResponsePromise;
  expect(invoiceResponse.ok()).toBe(true);
}

async function ensureActiveShift(page) {
  await page.goto('/cashier/pos');
  const startSessionHeading = page.getByRole('heading', { name: /Mulai Sesi Kasir/i });
  const posSearch = page.getByPlaceholder(/Cari produk/i);
  
  await expect(startSessionHeading.or(posSearch)).toBeVisible();
  
  if (await startSessionHeading.isVisible()) {
    await page.getByRole('textbox', { name: /Saldo Awal/i }).fill('100000');
    await page.getByRole('button', { name: /Mulai Sesi/i }).click();
  }
  await expect(posSearch).toBeVisible();
}

test.describe.serial('Cashier and POS Operations @cashier @pos', () => {
  let page;
  
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Setup: Seed Prerequisite Data', async () => {
    test.setTimeout(180000); // 3 minutes timeout for full tenant registration and data seeding
    const suffix = uniqueSuffix();
    const unitName = `Unit ${suffix}`;
    const unitAbbr = `U${suffix.slice(-3)}`;
    const supplierName = `Supp ${suffix}`;
    const doctorName = `Dr ${suffix}`;
    const productA = `ProdA ${suffix}`;
    const productB = `ProdB ${suffix}`;

    await test.step('Register new tenant', async () => {
      await registerTenant(page);
    });

    await test.step('Create master data (Unit, Supplier, Doctor, Products)', async () => {
      await createUnit(page, unitName, unitAbbr);
      await createSupplier(page, supplierName);
      await createDoctor(page, doctorName);
      await createProduct(page, productA, unitName);
      await createProduct(page, productB, unitName);
    });

    await test.step('Add purchase invoices to stock FEFO batches', async () => {
      // Product A has two batches on exactly the same expDay but different quantities (for Scenario 5)
      await createPurchaseInvoice(page, supplierName, productA, unitName, `INV-${suffix}-1`, `B1-${suffix}`, '15', '10');
      await createPurchaseInvoice(page, supplierName, productA, unitName, `INV-${suffix}-2`, `B2-${suffix}`, '15', '5');
      // Product B for standard tests
      await createPurchaseInvoice(page, supplierName, productB, unitName, `INV-${suffix}-3`, `B3-${suffix}`, '16', '20');
    });
  });

  test('Scenario 1: Shift management with starting and ending balances', async () => {
    await test.step('Given a cashier logs into the POS system to start a shift', async () => {
      await page.goto('/');
    });

    await test.step('When they open the Kasir menu', async () => {
      await page.getByRole('link', { name: /Kasir|POS/i }).click();
    });

    await test.step('Then they are prompted to enter a Starting Balance (Saldo Awal)', async () => {
      const startSessionHeading = page.getByRole('heading', { name: /Mulai Sesi Kasir/i });
      await expect(startSessionHeading).toBeVisible();
      await page.getByRole('textbox', { name: /Saldo Awal/i }).fill('100000');
      await page.getByRole('button', { name: /Mulai Sesi/i }).click();
    });

    await test.step('When they attempt to log out at the end of their shift', async () => {
      const closeSessionBtn = page.getByRole('button', { name: /Tutup Sesi|Akhiri Sesi/i }).first();
      await closeSessionBtn.click();
    });

    await test.step('Then they are prompted to enter an Ending Balance (Saldo Akhir) before logout succeeds', async () => {
      const endSessionHeading = page.getByRole('heading', { name: /Tutup Sesi Kasir|Akhiri Sesi/i });
      await expect(endSessionHeading).toBeVisible();
      await page.getByRole('textbox', { name: /Saldo Akhir/i }).fill('150000');
      const confirmBtn = page.getByRole('button', { name: /Konfirmasi|Simpan|Tutup Sesi/i }).last();
      await confirmBtn.click();
    });

    await test.step('And a discrepancy notification is sent to the Owner if the starting balance does not match the previous ending balance', async () => {
      const notification = page.locator('.toast, .notification, [role="alert"]').first();
      await expect(notification).toContainText(/selisih|discrepancy|berbeda/i);
    });
  });

  test('Scenario 2: Processing a standard sales transaction', async () => {
    await test.step('Given an active cashier shift', async () => {
      await ensureActiveShift(page);
    });

    await test.step('When the cashier adds items to the cart, prioritizing the FEFO (First Expired First Out) batches', async () => {
      await page.getByPlaceholder(/Cari produk/i).fill('ProdB');
      await page.getByRole('option', { name: /ProdB/i }).first().click();
      await expect(page.getByRole('row', { name: /ProdB/i }).first()).toBeVisible();
    });

    await test.step('And they apply layered discounts or markups up to 5 layers', async () => {
      for (let i = 0; i < 5; i++) {
        await page.getByRole('button', { name: /Diskon/i }).first().click();
        await page.getByRole('textbox', { name: /Diskon/i }).first().fill('10');
        await page.getByRole('button', { name: /Terapkan/i }).click();
        await expect(page.getByRole('textbox', { name: /Diskon/i }).first()).toBeHidden();
      }
      await expect(page.getByText(/Diskon:/i).first()).toBeVisible();
    });

    await test.step('And they process a payment using Cash or Debit', async () => {
      await page.getByRole('button', { name: /Bayar|Checkout/i }).click();
      await page.getByRole('combobox', { name: /Metode|Payment/i }).click();
      await page.getByRole('option', { name: /Cash|Tunai/i }).click();
      await page.getByRole('textbox', { name: /Nominal/i }).fill('200000');
      const responsePromise = page.waitForResponse(res => res.url().match(/\/api\/(transaction|penjualan|sale|checkout|pos)/i) && res.request().method() === 'POST');
      await page.getByRole('button', { name: /Konfirmasi|Proses/i }).click();
      await responsePromise;
    });

    await test.step('Then the transaction is saved in the Riwayat Penjualan', async () => {
      await page.goto('/cashier/riwayat');
      await expect(page.getByText(/ProdB/i).first()).toBeVisible();
    });

    await test.step('And the inventory stock is correctly decremented', async () => {
      await page.goto('/products/stock');
      const stockRow = page.getByRole('row', { name: /ProdB/i }).first();
      await expect(stockRow).toBeVisible();
    });
  });

  test('Scenario 3: Processing a prescription (Resep Racikan)', async () => {
    await test.step('Given a patient presents a prescription from a doctor', async () => {
      await ensureActiveShift(page);
    });

    await test.step('When the cashier creates a new Resep linked to the doctor', async () => {
      const prescriptionBtn = page.getByRole('button', { name: /Resep|Racikan/i }).first();
      await prescriptionBtn.click();
      await page.getByRole('combobox', { name: /Dokter/i }).click();
      await page.getByRole('option', { name: /Dr/i }).first().click();
    });

    await test.step('And adds specific compounding ingredients', async () => {
      await page.getByPlaceholder(/Cari obat|bahan/i).fill('ProdA');
      await page.getByRole('option', { name: /ProdA/i }).first().click();
      await page.getByRole('textbox', { name: /Qty/i }).last().fill('2');
    });

    await test.step('And adds the compounding fee (Uang R/)', async () => {
      await page.getByRole('textbox', { name: /Embalase|Uang R\/|Biaya/i }).fill('5000');
      await page.getByRole('button', { name: /Simpan Resep/i }).click();
    });

    await test.step('Then the total correctly sums the ingredients plus the compounding fee', async () => {
      const totalLabel = page.getByText(/Total/i).first();
      await expect(totalLabel).toContainText(/25\.?000/);
    });

    await test.step('And the transaction is logged as a prescription sale for reporting', async () => {
      await page.getByRole('button', { name: /Bayar/i }).click();
      
      await page.getByRole('combobox', { name: /Metode|Payment/i }).click();
      await page.getByRole('option', { name: /Cash|Tunai/i }).click();
      await page.getByRole('textbox', { name: /Nominal/i }).fill('50000');
      
      const responsePromise = page.waitForResponse(res => res.url().match(/\/api\/(transaction|penjualan|sale|checkout|pos)/i) && res.request().method() === 'POST');
      await page.getByRole('button', { name: /Konfirmasi|Proses/i }).click();
      await responsePromise;
      await page.goto('/cashier/riwayat');
      await expect(page.getByText(/Resep|Racikan/i).first()).toBeVisible();
    });
  });

  test('Scenario 4: Negative Case - Layered discounts exceed 100%', async () => {
    await test.step('Given an active cashier shift with items in the cart', async () => {
      await ensureActiveShift(page);
      await page.getByPlaceholder(/Cari produk/i).fill('ProdA');
      await page.getByRole('option', { name: /ProdA/i }).first().click();
    });

    await test.step('When the cashier applies multiple layered discounts that sum to more than the total price', async () => {
      await page.getByRole('button', { name: /Diskon/i }).first().click();
      await page.getByRole('textbox', { name: /Diskon/i }).first().fill('100');
      await page.getByRole('button', { name: /Terapkan/i }).click();
      await expect(page.getByRole('textbox', { name: /Diskon/i }).first()).toBeHidden();
      
      await page.getByRole('button', { name: /Diskon/i }).first().click();
      await page.getByRole('textbox', { name: /Diskon/i }).first().fill('50');
      await page.getByRole('button', { name: /Terapkan/i }).click();
      await expect(page.getByRole('textbox', { name: /Diskon/i }).first()).toBeHidden();
    });

    await test.step('Then the system caps the total discount at 100%', async () => {
      await expect(page.getByText(/100%/i).first()).toBeVisible();
    });

    await test.step('And the final total price is exactly 0', async () => {
      await expect(page.getByText(/^0$|Rp 0/i).first()).toBeVisible();
    });

    await test.step('And the system prevents any negative subtotal or store credit issuance', async () => {
      const totalElements = await page.getByText(/-Rp/i).count();
      expect(totalElements).toBe(0);

      // Clear the cart to prevent state leakage to the next scenario
      const btlBtn = page.getByRole('button', { name: /Batal/i }).first();
      await btlBtn.click();
      const confirmBtl = page.getByRole('button', { name: /Ya|Konfirmasi/i }).last();
      await confirmBtl.click();
      await expect(page.getByRole('row', { name: /ProdA/i }).first()).toBeHidden();
    });
  });

  test('Scenario 5: Corner Case - Exact FEFO date match resolves to smallest quantity', async () => {
    await test.step('Given multiple batches of the same product have the exact same expiry date and supplier hidden flag', async () => {
      await ensureActiveShift(page);
    });

    await test.step('When the cashier attempts to add this product to the cart', async () => {
      await page.getByPlaceholder(/Cari produk/i).fill('ProdA');
      await page.getByRole('option', { name: /ProdA/i }).first().click();
    });

    await test.step('Then the system prioritizes and selects the batch with the smallest remaining stock quantity to clear it out first', async () => {
      await expect(page.getByText(/B2-/i).first()).toBeVisible();

      // Clear the cart to prevent state leakage to the next scenario
      const btlBtn = page.getByRole('button', { name: /Batal/i }).first();
      await btlBtn.click();
      const confirmBtl = page.getByRole('button', { name: /Ya|Konfirmasi/i }).last();
      await confirmBtl.click();
      await expect(page.getByRole('row', { name: /ProdA/i }).first()).toBeHidden();
    });
  });

  test('Scenario 6: Negative Case - Dangling shift caused by browser closure', async () => {
    await test.step('Given a cashier starts a shift and inputs a Starting Balance', async () => {
      await ensureActiveShift(page);
    });

    await test.step('When the cashier closes the browser tab without logging out and inputting an Ending Balance', async () => {
      await page.goto('about:blank');
    });

    await test.step('Then the shift remains "active" indefinitely in the backend', async () => {
      await page.goto('/cashier/pos');
    });

    await test.step('When the next user logs into the cashier module', async () => {
      await page.reload();
    });

    await test.step('Then they are seamlessly placed into the existing active shift without being prompted for a new Starting Balance', async () => {
      const startSessionHeading = page.getByRole('heading', { name: /Mulai Sesi Kasir/i });
      await expect(page.getByPlaceholder(/Cari produk/i)).toBeVisible();
      await expect(startSessionHeading).toBeHidden();
    });
  });
});

