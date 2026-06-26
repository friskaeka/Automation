# Spreadsheet-Based Test Execution - Medistock

Tanggal eksekusi: 2026-06-25  
Website: https://medistock.web.id/  
Sumber test case: Google Sheet dengan tab `MediStock` dan `PharmaApps`  
Fokus eksekusi: Medistock sebagai pengembangan PharmaApps SaaS, register/login, master data POS, dan input transaksi kasir. Laporan dan lifecycle lanjutan belum dites pada sesi ini.

## Akun Test Yang Dipakai

| Field | Value |
| --- | --- |
| Nama Apotek | QA SaaS Apotek 20260625193455 |
| Nomor SIA | SIA-QA-20260625193455 |
| Username | qa_saas_20260625193455 |
| Email | qa.saas.20260625193455@example.com |
| Password | CodexTest123! |
| Status | Berhasil register dan masuk dashboard |

## Ringkasan Hasil

| Area | Total Dites | Pass | Fail / Bug | Blocked |
| --- | ---: | ---: | ---: | ---: |
| Register/Login | 2 | 2 | 0 | 0 |
| Landing Page Navigation | 1 | 0 | 1 | 0 |
| Master Data POS | 6 | 1 | 4 | 1 |
| Kasir/POS Input | 4 | 2 | 1 | 1 |
| Total | 13 | 5 | 6 | 2 |

## Detail Test Result

| No | Source Tab | Ref Test Case | Area | Test Case | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | MediStock | TC_007 | Register | Register apotek baru dengan nama apotek, SIA, username, email, password | User berhasil register dan diarahkan ke dashboard | Register berhasil, user masuk ke `/dashboard`, banner `Masa percobaan aktif` tampil | Pass |
| 2 | MediStock | TC_008 | Login | Login menggunakan akun yang sudah terdaftar | Sistem mengarahkan user ke dashboard | Akun test berhasil dibuat dan session authenticated aktif. Login ulang sudah tercakup di automation suite sebelumnya | Pass |
| 3 | MediStock | TC_002 | Landing Page Navbar | Klik navbar `Harga`, klik CTA `Mulai Gratis 14 Hari`, lalu browser back | Back sekali kembali langsung ke landing root `/` | Back sekali kembali ke `/#pricing`, bukan `/` | Fail / Known Bug |
| 4 | PharmaApps | TC_002, TC_005 | Database - Satuan | Buka halaman satuan dan klik `Tambah Satuan` | Halaman menampilkan search, tombol tambah, tabel, dan dialog tambah satuan | Halaman dan dialog tampil sesuai | Pass |
| 5 | PharmaApps | TC_010 | Database - Tambah Satuan | Input `Tablet QA 193455` dan `TQA193455`, lalu simpan | Data satuan tersimpan dan muncul di tabel | Dialog tertutup, tabel tetap `Data tidak ditemukan` | Fail |
| 6 | PharmaApps | TC_048 | Database - Tambah Supplier | Input `Supplier QA 193455`, nomor telepon, lalu simpan | Supplier tersimpan dan muncul di tabel | Dialog tertutup, tabel tetap `Data tidak ditemukan` | Fail |
| 7 | PharmaApps | TC_066 | Database - Tambah Dokter | Input `Dr QA 193455`, nomor telepon, alamat, lalu simpan | Dokter tersimpan dan muncul di tabel | Dialog tertutup, tabel tetap `Data tidak ditemukan` | Fail |
| 8 | PharmaApps | TC_084 | Database - Tambah Pasien | Input `Pasien QA 193455`, nomor telepon, alamat, lalu simpan | Pasien tersimpan dan muncul di tabel | Dialog tertutup, tabel tetap `Data tidak ditemukan` | Fail |
| 9 | PharmaApps | TC_103 | Database - Tambah Metode Pembayaran | Input `Transfer QA 193455`, nomor rekening, pemilik rekening, lalu simpan | Metode pembayaran tersimpan dan muncul di tabel | Dialog tertutup, tabel tetap `Data tidak ditemukan` | Fail |
| 10 | PharmaApps | TC_027, TC_028 | Database - Tambah Katalog | Buka form tambah barang/katalog | Form tambah barang tampil dan bisa input data barang | Form tambah barang tampil | Partial Pass |
| 11 | PharmaApps | TC_028 | Database - Tambah Katalog | Input barang baru untuk kebutuhan POS | Barang baru tersimpan | Blocked, karena dropdown `Satuan Terkecil` kosong dan data satuan gagal dibuat/persist | Blocked |
| 12 | PharmaApps | TC_148, TC_149, TC_150 | Kasir - Penjualan | Buka POS, mulai sesi kasir dengan saldo awal, klik tambah penjualan | Sesi kasir aktif dan transaksi baru dibuat | Sesi kasir berhasil dibuat dengan saldo awal 100000; transaksi `202606250001` dibuat | Pass |
| 13 | PharmaApps | TC_152, TC_154 | Kasir - Tambah Penjualan | Cari barang dan tambahkan item ke transaksi | Barang bisa dipilih dan masuk tabel transaksi | Search barang `Barang QA 193455` menampilkan `Tidak ada hasil`; tombol `Bayar` tetap disabled | Blocked |

