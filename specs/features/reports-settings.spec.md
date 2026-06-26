# Reports, Settings, and Notifications Specification

**Requirement**: Scope 8 (Laporan), Scope 9 (Pengaturan), Scope 10 (Notifikasi)

## Feature: Analytics, Configuration, and Alerts

**Scenario 1: Viewing the Laporan Laba/Rugi (Profit & Loss)**
*   **Given** an authenticated user with access to Reports
*   **When** they navigate to Laporan Laba/Rugi and set a specific date range
*   **Then** they see the Total Pendapatan (Revenue) accurately calculated
*   **And** the Total HPP (Cost of Goods Sold) accurately calculated
*   **And** the Margin categorized appropriately (<10%, 20-25%, >35%)

**Scenario 2: Editing User Privileges in Pengaturan**
*   **Given** a Pemilik (Owner) is logged into the system
*   **When** they navigate to Pengaturan > Akun
*   **And** they click Edit Akses for a specific Karyawan
*   **And** they grant them "Full Access Kasir" but deny "Read only Profil"
*   **Then** the Karyawan can successfully process sales
*   **And** the Karyawan is blocked from viewing the Profil page

**Scenario 3: Generating and managing Notifications**
*   **Given** a condition triggers a notification (e.g., Uncompetitive Price, Low Stock, Shift Discrepancy)
*   **When** the Pemilik logs in
*   **Then** they see a notification counter badge
*   **When** they click the notification
*   **Then** it is marked as "Sudah dibaca" (Read)
*   **And** they are redirected to the relevant page (e.g., Katalog, Defecta, Riwayat Sesi)

**Scenario 4: Corner Case - Report generation with exactly zero transactions**
*   **Given** a selected date range where absolutely no transactions occurred
*   **When** the user attempts to generate the Laporan Laba/Rugi or Laporan Pendapatan
*   **Then** the system successfully generates an empty report
*   **And** the UI displays clear messaging (e.g., "Tidak ada transaksi pada periode ini") rather than breaking or showing blank tables
*   **And** downloading to Excel results in an empty structured template
