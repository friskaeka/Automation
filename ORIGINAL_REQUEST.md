# Original User Request

## Initial Request — 2026-06-26T18:23:38Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Implement all 9 Playwright E2E test stubs in the `tests/e2e/` directory by interacting with the live environment at `medistock.web.id` using Chrome DevTools. The agent should dynamically create test users and build modular utility functions for clean, reusable test code.

Working directory: d:\Automation
Integrity mode: demo

## Requirements

### R1. Implement Playwright E2E Stubs
Fill in the `// TODO` blocks inside all 9 Playwright `.e2e.spec.js` files located in the `tests/e2e/` directory.

### R2. Use Live Environment
Interact with and inspect the live website at `https://medistock.web.id` to determine the correct CSS/XPath selectors and API behaviors needed for the tests. 

### R3. Dynamic User Creation & Modular Utilities
Do not reuse existing test users; dynamically create new test users as needed within the tests. Create modular utility/helper files (e.g., `utils.js`) to house reusable code like the dynamic user creation and authentication flows.

### R4. Infrastructure Constraint (Rate Limiting)
Because you are testing against a live staging environment, you must limit Playwright execution to a single worker (e.g., `npx playwright test --workers=1`) to avoid overwhelming the server or triggering rate limits.

## Acceptance Criteria

### Implementation Completeness
- [ ] All 9 `.e2e.spec.js` files have their `// TODO` blocks replaced with functional Playwright code.
- [ ] A modular utility file exists and is actively imported and used by multiple test files to share logic (e.g., login, user creation).
- [ ] Test users are dynamically created during the test runs, not hardcoded.

### Programmatic Verification
- [ ] Running `npx playwright test --workers=1` passes successfully for all implemented test files.
