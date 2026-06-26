# PharmaSaaS BRD Test Plan

## Application Overview

Medistock is a pharmacy POS SaaS with tenant onboarding, authentication, trial subscription, billing, role access, inventory/POS operations, reporting, and internal monitoring touchpoints. This plan traces automated and manual test cases to the Phase 1 functional requirements in `BRD PharmaSaaS.md`.

## Automation Scope

- Runnable Playwright JavaScript specs live in `tests/e2e`.
- Stable smoke tests verify public entry points, onboarding, login/logout, trial state, and protected route availability.
- Requirement defects that are still reproducible are encoded as `test.fail(...)` regression tests. They pass the suite while the defect exists, and will fail as "unexpected pass" when the product is fixed so the annotation can be removed.
- Defects observed once but not reproduced in the latest run are kept as normal regression guards.
- Destructive or payment-gateway-final flows are documented as manual/API-assisted cases unless a safe test gateway or admin test account is provided.

## Requirement Traceability Matrix

| Req | Module | Test Coverage |
| --- | --- | --- |
| FR-001 | Multi-Tenant POS Enhancement | Automated route smoke for tenant POS routes. Expected-failing isolation regression for leaked account users. Manual cross-tenant API/data isolation checks. |
| FR-002 | Tenant Management | Automated sign-up verifies apotek creation, owner user creation, dashboard access, and trial state. |
| FR-003 | Authentication | Automated registration, two-step login, logout, and public auth links. Manual forgot/reset password email flow. |
| FR-004 | User and Role Management | Expected-failing tenant account isolation check. Manual create/edit role and permission cases. |
| FR-005 | Plan Management | Automated landing pricing/trial visibility. Manual plan detail, inactive plan, billing interval, coupon, tax/final-price cases. |
| FR-006 | Subscription Management | Automated trialing state in UI/localStorage and billing route access. Manual change/cancel/reactivate/preview/status transitions. |
| FR-007 | Invoice Management | Expected-failing invoice generation regression for `/api/billing/invoices` 500. Manual invoice list/detail/void/update cases. |
| FR-008 | Payment Management | Expected-failing invoice/payment creation regression. Manual payment status history and gateway status update cases. |
| FR-009 | Payment Gateway Integration | Expected-failing invoice checkout prerequisite. Manual checkout URL, gateway reference, and pending-until-webhook checks. |
| FR-010 | Webhook Handling | Manual/API webhook signature, duplicate event, raw payload, and status update tests. |
| FR-011 | Entitlement Management | Manual role/plan limit checks, blocked feature checks, and entitlement refresh after active/plan change. |
| FR-012 | Dunning Management | Manual/API failed payment, past_due, retry, reminder, and suspended access tests. |
| FR-013 | Usage-Based Billing | Manual/API usage creation, duplicate reference prevention, aggregation, and metered invoice tests. |
| FR-014 | Admin Internal Monitoring | Automated protected report/settings route reachability. Manual admin tenant/subscription/invoice/payment/dunning monitor cases. |
| FR-015 | Audit Log | Manual/API audit event creation and immutability checks for registration, login, checkout, payment, webhook, entitlement blocks. |

## Test Scenarios

### 1. Public, Plan, And Authentication

**Seed:** `tests/seed.spec.js`

#### 1.1. public-landing-shows-saas-entry-points

**File:** `tests/e2e/medistock-smoke.spec.js`

**Steps:**
1. Open `/`.
   - expect: landing headline is visible.
   - expect: `Masuk` points to `/sign-in`.
   - expect: `Daftar Gratis` points to `/sign-up`.
2. Inspect pricing/trial section.
   - expect: `Harga Transparan` is visible.
   - expect: 14-day trial messaging is visible.

#### 1.2. register-new-apotek-owner

**File:** `tests/e2e/medistock-smoke.spec.js`

**Steps:**
1. Open `/sign-up`.
   - expect: `Daftarkan Apotek Anda` form is visible.
