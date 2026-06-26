# POS Authentication and Account Management Specification

**Requirement**: Scope 2 (Manajemen Akun)

## Feature: Multi-layer Login and Role Access

**Scenario 1: Two-layer login process**
*   **Given** a user navigates to the POS dashboard
*   **When** they perform the first layer login with the Apotek email
*   **And** they perform the second layer login with their User credentials (Username/Password)
*   **Then** they are successfully authenticated into the POS system

**Scenario 2: Role-based access for 'Pemilik' (Owner)**
*   **Given** an authenticated user with the 'Pemilik' role
*   **When** they navigate the dashboard
*   **Then** they can access all 7 menus (Profil, Database, Kasir, Pembelian, Barang, Laporan, Pengaturan, Notifikasi)
*   **And** they can edit the Apotek profile

**Scenario 3: Role-based access for 'Karyawan' (Employee)**
*   **Given** an authenticated user with the 'Karyawan' role
*   **When** they navigate the dashboard
*   **Then** they have default access to the 'Kasir' menu
*   **And** they cannot access restricted menus (e.g., Pengaturan) unless explicitly granted by the Pemilik

**Scenario 4: Two-layer logout process**
*   **Given** an authenticated user in the POS system
*   **When** they perform a user logout
*   **Then** they are logged out of the user session but the Apotek session remains
*   **When** they perform an Apotek logout
*   **Then** they are fully logged out of the application

**Scenario 5: Negative Case - Invalid credentials**
*   **Given** a user is on the login page
*   **When** they attempt to login with an unregistered Apotek email or incorrect password
*   **Then** the system rejects the login attempt
*   **And** displays an appropriate error message without exposing sensitive system information

**Scenario 6: Edge Case - Direct URL access to restricted routes**
*   **Given** a Karyawan is logged in (who does not have access to Pengaturan)
*   **When** they attempt to directly navigate to the `/pengaturan` URL
*   **Then** the system intercepts the request
*   **And** redirects them back to their default allowed view (e.g., Dashboard or Kasir) with an "Access Denied" message
