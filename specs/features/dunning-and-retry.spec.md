# Dunning and Retry Specification

**Requirement**: FR-012 (Dunning Management)

## Feature: Handling Failed Payments and Retry Logic

**Scenario 1: Payment failure transitions subscription to past_due**
*   **Given** a pharmacy has an `active` subscription
*   **When** their recurring payment or initial payment fails
*   **Then** the system detects the failed payment
*   **And** their subscription status changes to `past_due`
*   **And** a failed payment notification is sent to the tenant

**Scenario 2: Successful retry restores active status**
*   **Given** a pharmacy has a `past_due` subscription
*   **When** the system runs a scheduled retry payment
*   **And** the payment succeeds
*   **Then** the subscription status is restored to `active`
*   **And** full entitlements are restored

**Scenario 3: Exhausted retries transition subscription to suspended**
*   **Given** a pharmacy has a `past_due` subscription
*   **When** all scheduled retry attempts have failed
*   **Then** the subscription status changes to `suspended`
*   **And** the tenant's access to premium features is blocked
*   **And** a final suspension notice is sent to the tenant

**Scenario 4: Edge Case - Manual payment overlaps with scheduled retry**
*   **Given** a pharmacy has a `past_due` subscription with a retry scheduled
*   **When** the user manually initiates and completes a payment at the exact same time the automated retry fires
*   **Then** the system prevents double-charging the user
*   **And** safely ignores the automated retry if the manual payment succeeds first