2. Fill unique pharmacy name, SIA, username, email, and password.
3. Submit registration.
   - expect: `POST /api/auth/register-apotek` returns success.
   - expect: user lands on `/dashboard`.
   - expect: trial banner says `Masa percobaan aktif`.
   - expect: auth state contains the unique username, active apotek id, and `trialing` subscription status.

#### 1.3. logout-and-login-two-step

**File:** `tests/e2e/medistock-smoke.spec.js`

**Steps:**
1. Register a new tenant.
2. Click the sidebar user/logout control.
   - expect: `Konfirmasi Logout` dialog is shown.
3. Confirm logout.
   - expect: user returns to `/sign-in`.
4. Fill owner pharmacy email and continue.
   - expect: apotek lookup succeeds.
   - expect: user is on `/sign-in/user`.
5. Fill username and password, then submit.
   - expect: login succeeds.
   - expect: user lands on `/dashboard` with trial banner visible.

### 2. Tenant App Shell And POS Routes

**Seed:** `tests/seed.spec.js`

#### 2.1. authenticated-tenant-can-reach-core-routes

**File:** `tests/e2e/medistock-smoke.spec.js`

**Steps:**
1. Register a new tenant.
2. Open core protected routes: dashboard, database unit/catalog/supplier/payment-method/doctor/patient, purchase invoice, cashier POS, stock, revenue report, account settings, and billing settings.
   - expect: each route keeps its expected URL.
   - expect: navigation shell is visible.
   - expect: trial banner is visible.
   - expect: main region is visible.

### 3. Known Requirement Regressions

**Seed:** `tests/seed.spec.js`

#### 3.1. pricing-cta-back-navigation-returns-landing-root

**File:** `tests/e2e/brd-regressions.spec.js`

**Steps:**
1. Open `/`.
2. Click navbar `Harga`.
   - expect: pricing section is reached.
3. Click pricing CTA `Mulai Gratis 14 Hari`.
   - expect: `/sign-up` is shown.
4. Press browser back once.
   - expect: user returns directly to landing page root `/`.
   - current observation: fails because browser returns to `/#pricing`.

#### 3.2. tenant-account-table-is-isolated

**File:** `tests/e2e/brd-regressions.spec.js`

**Steps:**
1. Register a brand-new tenant.
2. Open `/settings/account`.
   - expect: the unique tenant user is visible.
   - expect: unrelated usernames such as `annas`, `friska`, `beni`, `Admin`, or `Saya` are not visible.
   - note: unrelated users were observed during exploratory testing, but the latest automated run passed. This now acts as a normal regression guard.

#### 3.3. billing-invoice-creation-succeeds

**File:** `tests/e2e/brd-regressions.spec.js`

**Steps:**
1. Register a brand-new tenant.
2. Open `/settings/billing`.
3. Click `Buat Invoice Pembayaran`.
   - expect: `POST /api/billing/invoices` returns success.
   - expect: invoice/payment information is shown or checkout begins.
   - note: HTTP 500 was observed during exploratory testing, but the latest automated run passed. This now acts as a normal regression guard.

#### 3.4. unit-master-data-create-persists

**File:** `tests/e2e/brd-regressions.spec.js`

**Steps:**
1. Register a brand-new tenant.
2. Open `/database/unit`.
3. Click `Tambah Satuan`.
4. Fill `Nama Satuan` and `Singkatan Satuan`.
5. Click `Simpan`.
   - expect: new row appears in the table.
   - current observation: fails because the dialog closes without a create request or persisted row.

### 4. Manual/API-Assisted Functional Cases

#### 4.1. plan-selection-and-price-calculation

**Req:** FR-005

**Steps:**
1. Open plan list and detail.
   - expect: active plans are selectable and inactive plans are blocked.
2. Toggle monthly/yearly billing.
   - expect: backend-calculated price changes correctly.
