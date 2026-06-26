const { test, expect } = require('@playwright/test');
const { loginViaUi } = require('../helpers/medistock');

const TONO_ACCOUNT = {
  email: process.env.MEDISTOCK_TONO_EMAIL || 'tono12@yopmail.com',
  username: process.env.MEDISTOCK_TONO_USERNAME || 'Tono',
  password: process.env.MEDISTOCK_TONO_PASSWORD || 'Tono1234'
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniqueSuffix() {
  return `${Date.now()}`.slice(-6);
}

async function clickSaveAndConfirm(page, postPath) {
  const responsePromise = page.waitForResponse(
    response => response.url().includes(postPath) && response.request().method() === 'POST'
  );

  await page.getByRole('button', { name: /^Simpan$/ }).last().click();

  const confirmButton = page
    .getByRole('button', { name: /^(Ya Simpan|Konfirmasi)$/ })
    .last();
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();

  const response = await responsePromise;
  expect(response.status(), `${postPath} should return Created`).toBe(201);
}

async function expectSearchResult(page, route, placeholder, expectedText) {
  await page.goto(route);
  await page.getByPlaceholder(placeholder).fill(expectedText);

  await expect(async () => {
    const text = await page.getByRole('main').innerText();
    expect(text.toLowerCase()).toContain(expectedText.toLowerCase());
  }).toPass({ timeout: 10000 });
}

async function createMasterData(page, config) {
  await test.step(`${config.id} - ${config.scenario}`, async () => {
    await page.goto(config.route);
    await page.getByRole('button', { name: config.addButton }).click();

    for (const [name, value] of Object.entries(config.fields)) {
      await page.locator(`input[name="${name}"], textarea[name="${name}"]`).last().fill(value);
    }

    await clickSaveAndConfirm(page, config.postPath);
    await expectSearchResult(page, config.route, config.searchPlaceholder, config.expectedText);
  });
}

async function selectComboboxOption(page, comboboxIndex, optionText) {
  await page.locator('[role="combobox"]').nth(comboboxIndex).click();
  const exactOption = page.getByRole('option', {
    name: new RegExp(escapeRegExp(optionText), 'i')
  });

  if (await exactOption.count()) {
    await exactOption.first().click();
    return;
  }

  await page.getByRole('option').first().click();
}

test.describe('Database input with Tono account @database @tono', () => {
  test('input database master data and catalog item @critical @database-input', async ({ page }) => {
    test.setTimeout(120000);

    const suffix = uniqueSuffix();
    const testData = {
      unitName: `Tablet Tono ${suffix}`,
      unitAbbr: `TT${suffix.slice(-4)}`,
      supplierName: `Supplier Tono ${suffix}`,
      doctorName: `Dr Tono ${suffix}`,
      patientName: `Pasien Tono ${suffix}`,
      paymentName: `Transfer Tono ${suffix}`,
      productName: `Barang Tono ${suffix}`
    };

    await test.step('TC-DB-000 - Login akun Tono', async () => {
      await loginViaUi(page, TONO_ACCOUNT);
      await expect(page.getByText('Masa percobaan aktif.')).toBeVisible();
    });

    await createMasterData(page, {
      id: 'TC-DB-001',
      scenario: 'Input satuan baru',
      route: '/database/unit',
      addButton: 'Tambah Satuan',
      fields: {
        nama: testData.unitName,
        singkatan: testData.unitAbbr
      },
      postPath: '/api/satuan',
      searchPlaceholder: 'Cari Satuan...',
      expectedText: testData.unitName
    });

    await createMasterData(page, {
      id: 'TC-DB-002',
      scenario: 'Input supplier baru',
      route: '/database/supplier',
      addButton: 'Tambah Supplier',
      fields: {
        supplierName: testData.supplierName,
        phoneNumber: '081234560001'
      },
      postPath: '/api/supplier',
      searchPlaceholder: 'Cari Supplier...',
      expectedText: testData.supplierName
    });

    await createMasterData(page, {
      id: 'TC-DB-003',
      scenario: 'Input dokter baru',
      route: '/database/doctor',
      addButton: 'Tambah Dokter',
      fields: {
        name: testData.doctorName,
        phoneNumber: '081234560002',
        address: 'Alamat QA Tono'
      },
      postPath: '/api/dokter',
      searchPlaceholder: 'Cari Dokter...',
      expectedText: testData.doctorName
    });

    await createMasterData(page, {
      id: 'TC-DB-004',
      scenario: 'Input pasien baru',
      route: '/database/patient',
      addButton: 'Tambah Pasien',
      fields: {
        nama: testData.patientName,
        noTelpon: '081234560003',
        alamat: 'Alamat Pasien QA Tono'
      },
      postPath: '/api/pasien',
      searchPlaceholder: 'Cari Pasien...',
      expectedText: testData.patientName
    });

    await createMasterData(page, {
      id: 'TC-DB-005',
      scenario: 'Input metode pembayaran baru',
      route: '/database/payment-methods',
      addButton: 'Tambah Metode Pembayaran',
      fields: {
        namaMetodePembayaran: testData.paymentName,
        noRekening: '1234567890',
        pemilikRekening: 'Tono QA'
      },
      postPath: '/api/metode-pembayaran',
      searchPlaceholder: 'Cari Metode Pembayaran...',
      expectedText: testData.paymentName
    });

    await test.step('TC-DB-006 - Input katalog/barang baru', async () => {
      await page.goto('/database/catalog');
      await page.getByRole('button', { name: 'Tambah Barang' }).click();

      await page.locator('input[name="nama"]').last().fill(testData.productName);
      await selectComboboxOption(page, 0, testData.unitName);

      const mainUnitCombobox = page.locator('[role="combobox"]').nth(1);
      if (await mainUnitCombobox.isEnabled()) {
        await selectComboboxOption(page, 1, testData.unitName);
      }

      await page.locator('input[name="komposisi"]').last().fill('QA Tono');
      await clickSaveAndConfirm(page, '/api/barang');
      await expectSearchResult(
        page,
        '/database/catalog',
        'Cari Barang atau Komposisi...',
        testData.productName
      );
    });
  });
});
