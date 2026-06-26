# Medistock Test Execution Summary - 2026-06-25

## Ringkasan

| Item | Result |
| --- | --- |
| Website | https://medistock.web.id/ |
| Test Runner | Playwright |
| Browser | Chromium |
| Total Test | 9 |
| Passed | 9 |
| Failed | 0 |
| Expected-Failing Bug Guard | 2 |

## Test Result Table

| No | Area | Test Case | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Landing Page Navigation | Klik navbar `Harga`, klik CTA `Mulai Gratis 14 Hari`, lalu browser back | User kembali langsung ke landing page root `/` | User kembali ke `/#pricing` | Expected Fail / Known Bug |
| 2 | Tenant Isolation | Register tenant baru, buka `/settings/account`, cek user list | Hanya user tenant tersebut yang tampil; user tenant lain tidak tampil | Tenant baru hanya menampilkan user miliknya, tidak terlihat user lain seperti `annas`, `friska`, `beni`, `admin`, `saya` | Pass |
| 3 | Billing Invoice | Register tenant baru, buka `/settings/billing`, klik `Buat Invoice Pembayaran` | Request invoice sukses, tidak return HTTP 500 | `POST /api/billing/invoices` sukses | Pass |
| 4 | Master Data Satuan | Register tenant baru, buka `/database/unit`, tambah satuan baru, simpan | Satuan baru tersimpan dan tampil di tabel | Data satuan baru belum tampil/persist di tabel | Expected Fail / Known Bug |
| 5 | Public Landing | Buka homepage | Headline, CTA login/register, pricing, dan trial 14 hari tampil | Semua elemen utama landing page tampil | Pass |
| 6 | Register Apotek | Isi form `/sign-up` dengan apotek, SIA, username, email, password | Apotek baru dan owner user berhasil dibuat, lalu masuk dashboard | Register sukses, user masuk dashboard, status trial aktif | Pass |
| 7 | Login/Logout | Setelah register, logout lalu login ulang dengan flow 2-step | Logout sukses, login dengan email apotek + username/password sukses | User berhasil logout dan login kembali ke dashboard | Pass |
| 8 | Protected Routes | Tenant login membuka route utama POS dan billing | Semua route protected bisa diakses dan app shell tampil | Dashboard, database, purchase, cashier, stock, laporan, account, billing dapat diakses | Pass |
| 9 | Seed Landing | Buka landing page sebagai seed test | Landing page dapat dimuat | Landing page berhasil dimuat | Pass |

## Bug Yang Masih Aktif

| Bug ID | Area | Scenario | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| BUG-003 | Master Data Satuan | Tambah satuan baru di `/database/unit` | Row satuan baru tampil/persist di tabel | Row baru belum tampil/persist | Expected-failing regression guard |
| BUG-005 | Landing Page Navigation | `Harga` -> `Mulai Gratis 14 Hari` -> browser back | Kembali ke `/` | Kembali ke `/#pricing` | Expected-failing regression guard |

## Catatan

- BRD belum menyediakan test case eksplisit, jadi test case dibuat dari functional requirement dan behavior UI yang tersedia di website.
- Test yang membutuhkan payment gateway sandbox, webhook secret, admin account, email reset password, dan data setup khusus belum dijalankan otomatis.
