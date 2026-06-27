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

**Scenario 4: Negative Case - Registration with missing mandatory fields**
*   **Given** a prospective pharmacy owner is on the sign-up page
*   **When** they submit the form without filling in the mandatory fields (Pharmacy Name, Username, Email, Password)
*   **Then** the form cannot be submitted
*   **And** validation errors are displayed for the missing fields

**Scenario 5: Edge Case - Registration with invalid email format**
*   **Given** a prospective pharmacy owner is on the sign-up page
*   **When** they enter an invalid email format (e.g., "invalid-email")
*   **And** they attempt to submit the form
*   **Then** the form cannot be submitted
*   **And** a validation error is displayed indicating the email format is invalid

**Scenario 6: Forget Password**
*   **Given** a registered user is on the login page
*   **When** they click on the "Lupa Password?" link
*   **And** they enter their registered email address and submit
*   **Then** they receive a password reset link in their email
*   **And** the system displays a confirmation message
