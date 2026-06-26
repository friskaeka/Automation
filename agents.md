# AI Agent Contribution Guide (Spec-Driven Development)

Welcome! If you are an AI agent (like Codex) tasked with contributing to this repository, please adhere to the following Spec-Driven Development (SDD) guidelines for End-to-End (E2E) testing.

## Project Structure

This project uses Playwright for E2E testing, heavily driven by business requirements.
*   **`specs/`**: Contains the source-of-truth requirement documents (e.g., `BRD PharmaSaaS.md`, `[PRD] PharmaApps.md`).
*   **`specs/features/`**: Contains the Markdown specifications (`.spec.md`) detailing the exact behavior to be tested.
*   **`tests/e2e/`**: Contains the Playwright test files (`.e2e.spec.js`) that execute the specifications.

## SDD Workflow for Agents

When tasked with automating a new feature or requirement, follow these steps strictly:

### 1. Requirements Analysis
Always read the relevant sections of the BRD or PRD first. Understand the core flow as well as the edge, corner, and negative cases.

### 2. Create the Markdown Specification
Create a new file in `specs/features/` named `{feature-name}.spec.md`.
Use the Given/When/Then (Gherkin-style) format to define scenarios. 
**Crucial Requirement:** You MUST include explicit scenarios for Negative Cases, Edge Cases, and Corner Cases.

**Example Format:**
```markdown
# Feature Name Specification

**Requirement**: Reference to BRD/PRD scope

## Feature: Description of feature

**Scenario 1: Happy Path**
*   **Given** a pre-condition
*   **When** an action is taken
*   **Then** the expected outcome occurs

**Scenario 2: Negative Case - [Description]**
*   ...
```

### 3. Create the Playwright Stub
Create a corresponding file in `tests/e2e/` named `{feature-name}.e2e.spec.js`.
You must use `test.step()` to explicitly map the Playwright code to the Markdown Given/When/Then statements.

**Example Format:**
```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('Scenario 1: Happy Path', async ({ page }) => {
    await test.step('Given a pre-condition', async () => {
      // Implementation
    });

    await test.step('When an action is taken', async () => {
      // Implementation
    });

    await test.step('Then the expected outcome occurs', async () => {
      // Assertions
    });
  });
});
```

### 4. Implementation
Fill in the `// TODO` blocks inside the `test.step()` functions using standard Playwright API calls (`page.locator()`, `expect()`, etc.). Ensure that assertions strictly validate the "Then" statements from the specification.
