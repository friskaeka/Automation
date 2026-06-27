# Project: Medistock E2E Tests

## Architecture
- Target environment: `https://medistock.web.id`
- Modular `tests/e2e/utils.js` will contain shared logic for dynamic user creation, login, and setup.
- 9 `*.e2e.spec.js` test files in `tests/e2e/`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Foundational Tests | `utils.js`, `tenant-onboarding.e2e.spec.js`, `pos-authentication.e2e.spec.js`, `cashier-operations.e2e.spec.js` | none | DONE |
| 2 | Backoffice & Inventory | `inventory-purchase.e2e.spec.js`, `database-management.e2e.spec.js`, `reports-settings.e2e.spec.js` | M1 | PLANNED |
| 3 | SaaS Operations | `subscription-lifecycle.e2e.spec.js`, `billing-and-payments.e2e.spec.js`, `dunning-and-retry.e2e.spec.js` | M1 | PLANNED |
| 4 | Final E2E Test Pass | Run all tests via `npx playwright test --workers=1` and ensure 100% pass | M1, M2, M3 | PLANNED |

## Interface Contracts
### `utils.js` ↔ Tests
- Should export functions like `createTenantUser(page)`, `login(page, credentials)`, `setupTestData(page)`, etc., based on requirements.

## Code Layout
- `tests/e2e/utils.js`: Shared utils
- `tests/e2e/*.e2e.spec.js`: Playwright test files
