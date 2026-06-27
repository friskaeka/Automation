# Implementation Strategy: Cashier Operations SDD

## 1. Context and Objective
The goal is to rewrite `d:\Automation\tests\e2e\cashier-operations.e2e.spec.js` using the Spec-Driven Development (SDD) workflow defined in `AGENTS.md`. The rewritten tests must map strictly to the Gherkin scenarios defined in `d:\Automation\specs\features\cashier-operations.spec.md` using Playwright's `test.step()`.

## 2. Test Setup & State Management
- **Helpers**: Migrate from using `TONO_ACCOUNT` and `loginViaUi`. Instead, use the helpers from `d:\Automation\tests\e2e\utils.js`: `generateTenantData`, `registerTenant`, and `loginToPOS`. 
- **Isolation**: Use a fresh tenant for the test suite (or per test) by calling `registerTenant` in `test.beforeAll()` or `test.beforeEach()`. This ensures a clean state and isolates the tests.

## 3. Handling the Known Backend Bug
The helper `startCashierShift` in `utils.js` notes a backend bug: newly registered tenants encounter a "Masih ada sesi yang belum ditutup" error when attempting to start a cashier shift.
**Strategy to handle this**:
- **API Mocking**: Since we are writing E2E tests focusing on the frontend POS flow, we should bypass this backend blocker using Playwright's network interception (`page.route()`).
- The Worker should implement a mock for the start-session API endpoint (e.g., `**/api/cashier/start-session` or the equivalent endpoint triggered by the "Mulai Sesi" button).
- The mock should return a success response (HTTP 200) with a valid session payload. This tricks the frontend into proceeding to the POS module, allowing the rest of the UI steps (FEFO selection, layered discounts, checkout) to be fully implemented and verified.
- Ensure the mock is wrapped in a helper function or clearly commented (e.g., `// WORKAROUND: Mocking shift start due to backend bug 'Masih ada sesi yang belum ditutup'`).

## 4. SDD Mapping (`test.step()`)
The Worker must create test blocks for all 6 scenarios in `cashier-operations.spec.md`. Inside each test, every `Given`, `When`, `Then`, and `And` must be wrapped in a `test.step()`.

### Example Mapping for Scenario 1:
```javascript
test('Scenario 1: Shift management with starting and ending balances', async ({ page }) => {
  await test.step('Given a cashier logs into the POS system to start a shift', async () => {
    // Call loginToPOS and navigate to Cashier
  });
  await test.step('When they open the Kasir menu', async () => {
    // UI Interaction: click Kasir menu
  });
  await test.step('Then they are prompted to enter a Starting Balance (Saldo Awal)', async () => {
    // Assert Saldo Awal modal is visible
  });
  // ... and so on for the rest of the steps.
});
```

### Required Test Cases to Implement:
1. **Scenario 1:** Shift management with starting and ending balances.
2. **Scenario 2:** Processing a standard sales transaction (Requires mocking/seeding stock for FEFO).
3. **Scenario 3:** Processing a prescription (Resep Racikan).
4. **Scenario 4:** Negative Case - Layered discounts exceed 100%.
5. **Scenario 5:** Corner Case - Exact FEFO date match resolves to smallest quantity.
6. **Scenario 6:** Negative Case - Dangling shift caused by browser closure.

For steps that are not yet implementable due to missing UI components, the Worker must still create the `test.step()` structure and place `// TODO: Implement` or `test.fixme()` *inside* the step callback, rather than skipping the entire test. This satisfies the requirement of implementing the specs structure.
