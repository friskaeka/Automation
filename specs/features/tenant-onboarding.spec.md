# Tenant Onboarding Specification

**Requirement**: FR-002 (Tenant Management), FR-003 (Authentication)

## Feature: Pharmacy Registration and Initial Trial

**Scenario 1: A new pharmacy registers successfully**
*   **Given** a prospective pharmacy owner navigates to the public landing page
*   **When** they click "Daftar Gratis" to go to the sign-up page
*   **And** they fill out the registration form with valid, unique details (Pharmacy Name, SIA, Username, Email, Password)
*   **And** they submit the form
*   **Then** a new tenant record and owner user are created in the system
*   **And** they are redirected to the `/dashboard`
*   **And** they see a banner indicating "Masa percobaan aktif" (Trial active)
*   **And** their subscription status is `trialing`

**Scenario 2: Secure Two-Step Login**
*   **Given** a registered pharmacy owner has just logged out and is on the `/sign-in` page
*   **When** they enter their pharmacy email and proceed
*   **And** they enter their correct username and password
*   **Then** they successfully log into the system
*   **And** they are redirected back to the `/dashboard`

**Scenario 3: Negative Case - Registration with duplicate global data**
*   **Given** a pharmacy name or SIA (Surat Izin Apotek) is already registered in the multi-tenant system
*   **When** a new user attempts to register a new tenant using the exact same name or SIA
*   **Then** the system rejects the registration
*   **And** displays a specific validation error indicating the pharmacy is already registered