3. Apply active coupon within limit.
   - expect: base price, discount, tax, and final price are calculated by backend.
4. Apply inactive/expired/over-limit coupon.
   - expect: coupon is rejected with clear validation.

#### 4.2. subscription-lifecycle

**Req:** FR-006, FR-011, FR-012

**Steps:**
1. Start from `trialing` tenant.
2. Activate subscription through successful payment webhook.
   - expect: subscription becomes `active` and entitlement refreshes.
3. Simulate failed payment.
   - expect: subscription becomes `past_due` and reminder/retry is scheduled.
4. Exhaust retry schedule.
   - expect: subscription becomes `suspended` and restricted features are blocked.
5. Cancel/reactivate/change plan.
   - expect: status and entitlement reflect the lifecycle change.

#### 4.3. invoice-payment-webhook

**Req:** FR-007, FR-008, FR-009, FR-010, FR-015

**Steps:**
1. Generate invoice from checkout.
   - expect: invoice moves from draft/open state as designed.
   - expect: payment is created as `pending`.
   - expect: gateway reference and checkout URL are stored.
2. Send valid payment success webhook.
   - expect: raw payload is stored.
   - expect: payment becomes `succeeded`, invoice becomes `paid`, subscription becomes `active`.
   - expect: audit log records webhook processed and payment success.
3. Replay the same webhook event.
   - expect: duplicate event is ignored and no double processing occurs.
4. Send invalid signature.
   - expect: webhook is rejected and failure is audited.

#### 4.4. usage-based-billing

**Req:** FR-013

**Steps:**
1. Create usage record with unique reference.
   - expect: usage is stored once.
2. Submit duplicate reference.
   - expect: duplicate is rejected or ignored.
3. Aggregate usage at period end.
   - expect: aggregate amount matches usage inputs.
4. Generate metered invoice.
   - expect: usage charges appear on invoice.

#### 4.5. admin-internal-monitoring

**Req:** FR-014

**Steps:**
1. Login as platform admin test user.
   - expect: tenant monitoring page is visible.
2. Filter tenants by `past_due` and `suspended`.
   - expect: matching tenants and billing statuses are shown.
3. Open tenant detail.
   - expect: subscription, invoice, payment, dunning, and lifecycle information are visible.

#### 4.6. audit-log-immutability

**Req:** FR-015

**Steps:**
1. Perform register, login, checkout, payment success/failure, plan change, and entitlement-blocked actions.
   - expect: each action creates an audit log entry with actor, tenant, event type, timestamp, and metadata.
2. Attempt to update/delete audit log through UI/API as non-admin.
   - expect: mutation is denied.
3. Attempt direct tampering as admin if an admin endpoint exists.
   - expect: audit immutability is enforced or changes are separately audited.

## Observed Defects

| ID | Requirement | Evidence | Impact |
| --- | --- | --- | --- |
| BUG-001 | FR-001, FR-003, FR-004 | New QA tenant on `/settings/account` once showed unrelated users: `annas`, `friska`, `beni`, `Admin`, `Saya`; latest automated run passed. | Keep regression guard active for tenant data isolation. |
| BUG-002 | FR-007, FR-008, FR-009 | Clicking `Buat Invoice Pembayaran` once caused `POST /api/billing/invoices` to return HTTP 500; latest automated run passed. | Keep regression guard active for invoice creation stability. |
| BUG-003 | FR-001 | `Tambah Satuan` dialog closed without a create request or persisted table row; still represented by expected-failing test. | Master-data CRUD path is incomplete or broken. |
| BUG-004 | Quality | `/avatars/01.png` returned HTTP 404 on dashboard/account flows. | Broken static asset and console noise. |
| BUG-005 | FR-003, FR-005 | Landing page flow `Harga` navbar -> `Mulai Gratis 14 Hari` -> browser back returns to `/#pricing`, not `/`. | User does not return directly to the landing page root/top after leaving registration. |
