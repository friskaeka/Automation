# Inventory and Purchase Management Specification

**Requirement**: Scope 6 (Pembelian), Scope 7 (Barang)

## Feature: Purchase Invoices and Stock Tracking

**Scenario 1: Recording a Purchase Invoice (Faktur Pembelian)**
*   **Given** an authenticated user with access to Pembelian
*   **When** they create a new Faktur Pembelian for a specific supplier
*   **And** they add items with specific Batch Numbers and Expiry Dates
*   **And** they specify if the price is tax-inclusive or exclusive
*   **Then** the calculated DPP, PPn, and Subtotal are mathematically accurate
*   **And** upon saving, the items are added to the inventory (Stok)

**Scenario 2: Defecta (Low Stock Alert) management**
*   **Given** a product falls below its designated Minimum Stock level
*   **When** the user checks the Defecta report
*   **Then** the product appears with a "Belum Dibeli" status
*   **When** a Faktur Pembelian is created for this product but not yet received
*   **Then** the status changes to "Menunggu Pengiriman"
*   **When** the items are fully received and stock exceeds minimum
*   **Then** the product disappears from the Defecta list

**Scenario 3: Stock Opname Correction**
*   **Given** a discrepancy in physical stock versus system stock
*   **When** the user performs a Stock Opname correction
*   **Then** the correction is tracked but not applied globally yet
*   **When** they click "Simpan Correction"
*   **Then** the stock is globally updated across the system
*   **And** the movement is logged in the product's History (Riwayat Stok)

**Scenario 4: Corner Case - Received invoice does not meet minimum stock threshold**
*   **Given** a product is in the Defecta list with status "Menunggu Pengiriman"
*   **When** the corresponding Purchase Invoice is fully received (Tanggal Terima is filled)
*   **And** the total received quantity is STILL below the Minimum Stock threshold
*   **Then** the system reverts the Defecta status back to "Belum Dibeli"
*   **And** the product remains on the Defecta list to prompt further purchasing
