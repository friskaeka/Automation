# Cashier and POS Operations Specification

**Requirement**: Scope 5 (Kasir)

## Feature: Selling Products and Handling Prescriptions

**Scenario 1: Shift management with starting and ending balances**
*   **Given** a cashier logs into the POS system to start a shift
*   **When** they open the Kasir menu
*   **Then** they are prompted to enter a Starting Balance (Saldo Awal)
*   **When** they attempt to log out at the end of their shift
*   **Then** they are prompted to enter an Ending Balance (Saldo Akhir) before logout succeeds
*   **And** a discrepancy notification is sent to the Owner if the starting balance does not match the previous ending balance

**Scenario 2: Processing a standard sales transaction**
*   **Given** an active cashier shift
*   **When** the cashier adds items to the cart, prioritizing the FEFO (First Expired First Out) batches
*   **And** they apply layered discounts or markups up to 5 layers
*   **And** they process a payment using Cash or Debit
*   **Then** the transaction is saved in the Riwayat Penjualan
*   **And** the inventory stock is correctly decremented

**Scenario 3: Processing a prescription (Resep Racikan)**
*   **Given** a patient presents a prescription from a doctor
*   **When** the cashier creates a new Resep linked to the doctor
*   **And** adds specific compounding ingredients
*   **And** adds the compounding fee (Uang R/)
*   **Then** the total correctly sums the ingredients plus the compounding fee
*   **And** the transaction is logged as a prescription sale for reporting

**Scenario 4: Negative Case - Layered discounts exceed 100%**
*   **Given** an active cashier shift with items in the cart
*   **When** the cashier applies multiple layered discounts that sum to more than the total price
*   **Then** the system caps the total discount at 100%
*   **And** the final total price is exactly 0
*   **And** the system prevents any negative subtotal or store credit issuance

**Scenario 5: Corner Case - Exact FEFO date match resolves to smallest quantity**
*   **Given** multiple batches of the same product have the exact same expiry date and supplier hidden flag
*   **When** the cashier attempts to add this product to the cart
*   **Then** the system prioritizes and selects the batch with the smallest remaining stock quantity to clear it out first

**Scenario 6: Negative Case - Dangling shift caused by browser closure**
*   **Given** a cashier starts a shift and inputs a Starting Balance
*   **When** the cashier closes the browser tab without logging out and inputting an Ending Balance
*   **Then** the shift remains "active" indefinitely in the backend
*   **When** the next user logs into the cashier module
*   **Then** they are seamlessly placed into the existing active shift without being prompted for a new Starting Balance
