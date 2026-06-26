# Database & Master Data Management Specification

**Requirement**: Scope 4 (Database)

## Feature: Managing Master Data (Katalog, Supplier, Dokter, Pasien)

**Scenario 1: Creating a new Product (Katalog)**
*   **Given** an authenticated user with access to Database > Katalog
*   **When** they click "Tambah barang"
*   **And** they fill in the Name, Satuan Terkecil, Satuan Utama, and mapping
*   **And** they save the product
*   **Then** the product is successfully added to the catalog
*   **And** the base price (Harga Beli) defaults to correct historical average calculation

**Scenario 2: Automatic Selling Price (Harga Jual) calculation and overrides**
*   **Given** a product in the catalog with a base price and default markup
*   **When** the user attempts to override the selling price manually
*   **And** the new price is lower than (Harga Beli + Markup)
*   **Then** the system reverts the price to the standard calculated price
*   **When** the user sets a new price higher than the maximum allowed markup
*   **Then** the price is saved but a "Harga Tidak Kompetitif" notification is triggered to the Owner

**Scenario 3: Managing Suppliers with Tax configurations**
*   **Given** an authenticated user in Database > Supplier
*   **When** they add a new supplier and check the "Hidden" (Centang blanko) flag
*   **Then** the supplier is saved and marked as not charging tax for future purchase invoices

**Scenario 4: Negative Case - Duplicate entry creation (Case Insensitive)**
*   **Given** the database already contains a product named "Paracetamol"
*   **When** a user attempts to create a new product named "PARACETAMOL" or "paracetamol"
*   **Then** the system rejects the creation
*   **And** displays an error that the product name must be unique
