# Subscription Lifecycle Specification

**Requirement**: FR-005 (Plan Management), FR-006 (Subscription Management), FR-011 (Entitlement Management)

## Feature: Plan Selection, Price Calculation, and Entitlement

**Scenario 1: Applying active coupon within limit to a plan**
*   **Given** a pharmacy owner is viewing the list of available subscription plans
*   **When** they select an active plan
*   **And** they apply a valid, active coupon within its limit
*   **Then** the backend calculates the correct base price, discount, tax, and final price
*   **And** the UI displays the calculated final price

**Scenario 2: Subscription activation grants entitlements**
*   **Given** a pharmacy has a `trialing` subscription status
*   **When** a successful payment webhook activates their subscription
*   **Then** their subscription status becomes `active`
*   **And** their feature entitlements are refreshed based on the chosen plan
*   **And** they can access premium features corresponding to their plan

**Scenario 3: Changing a plan updates entitlements**
*   **Given** a pharmacy with an `active` subscription
*   **When** they successfully upgrade to a higher tier plan
*   **Then** their subscription reflects the new plan
*   **And** their entitlements are immediately updated to include the new features

**Scenario 4: Edge Case - Downgrading blocked by current usage limits**
*   **Given** an active tenant is utilizing features (e.g., 5 user accounts) that exceed the limits of a lower-tier plan (which allows only 3 accounts)
*   **When** they attempt to downgrade their subscription to that lower tier
*   **Then** the system prevents the immediate downgrade
*   **And** prompts the user to reduce their usage (e.g., delete 2 accounts) before the downgrade can be processed