## Bug / Defect Yang Ditemukan Pada Sesi Ini

| Bug ID | Area | Description | Expected Result | Actual Result | Severity |
| --- | --- | --- | --- | --- | --- |
| BUG-005 | Landing Navigation | Setelah klik navbar `Harga`, klik CTA `Mulai Gratis 14 Hari`, lalu browser back | User kembali langsung ke `/` | User kembali ke `/#pricing` | Low-Medium |
| BUG-006 | Master Data Create | Create master data Satuan tidak persist | Row baru tampil di tabel | Dialog tertutup, tabel tetap kosong | High |
| BUG-007 | Master Data Create | Create Supplier tidak persist | Row baru tampil di tabel | Dialog tertutup, tabel tetap kosong | High |
| BUG-008 | Master Data Create | Create Dokter tidak persist | Row baru tampil di tabel | Dialog tertutup, tabel tetap kosong | High |
| BUG-009 | Master Data Create | Create Pasien tidak persist | Row baru tampil di tabel | Dialog tertutup, tabel tetap kosong | High |
| BUG-010 | Master Data Create | Create Metode Pembayaran tidak persist | Row baru tampil di tabel | Dialog tertutup, tabel tetap kosong | High |
| BUG-011 | POS Input | Tambah barang transaksi kasir tidak bisa lanjut karena katalog/barang tidak tersedia | Barang bisa dipilih di POS | Search barang menampilkan `Tidak ada hasil`; `Bayar` disabled | High |

## Catatan BRD Mapping

| BRD Requirement | Coverage Pada Sesi Ini | Result |
| --- | --- | --- |
| FR-001 Multi-Tenant POS Enhancement | Akses modul POS/database, input master data, input transaksi kasir | Route dan form tampil, tetapi create master data gagal persist |
| FR-002 Tenant Management | Register apotek baru dan owner user | Pass |
| FR-003 Authentication | Register/login session dengan akun test baru | Pass |
| FR-005 Plan Management | Landing pricing CTA dan trial messaging | CTA tersedia, tetapi back navigation bermasalah |
| FR-006 Subscription Management | Trial banner setelah register | Pass |
| FR-008 Payment Management | Belum dites mendalam pada sesi ini | Not tested |
| FR-011 Entitlement Management | Akses menu tenant trial | Basic access pass, limit entitlement belum dites |

## Scope Yang Belum Dijalankan Pada Sesi Ini

- Laporan pendapatan, laba/rugi, resep, pareto.
- Payment gateway sampai sukses bayar.
- Webhook success/failed/duplicate.
- Dunning/retry payment.
- Usage-based billing.
- Admin internal monitoring.
- Audit log.
- Role/permission detail selain akses owner default.
- Reset password email flow.
