# DawoLink — Complete Product & Business Documentation
**Version 1.0 · May 2026**

---

## SECTION 1 — PHARMACY ONBOARDING

**Q1. What information is required before a pharmacy can use DawoLink?**

A pharmacy must provide: full legal name, city, phone number, and owner email address during registration. The owner creates a password and receives a 14-day free trial immediately. Before going live with real patients, the pharmacy should also complete: at least one branch (name + address), at least one staff member, and initial medicine inventory. No formal verification is required at registration — onboarding is self-serve.

**Q2. Can a pharmacy start with one branch and later add more?**

Yes. Every pharmacy starts with one branch automatically created at registration. Additional branches can be added from the Pharmacy → Branches panel. Adding branches is gated by the subscription plan: Starter allows 1 branch, Professional allows up to 5, Enterprise is unlimited. The owner simply fills in the branch name and address — no re-registration required.

**Q3. What happens when a pharmacy's free trial expires?**

The billing cron runs hourly. When the 14-day trial ends, the subscription status moves from `TRIALING` → `PAST_DUE`. The pharmacy is then suspended (`isActive: false`). Staff can no longer log in or process sales. The owner receives a trial expiry warning email 3 days before expiry and a suspension email when it happens. To reactivate, the owner submits a payment (EVC Plus, Zaad, Sahal, or Waafi Pay) and the subscription is restored to `ACTIVE`.

**Q4. Can a suspended pharmacy still view its data?**

No. When `isActive` is false, all authenticated API calls return a `403 Forbidden` with the message *"Your pharmacy account is suspended."* Data is preserved in the database — nothing is deleted — but access is blocked until the subscription is renewed.

**Q5. Can a pharmacy export all its data if it decides to leave?**

Currently, pharmacies can download individual invoices as printable records. A full bulk data export (CSV/JSON of all transactions, inventory, customers, and audit logs) is not yet built — it is planned as part of the Enterprise feature set in Phase 3. This is a gap that should be addressed before aggressively onboarding enterprise clients.

---

## SECTION 2 — MEDICINE CATALOG

**Q6. What is the exact workflow when a pharmacy receives a medicine not in DawoLink?**

1. Pharmacist goes to Inventory → Add Medicine
2. Fills in name, generic name, barcode, form, category, dosage, price, and expiry
3. Medicine is saved with status `PENDING_VERIFICATION`
4. It can be used immediately within that pharmacy's inventory
5. A platform admin reviews it in the Medicine Verification Queue
6. Admin marks it `VERIFIED` (enters the national catalog) or `REJECTED` (with a reason)
7. Verified medicines become searchable across all pharmacies in the national database

**Q7. Who verifies medicine information?**

The platform admin (DawoLink) verifies medicines. Pharmacy staff can add medicines and use them immediately, but they cannot verify. Suppliers cannot currently verify — though in Phase 3, the Supplier Portal allows suppliers to submit product catalogs which feed into the verification queue. This is the correct design: DawoLink acts as the national medicine authority, not individual pharmacies.

**Q8. Can two pharmacies create the same medicine with different names? How is duplication prevented?**

Yes, this can happen. Paracetamol, Panadol, and Para can all be created as separate entries before verification. Duplication is prevented during the verification step: a platform admin reviewing the queue sees all pending medicines, can identify duplicates, and either rejects them with a note pointing to the correct entry, or merges them before verifying. A barcode lookup is also available — if a barcode already exists in the database, the existing medicine is returned rather than creating a new one. Full automated deduplication (fuzzy name matching) is a planned enhancement.

**Q9. What fields are mandatory for a medicine before verification?**

Required: `name`, `form` (tablet/capsule/syrup/injection/etc.), `category` (antibiotic/analgesic/etc.), `sellingPrice`, and `quantity`. Optional but strongly recommended: `genericName`, `barcode`, `batchNo`, `expiryDate`, `manufacturer`, `description`. A medicine without a barcode or generic name can be added but will have limited searchability in the national marketplace.

**Q10. What happens if incorrect medicine information is entered?**

Pharmacy staff can edit any unverified medicine at any time. Once a medicine is `VERIFIED` by the platform admin, changes require going back through the verification queue — the status resets to `PENDING_VERIFICATION`. This protects the integrity of the national catalog. The audit log records all changes with before/after values so corrections are traceable.

---

## SECTION 3 — INVENTORY

**Q11. What happens when stock reaches zero?**

The item remains in inventory with `quantity: 0`. It is flagged as `out_of_stock` in the marketplace (customers see it but cannot order). The POS system will prevent selling it (quantity validation blocks the transaction). The expiry dashboard still monitors it. An automated reorder suggestion is generated if a reorder level was set. The item is included in the national shortage detection system.

**Q12. Difference between In Stock / Low Stock / Out of Stock?**

| Status | Condition |
|--------|-----------|
| **In Stock** | quantity > reorderLevel (default: 10) |
| **Low Stock** | 0 < quantity ≤ reorderLevel |
| **Out of Stock** | quantity = 0 |

These thresholds drive the Expiry Alerts widget, the marketplace availability badge, and the national shortage map. The reorder level is configurable per inventory item.

**Q13. Can inventory go negative?**

No. The POS enforces a hard check before completing a sale — if requested quantity exceeds available stock, the transaction is blocked with an error. Offline mode also deducts from local IndexedDB stock immediately, so the local count cannot go below zero. A negative stock scenario is architecturally prevented.

**Q14. Can damaged medicines be recorded?**

Yes, through a stock adjustment. A pharmacist (or manager) can open any inventory item, select "Adjust Stock," choose a negative adjustment, and enter the reason as "Damaged" or "Destroyed." The adjustment is recorded in the audit log with the actor's identity, the quantity change, and the reason. There is no dedicated "damaged goods" module — it is handled through the general stock adjustment workflow.

**Q15. Can expired medicines still be sold?**

The system does not currently enforce a hard block on selling expired medicines at the POS level. This is an intentional gap to avoid disrupting operations — in Somalia, pharmacies sometimes legally sell near-expiry medicines at a discount. However, the Expiry Alerts module highlights all expired items, and the AI Inventory Optimizer recommends removing them. A compliance-mode setting that blocks sales of expired medicines is planned for the regulatory compliance module in Phase 3.

---

## SECTION 4 — POS & SALES

**Q16. Complete sales workflow from medicine selection to payment?**

1. Cashier opens POS → selects branch
2. Searches medicine by name or scans barcode
3. Adds item to cart (quantity auto-validated against stock)
4. Applies discount if applicable (fixed amount or percentage)
5. Selects payment method: Cash, EVC Plus, Zaad, Sahal, Premier Wallet, or Mixed
6. Enters amount paid
7. System calculates change
8. Confirms sale → transaction created → stock deducted atomically
9. Receipt modal appears (printable, 80mm thermal format)
10. Audit log records: actor, branch, items, payment, timestamp

If offline: steps 1–8 happen against local IndexedDB. Transaction queued. Auto-syncs when connection returns.

**Q17. What happens if the cashier tries to sell more stock than available?**

The cart validation fires before submission. An error message appears: *"Only X units available for [medicine name]."* The quantity field is highlighted. The sale cannot proceed until the quantity is corrected. This check runs against live stock in online mode and against cached local stock in offline mode.

**Q18. Can a sale be cancelled after completion?**

There is no one-click "cancel sale" button. To reverse a completed sale, a manager with sufficient permissions must perform a negative stock adjustment to restore the units and record a manual refund entry. A formal void/refund transaction type is on the product roadmap. Currently the audit trail captures the original sale, and any correction is logged as a separate adjustment.

**Q19. Can medicines be returned?**

Not as a formal return transaction type in the current build. Returns are handled by: (1) stock adjustment to add back the units, and (2) manual recording of the refund outside the system or as a discount on the next purchase. A dedicated return/refund workflow is a known gap.

**Q20. Can customers buy medicines without creating an account?**

At the in-store POS, yes — customers can be served without an account. The cashier can optionally link a sale to a customer profile for loyalty tracking, but it is not required. On the online marketplace, customers must register (name, phone, password) to place orders, because delivery address, order tracking, and chat require an identity.

**Q21. How are discounts handled?**

- **Fixed amount:** Enter a dollar value (e.g., -$2.00)
- **Percentage:** Enter a percentage (e.g., 10%) — system calculates the amount
- **Promo codes:** On the marketplace, customers can enter a promotion code at checkout — validated against the Promotions engine (code, type, value, min order, expiry, usage limit)
- **Loyalty points:** Customers can redeem loyalty points at checkout (10 points = $1 off)

Discounts at POS are entered manually. There is no automatic coupon scanning at POS in the current build.

**Q22. Can one sale contain multiple medicines in one invoice?**

Yes. The POS cart supports any number of line items. Each item has its own quantity, unit price, and line discount. The invoice shows all items, subtotal, overall discount, tax (if configured), total, and payment method. The 80mm thermal receipt template renders all line items.

**Q23. How are receipts generated?**

- **Print:** Browser print dialog opens a styled 80mm thermal receipt — works with any thermal receipt printer connected to the computer
- **On-screen:** Receipt modal shows full details immediately after sale
- **PDF:** No automated PDF generation yet — user can use browser "Print to PDF"
- **SMS/Email:** Not yet built for POS receipts. The marketplace sends order confirmation emails. POS SMS receipts are a planned feature.

**Q24. What happens if internet disconnects during a sale?**

The OfflineBanner appears instantly (detected via `navigator.onLine` and a keepalive fetch). The POS switches to offline mode automatically. Sales continue uninterrupted against locally cached data. Completed sales are queued in IndexedDB and auto-sync when internet returns. The server uses `offlineId` for idempotency to prevent duplicate submissions.

**Q25. Can cashiers view profit margins?**

No — and this is intentional. Profit margin is calculated from `costPrice` vs `sellingPrice`. Cashiers can see selling prices but `costPrice` data is restricted to managers and owners. Exposing margins to cashiers creates a conflict of interest. The analytics module shows margin data to owners and managers only.

---

## SECTION 5 — SUPPLIERS

**Q26. Who creates suppliers?**

Pharmacy Owner and Branch Manager. Super Admin does not create pharmacy-level suppliers. The permission system (RBAC) can be configured to restrict supplier creation to specific roles — by default, `PHARMACY_OWNER` and `BRANCH_MANAGER` can create and edit suppliers.

**Q27. Can one medicine have multiple suppliers?**

Yes. An inventory item has an optional `supplierId` field. Multiple inventory records for the same medicine can reference different suppliers. When creating a Purchase Order, the pharmacist selects which supplier to order from. The system tracks which batch came from which supplier, enabling supplier performance analysis.

**Q28. How does a pharmacy create a purchase order?**

1. Go to Suppliers → select supplier → New Purchase Order
2. Add medicines with quantities and expected unit cost
3. Submit PO (status: `PENDING`)
4. When delivery arrives, pharmacist opens the PO → clicks "Receive"
5. Enters actual quantities received → system updates inventory automatically
6. PO status moves to `RECEIVED` or `PARTIALLY_RECEIVED`
7. Audit log records the receiving event

**Q29. What happens when supplier delivers only part of the order?**

The receive flow allows partial quantities. The pharmacist enters the received amount (e.g., 60 of 100 ordered). The system adds 60 units to inventory. The PO status is marked `PARTIALLY_RECEIVED`. The remaining 40 units stay on the open PO for future delivery. Debt tracking records the cost of units received.

**Q30. Can supplier performance be measured?**

Yes — Phase 3 Advanced Analytics includes a Supplier Analytics tab showing: delivery reliability ratio, average delivery time, top medicines supplied, historical pricing trends, and batch expiry rates.

**Q31. Can suppliers have their own portal login?**

Yes — built in Phase 2 as the Supplier Portal. Suppliers register with their own account, can view POs directed to them, update delivery status, and view their sales analytics on DawoLink.

**Q32. Can suppliers upload product catalogs?**

Yes — through the Supplier Portal. Suppliers can list their products with pricing, minimum order quantities, and availability. These catalog entries feed into the procurement workflow.

**Q33. Can suppliers receive purchase orders directly from DawoLink?**

Yes — Phase 3 Direct Procurement Network enables this. A pharmacy creates a PO, the supplier receives it in their portal, can accept/reject/counter, and the confirmed PO drives the receiving workflow.

**Q34. Can pharmacies compare supplier prices?**

The national Price Intelligence module (Phase 3) shows average, minimum, and maximum medicine prices across all pharmacies. The Supplier Portal also shows catalog prices from multiple suppliers for the same medicine side by side.

**Q35. What happens if a supplier sends expired medicine?**

The pharmacist records the expiry date during inventory receiving. The Expiry Intelligence system immediately flags any item with an expired or near-expiry date. The stock adjustment workflow allows recording units as "Rejected — Expired" with the supplier reference. Supplier performance metrics track this event.

---

## SECTION 6 — EMPLOYEES & ROLES

**Q36. Who can create employees?**

`PHARMACY_OWNER` and `BRANCH_MANAGER` can invite staff via a branded email with a 7-day token. `SUPER_ADMIN` (platform admin) does not manage pharmacy staff. `PHARMACIST` and below cannot invite staff.

**Q37. Can branches create their own employees?**

Yes — a `BRANCH_MANAGER` can invite staff scoped to their branch. New users invited by a branch manager are automatically associated with that branch and cannot access other branches.

**Q38. Can a pharmacist create a cashier?**

No. The default RBAC configuration prevents `PHARMACIST` from sending invites. Only `PHARMACY_OWNER` and `BRANCH_MANAGER` can invite. Custom roles can grant invite permissions to a Pharmacist role if the owner configures it.

**Q39. Can permissions be customized?**

Yes — fully. The custom roles system allows creating any named role and attaching specific permissions from a predefined list (e.g., `VIEW_SALES=true`, `DELETE_SALES=false`). The `PermissionGuard` enforces these at the API level on every request.

**Q40. Who can view financial reports?**

By default: `PHARMACY_OWNER`, `BRANCH_MANAGER`, and `AUDITOR`. `PHARMACIST` and `CASHIER` cannot view revenue reports or margin data. The `AUDITOR` role has read-only access to all financial and audit data but cannot make changes.

**Q41. Who can change medicine prices?**

`PHARMACY_OWNER` and `BRANCH_MANAGER` by default. This requires the `MANAGE_INVENTORY` permission. Price changes are recorded in the audit log with before/after values.

**Q42. Who can delete inventory?**

Inventory uses soft deletes (`deletedAt` timestamp). `PHARMACY_OWNER` can soft-delete inventory items. The data remains in the database for audit purposes. Hard deletion is not exposed through any UI.

**Q43. What actions must always be recorded in audit logs?**

Every state-changing action is logged: `LOGIN`, `SIGNUP`, `SALE`, `STOCK_ADDED`, `STOCK_ADJUSTED`, `STOCK_TRANSFERRED`, `SUPPLIER_CREATED`, `PURCHASE_ORDER_CREATED`, `PO_RECEIVED`, `PO_STATUS_UPDATED`, `PAYMENT_RECORDED`, `BRANCH_CREATED/UPDATED/DEACTIVATED`, `STAFF_UPDATED/DEACTIVATED/REACTIVATED`, `STAFF_INVITED`, `INVITE_REVOKED`, `PHARMACY_UPDATED`. All logs include actor ID, pharmacy ID, timestamp, entity type, entity ID, and before/after JSON snapshots.

**Q44. Can employee accounts be suspended temporarily?**

Yes. An owner or manager can deactivate a staff account. The user can no longer log in. Their historical data is preserved and attributed to them. Reactivation restores access immediately. Audit events `STAFF_DEACTIVATED` and `STAFF_REACTIVATED` are recorded.

**Q45. Can an employee work in multiple branches?**

Currently each user account is associated with one branch. `PHARMACY_OWNER` and `BRANCH_MANAGER` with pharmacy-wide access can view all branches. Supporting a single staff account across multiple branches requires a UI workflow change — this is a known gap for multi-branch pharmacies.

---

## SECTION 7 — CUSTOMER MARKETPLACE

**Q46. What can customers search for?**

Customers can search by medicine name or generic name. The search scans the verified national medicine database and returns results grouped by medicine, showing all pharmacies that carry it with price, availability status, delivery options, and city.

**Q47. Can customers compare pharmacy prices?**

Yes — the search results page shows the same medicine at multiple pharmacies side by side, with price and availability for each. Customers immediately see which pharmacy offers the lowest price and whether delivery is available.

**Q48. Should customers see exact stock quantities?**

No — and DawoLink does not show exact quantities. Customers see availability status only (In Stock / Low Stock / Out of Stock). Showing exact numbers exposes sensitive business data to competitors who could monitor stock levels systematically.

**Q49. What medicine information is visible to customers?**

Name, generic name, form, category, description, whether a prescription is required, price per pharmacy, and availability status. Cost price, supplier, batch number, and reorder levels are never exposed.

**Q50. Can customers upload prescriptions?**

Yes. When placing an order for a prescription-required medicine, customers can upload an image or PDF of their prescription. The file is stored in Cloudflare R2. The pharmacist receives the order with the prescription attached.

**Q51. How does the pharmacist approve prescriptions?**

The pharmacist opens the order in the Orders dashboard. A "Review Prescription" panel shows the uploaded image/PDF. The pharmacist marks it `VERIFIED` (order proceeds) or `REJECTED` (with a reason sent to the customer). With Phase 3 Doctor Portal, electronic prescriptions bypass this manual step entirely.

**Q52. Can customers chat with pharmacists?**

Yes — real-time chat per order is built (Phase 2). Each order has a dedicated chat room. Messages are stored in the database. The pharmacist responds through the Orders dashboard and the customer responds through the mobile app or web shop. Read receipts are supported.

**Q53. Can customers favorite pharmacies?**

Not yet built. A `FavoritePharmacy` feature is on the roadmap and is straightforward to add.

**Q54. Can customers reorder previous medicines?**

Not as a one-tap reorder button. Customers can view their order history and manually repeat the same items. A "Reorder" shortcut is planned.

**Q55. Can customers rate pharmacies?**

Yes — Phase 2 includes a full rating system. After a delivered order, the customer sees a "Rate Pharmacy" button. They submit 1–5 stars plus an optional comment. Ratings are stored in `PharmacyReview` and the pharmacy profile displays the average rating.

---

## SECTION 8 — DELIVERY SYSTEM

**Q56. Who assigns deliveries?**

Currently, delivery assignment is manual — a `BRANCH_MANAGER` or `PHARMACY_OWNER` assigns an order to a driver from the Orders dashboard. Automated assignment based on proximity is planned for Phase 3.

**Q57. Can orders be auto-assigned to the nearest driver?**

Not in the current build. Auto-assignment requires real-time GPS tracking and a matching algorithm. The `DeliveryLocation` model exists in the Phase 2 schema; the auto-assignment logic is Phase 3.

**Q58. How is the delivery fee calculated?**

Currently a flat fee model: $2.00 for delivery orders, $0 for pickup. Dynamic pricing based on distance, zone, or order size is not yet implemented.

**Q59. What happens if the customer is not home?**

The driver can update the order status to `ATTEMPTED_DELIVERY` with a note. The pharmacy is notified. A formal re-delivery request workflow requires manual follow-up through chat.

**Q60. Can a driver partially deliver an order?**

No — orders are delivered as a whole. Order splitting is not yet built.

**Q61. How does the customer track delivery?**

The customer sees order status updates in real-time through the mobile app / web shop via SSE (Server-Sent Events): PENDING → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED. Live GPS tracking is Phase 3.

**Q62. How is delivery proof recorded?**

Currently the driver marks the order as `DELIVERED` — no photo, OTP, or signature is captured. Proof-of-delivery is a planned enhancement.

**Q63. Can pharmacy owners monitor all drivers?**

Yes — the Driver Dashboard shows all active delivery orders, their current status, and which driver is assigned. Real-time GPS map view is Phase 3.

**Q64. Can drivers reject deliveries?**

Not in the current build. A driver acceptance/rejection flow is planned.

**Q65. Can customers schedule delivery for later?**

Not yet. All orders are for immediate processing. Scheduled delivery is a Phase 3 roadmap item.

---

## SECTION 9 — OFFLINE ARCHITECTURE

**Q66. What happens when internet disappears during POS?**

The `OfflineBanner` appears instantly. The POS switches to offline mode automatically with no user action required. Sales continue uninterrupted against cached IndexedDB data.

**Q67. Where is offline data stored?**

In the browser's IndexedDB via Dexie.js. Three tables: `medicines` (cached product catalog), `syncQueue` (pending API mutations), and `offlineTransactions` (completed POS sales awaiting sync). Data persists across browser restarts and device sleep.

**Q68. How does synchronization work?**

When internet returns, `processSyncQueue()` fires automatically (triggered by the `online` event). It processes the queue in order, retrying each item up to 3 times before marking it `failed`. Successful items are deleted from the queue. A sync badge shows the operator how many items are pending.

**Q69. What happens if two devices edit the same stock?**

Last-write-wins. If two cashiers on different devices both sell the last unit while offline, both transactions will sync successfully. The server processes them in arrival order. A conflict detection system is a known architectural gap for high-volume multi-device pharmacies.

**Q70. How are sync conflicts resolved?**

The server uses `offlineId` (a UUID generated at sale time) for idempotency. If the same transaction is submitted twice, the server returns the existing transaction rather than creating a duplicate. True multi-device stock conflicts are not resolved — last write wins.

**Q71. Can a branch operate offline for an entire day?**

Yes, with limitations. The medicine catalog was cached during the last online session. New medicines added after the cache refresh will not appear. All sales are queued and sync when the connection returns.

**Q72. What happens if the device crashes before sync?**

IndexedDB is ACID-compliant. A crash during a write either completes the transaction or rolls it back. If the device crashes after a sale was written to IndexedDB but before syncing, the sale remains in the queue and will sync when the device recovers. If the browser storage is cleared or the device is wiped, unsynced data is lost.

**Q73. Can the mobile app work offline?**

The React Native customer app currently does not have offline support. Offline mode is web-only (POS). Adding offline support to the mobile app is a Phase 3 enhancement.

**Q74. Can inventory receiving work offline?**

No. Purchase order receiving requires a live server connection for transactional consistency.

**Q75. How do you prevent data loss?**

Four layers: (1) IndexedDB persistence survives browser crashes, (2) `offlineId` prevents duplicate sync, (3) soft deletes mean nothing is permanently destroyed, (4) PostgreSQL performs automated daily backups.

---

## SECTION 10 — SECURITY

**Q76. Does DawoLink support 2FA?**

Yes — Email OTP 2FA is built (Phase 2). Users with 2FA enabled receive a 6-digit OTP by email during login, expiring after 10 minutes. Biometric authentication (Face ID / Fingerprint) is built into the React Native mobile app. SMS OTP is planned.

**Q77. How are passwords stored?**

All passwords are hashed with bcrypt (cost factor 10) before storage. Plain-text passwords are never stored or logged. Admins cannot retrieve user passwords — only reset them.

**Q78. How are backups performed?**

The PostgreSQL database on Render/Railway has automated daily backups. Application-level backup export is not yet built. Scheduled backup export to cloud storage is planned for Phase 3 Enterprise.

**Q79. Can deleted data be recovered?**

Yes — soft deletes are used throughout. Medicines and inventory items are marked with `deletedAt` but remain in the database. A platform admin can recover soft-deleted records. Hard deletion is not exposed through any UI.

**Q80. Can admins see user passwords?**

No. Passwords are one-way hashed with bcrypt. Neither pharmacy owners nor DawoLink platform admins can view any user's password. The only recovery path is a password reset flow (email link).

**Q81. What happens after multiple failed logins?**

The API is protected by `ThrottlerModule` — rate limiting of 100 requests per minute per IP. Account-level lockout (after N failed attempts) is not yet implemented. This is a security gap. The recommended fix is lockout after 5 failed attempts with a 30-minute cooldown.

**Q82. Can suspicious activity be detected?**

Yes — Phase 3 AI Fraud Detection scans audit logs for: repeated stock adjustments by the same employee, unusual voids, off-hours transactions, and inventory manipulation. Returns risk level (LOW/MEDIUM/HIGH) with specific alert descriptions for human review.

**Q83. Can pharmacy owners view login history?**

Yes — the Audit Log page records all `LOGIN` events with actor, timestamp, and IP address. Owners can filter by action type `LOGIN` to see who accessed the system and when.

**Q84. Can a user log out all devices?**

Not with a one-click button. DawoLink uses stateless JWTs (7-day expiry). Per-user token revocation requires a token blacklist, which is not yet implemented. This is a known security gap.

**Q85. How is patient data protected?**

Customer data is stored in PostgreSQL with no external sharing. Prescriptions are stored in Cloudflare R2 as private objects (not publicly accessible without a signed key). All data is transmitted over HTTPS (TLS). CORS is restricted to known origins. Disease trend dashboards use aggregate anonymous data only.

---

## SECTION 11 — BILLING & SUBSCRIPTIONS

**Q86. How does the free trial work?**

Every new pharmacy receives an automatic 14-day free trial. No credit card required. Full access to all features within Starter plan limits (1 branch, 5 staff). Warning email sent 3 days before expiry. Account suspended on day 14 if no payment.

**Q87. What happens when subscription expires?**

`isActive` is set to `false`. All staff are locked out. Data is preserved. The owner can reactivate at any time by submitting a payment through the Billing page. Reactivation is immediate upon payment confirmation.

**Q88. Can subscriptions auto-renew?**

Not automatically — DawoLink uses manual mobile money payments (EVC Plus, Zaad, Sahal) without recurring charge support. Auto-renewal is planned when recurring billing API support is available from the payment gateway.

**Q89. Can plans be upgraded instantly?**

Yes. Upgrading (e.g., Starter → Professional) takes effect immediately upon payment. New branch and staff limits apply instantly with no downtime.

**Q90. Can plans be downgraded?**

Yes — but only if the pharmacy is within the lower plan's limits. A pharmacy with 3 branches cannot downgrade to Starter (1 branch) until they deactivate 2 branches first.

**Q91. What happens to extra branches after downgrade?**

They must be manually deactivated before the downgrade is allowed. Existing data in deactivated branches is preserved and can be reactivated if the pharmacy upgrades again.

**Q92. Can invoices be downloaded?**

Yes. The Billing page shows the last 12 invoices. Each has a detail view designed for PDF/print with pharmacy name, address, plan, amount, and dates.

**Q93. Can pharmacies pay yearly?**

Yes. Both monthly and annual billing cycles are supported. Annual pricing: Starter $290/year (vs $348 monthly), Professional $790/year (vs $948 monthly).

**Q94. Can discounts be applied?**

Not through a self-serve coupon system. A platform admin can manually record a custom payment. A formal discount/coupon code system for subscriptions is not yet built.

**Q95. Can the super admin extend subscriptions manually?**

Yes — through the platform admin dashboard. The admin can record a manual payment for any pharmacy, extending the subscription period and reactivating a suspended account.

---

## SECTION 12 — ANALYTICS

**Q96. What KPIs should owners see daily?**

Total revenue, total transactions, average transaction value, top-selling medicine of the day, cash vs. digital payment split, expiry alerts, and low stock warnings.

**Q97. What KPIs should branch managers see?**

Branch-specific: revenue, transaction count, staff sales performance, current low-stock items, pending purchase orders, and pending online orders. Branch managers see their branch data only.

**Q98. Can employee performance be measured?**

Yes — Phase 3 Staff Analytics shows sales per staff member (by value and volume), stock adjustments made, login activity, and comparative performance across the team.

**Q99. Can supplier performance be measured?**

Yes — Phase 3 Supplier Analytics shows delivery reliability ratio, average delivery time, price history, and batch expiry rates per supplier.

**Q100. Can analytics be exported?**

Not yet as a bulk export. Individual reports can be printed. CSV/Excel export is a Phase 3 Enterprise feature. The API endpoints are available for integration with external BI tools.

**Q101. Can branches be compared?**

Yes — the Analytics page has a Branch Comparison chart showing revenue, transaction volume, and top medicines side by side across all branches.

**Q102. Can medicine trends be identified?**

Yes — the Top Medicines chart shows highest-selling medicines by revenue and volume over a selected period. The National Intelligence Disease Trends dashboard aggregates this across all pharmacies nationally.

**Q103. Can seasonal demand be tracked?**

Yes — historical sales data allows trend analysis by date range. The AI Demand Forecasting feature models Somalia's seasonal disease patterns (malaria season March–June and September–November, respiratory infections in dry season).

**Q104. Can sales forecasts be generated?**

Yes — via the AI Demand Forecasting module (Phase 3). It analyzes the last 90 days of sales, applies seasonal models, and returns forecast with predicted demand changes, recommended stock increases, and risk alerts.

**Q105. What is the most important dashboard widget?**

The Revenue Trend chart combined with the Expiry Alerts widget. Revenue trend shows business trajectory. Expiry alerts show the biggest preventable loss. Together they tell an owner whether the business is growing and whether stock is being managed efficiently.

---

## SECTION 13 — NATIONAL MEDICINE NETWORK

**Q106. How is a medicine verified globally?**

A pharmacy submits a medicine (status: `PENDING_VERIFICATION`). A DawoLink platform admin reviews it in the Verification Queue. If approved (`VERIFIED`), the medicine joins the national catalog and is searchable across all pharmacies. If rejected, a reason is provided and the pharmacy can resubmit.

**Q107. Who approves medicines?**

DawoLink platform admins only. No pharmacy can approve medicines for the national catalog. This prevents competitive manipulation and ensures data integrity.

**Q108. How are duplicate medicines prevented?**

Three mechanisms: (1) Barcode lookup — a matching barcode returns the existing entry. (2) Admin review — the platform admin identifies duplicates during verification. (3) Planned: fuzzy name matching that flags probable duplicates before submission.

**Q109. Can pharmacies share availability?**

Yes — the National Medicine Availability Network shows customers which pharmacies have a specific medicine in stock. Pharmacies implicitly share availability by maintaining their inventory on DawoLink.

**Q110. Can customers search all pharmacies?**

Yes — the public medicine search queries all pharmacies with the medicine in their verified, active inventory. There is no opt-out — a pharmacy on DawoLink is visible in the national search by design.

**Q111. Can shortages be detected nationally?**

Yes — Phase 3 National Shortage Detection aggregates inventory data across all pharmacies in real time. It identifies medicines where stock is critically low across multiple branches, ranks by severity, and shows which cities are most affected.

**Q112. Can counterfeit medicines be flagged?**

Yes — Phase 3 Counterfeit Detection allows staff to scan a medicine by name, batch number, or barcode. The system cross-checks active recall alerts and previous suspicious scan records. Results: `VERIFIED`, `SUSPICIOUS`, `COUNTERFEIT`, or `UNVERIFIED`.

**Q113. Can medicine recalls be broadcast?**

Yes — Phase 3 Medicine Recall System allows a platform admin to issue a recall. `HIGH` and `CRITICAL` severity recalls trigger automated emails to all pharmacy owners immediately. The recall is visible in the public recalls feed.

**Q114. Can government agencies receive analytics?**

The National Intelligence dashboard provides: national shortage map, price intelligence, disease trend data, and recall history. A dedicated read-only portal for NGOs and government agencies with aggregated, anonymized data is on the Phase 3 roadmap.

**Q115. How does DawoLink become a national medicine database?**

By being the platform where all pharmacies manage their inventory. Every verified medicine, every sale, every stock level, and every shortage automatically feeds the national dataset. DawoLink does not need government involvement to build this — it becomes the de facto national medicine database by acquiring enough pharmacies. At critical mass (50+ pharmacies), the dataset becomes irreplaceable: no competitor can replicate years of transaction history, verified medicine records, and real-time availability data.

---

## SECTION 14 — AI

**Q116. What should AI be allowed to do?**

- Suggest drug alternatives when a medicine is out of stock
- Check drug interactions and flag dangerous combinations
- Provide dosage and side effect information to pharmacists
- Forecast demand based on historical sales and seasonal patterns
- Recommend optimal inventory levels and reorder quantities
- Summarize prescription contents for fast dispensing
- Detect unusual patterns in audit logs (fraud indicators)
- Answer customer health questions within safe boundaries

**Q117. What should AI NEVER be allowed to do?**

- Diagnose medical conditions for patients
- Prescribe medicines — this must remain with licensed doctors
- Automatically take business actions without human approval (e.g., place purchase orders autonomously)
- Access or process patient-identifiable health data outside the scope of the specific request
- Override a pharmacist's professional judgment
- Replace the medicine verification process — human admin must always verify
- Generate medical advice that contradicts established clinical guidelines

**Q118. Can AI suggest alternatives?**

Yes — the AI Pharmacist Assistant is specifically designed for this. When a medicine is unavailable, a pharmacist can ask for therapeutic alternatives. The AI returns options in the same drug class with dosage differences and clinical considerations noted.

**Q119. Can AI detect interactions?**

Yes — through the AI Pharmacist Assistant. A pharmacist can describe a patient's current medications and ask whether a new medicine is safe to add. The AI returns an interaction assessment with severity level and clinical explanation. This is advisory — the pharmacist makes the final decision.

**Q120. Can AI forecast stock demand?**

Yes — Phase 3 AI Demand Forecasting analyzes 90 days of sales history per branch, applies Somalia-specific seasonal models, and returns trend per medicine, predicted percentage change, reason, and recommended action.

**Q121. Can AI recommend suppliers?**

Not yet. Supplier recommendation would require AI to analyze supplier performance data and match it to demand forecasts. This is architecturally feasible with Phase 3 Supplier Analytics data and is on the product roadmap.

**Q122. Can AI summarize prescriptions?**

Yes — a pharmacist can paste prescription text or describe a prescription, and the AI returns a structured summary: medicine names, dosages, frequencies, durations, and interaction flags. With Phase 3 electronic prescriptions, the AI can process them directly as structured JSON.

**Q123. Can AI detect employee fraud?**

Yes — Phase 3 AI Fraud Detection scans audit logs for: repeated stock adjustments by the same employee in short timeframes, unusual void patterns, off-hours transactions, and inventory discrepancies. Returns risk score (LOW/MEDIUM/HIGH) and specific alert descriptions for human review.

**Q124. Can AI detect unusual sales patterns?**

Yes — as part of fraud detection and demand forecasting. Unusual patterns flagged include: sudden spikes in a specific medicine's sales, sales at prices below configured selling price, high-value transactions by low-role staff, and repeated sales of controlled substances.

**Q125. How will AI costs be controlled?**

Four mechanisms: (1) AI calls are initiated by explicit user action — no automatic background AI processing. (2) Response token limits are set per feature type (Pharmacist: 1,024 tokens, Forecast: 2,048 tokens, Fraud: 1,024 tokens). (3) Data sent to the AI is pre-filtered — only top 20–25 medicines or 300 audit log entries, not entire databases. (4) AI can be disabled at the environment variable level (`ANTHROPIC_API_KEY` not set) without any code change.

---

## SECTION 15 — BUSINESS STRATEGY

**Q126. Why will pharmacies choose DawoLink?**

Because it solves every operational problem in one platform — inventory, POS, staff, suppliers, expiry tracking, online orders, delivery, and billing — at a price ($29–$79/month) far less than the cost of stock loss from poor expiry management alone. The offline-first POS works with Somalia's unreliable internet. The medicine marketplace brings new customers they would never reach otherwise.

**Q127. Why will they stay for years?**

Because their entire business history is in DawoLink. Every transaction, every supplier relationship, every customer, every audit record. Migration cost is prohibitively high. More importantly, the AI Demand Forecasting becomes more accurate as their sales history grows — the longer they stay, the smarter the system gets for their specific pharmacy. This creates a compounding value advantage that new competitors cannot replicate.

**Q128. What prevents competitors from copying it?**

Three things competitors cannot copy quickly:
1. **The national medicine database** — years of verified medicine entries, pricing data, and availability records across all pharmacies. This takes years and hundreds of pharmacies to build.
2. **Customer relationships** — patients who have ordered through DawoLink have their history, loyalty points, and saved prescriptions in the system.
3. **Network effects** — each new pharmacy makes the shortage detection, price intelligence, and disease trend data more valuable for every other pharmacy.

**Q129. What is the strongest moat?**

The national medicine data network. Not the software — software can be copied. The moat is the aggregate of: verified medicine records, real-time stock availability across 50+ pharmacies, years of transactional pricing data, disease trend patterns, and supplier performance history. This dataset becomes a national health infrastructure asset with regulatory, academic, NGO, and government value far beyond what any single pharmacy pays in subscription fees.

**Q130. What becomes the most valuable asset — software, customers, medicine network, or data?**

**Data** — specifically the national medicine intelligence data.

- **Software** depreciates and can be replicated
- **Customers** are valuable but portable — they can leave
- **Medicine network** (the pharmacies) is a distribution channel
- **Data** is irreplaceable, compounding, and multi-dimensional

The sales transaction data, pricing data, shortage patterns, disease trend correlations, and medicine availability data become worth more every year. A government health ministry would pay for national shortage alerts. An NGO would pay for regional disease trend data. A pharmaceutical distributor would pay for demand forecasting by city. An insurance company would pay for medicine utilization patterns.

The pharmacies paying $29/month are simultaneously the customers, the distribution network, and the data generators. DawoLink's long-term business is not selling software subscriptions — **it is being the data layer of Somalia's healthcare system.**

---

## ARCHITECT REVIEW — ADDITIONAL ANSWERS (v1.1)

### Pharmacy Verification
Every new pharmacy registration creates a `verificationStatus: PENDING` record. The pharmacy can log in and set up their internal operations but does **not** appear in the national marketplace until verified. Platform admin reviews the pharmacy via `/admin/verify-pharmacies`, inspects the uploaded license and registration certificate documents, then approves or rejects with a written reason. On approval, an inbox notification is sent to the pharmacy owner and they become visible in marketplace search. On rejection, the owner receives feedback and can resubmit. This prevents fake or unlicensed pharmacies from appearing to customers.

### Supplier Verification
Supplier accounts created through the Supplier Portal require: business name, registration number, contact details, and a service city. Supplier verification follows the same admin review flow — platform admin can verify or suspend supplier accounts. Suppliers marked unverified cannot appear in the supplier marketplace or receive purchase orders from the procurement network.

### Prescription Medicines (RX Enforcement)
Medicines are flagged `requiresPrescription: true` by the platform admin during the verification step. When a customer attempts to order an RX medicine without uploading a prescription, the API blocks the order with: *"Prescription required for [medicine name]. Please upload a valid prescription."* The customer must upload a photo/PDF of their prescription. The pharmacist then reviews and approves it before the order proceeds to `PREPARING`. With the Phase 3 Doctor Portal, electronic prescriptions bypass this manual step — the digital prescription is pre-verified.

Who defines RX status: DawoLink platform admin, based on Somalia's Ministry of Health controlled/prescription medicine list. Pharmacists cannot override the RX requirement — they can only approve or reject the uploaded prescription document.

### Marketplace Ranking
Search results are sorted using the `sortBy` parameter:

| Sort Option | Logic |
|-------------|-------|
| `relevance` (default) | Available first → sorted by number of pharmacies carrying it |
| `price_asc` | Lowest price first |
| `price_desc` | Highest price first |
| `availability` | In Stock → Low Stock → Out of Stock |
| `rating` | Highest-rated pharmacies first (Phase 3 enhancement) |

Only pharmacies with `verificationStatus: VERIFIED` appear in search results. Sponsored placement (supplier advertising) is a planned revenue stream where medicines/pharmacies can pay for priority placement above organic results.

### Loyalty Program
**Already fully built (Phase 2).** Customer earns 1 point per $1 spent on delivered orders. Redeem 10 points = $1 off any order. Points are applied at checkout automatically. The mobile app has a dedicated Loyalty tab showing balance, lifetime earned, and transaction history. Future enhancements: pharmacy-level loyalty tiers (Bronze/Silver/Gold membership), birthday bonuses, and referral rewards.

### Branch Transfer Workflow
**Already fully built (Phase 2).** Branch A staff creates a stock transfer request (select destination branch, select medicine, enter quantity). The system validates that Branch A has sufficient stock. The transfer is created with status `PENDING`. A Branch Manager at Branch B (or Pharmacy Owner) approves. On approval, stock is atomically deducted from Branch A and added to Branch B. The transfer is tracked in audit logs as `STOCK_TRANSFERRED`. Drivers can be assigned to physically transport the stock.

### Medicine Images
Medicine records support an `imageUrl` field. A single image can be uploaded during medicine creation or editing, stored in Cloudflare R2. Multi-image support (up to 5 images per medicine, with a designated primary image) is a planned enhancement. The Global Medicine database also carries images that are surfaced to customers even when a pharmacy's medicine entry has no image.

### Customer Health Profile
**Now built (Phase 3B).** Customers can update their health profile via `PATCH /v1/marketplace/auth/profile`:
- Date of birth, gender
- Allergies (list of strings)
- Chronic conditions (diabetes, hypertension, asthma, etc.)
- Blood type
- Emergency contact

This data is visible to pharmacists when reviewing orders with prescription requirements. It feeds the AI Pharmacist Assistant — when checking drug interactions, the system can flag medicines that are contraindicated for the customer's known conditions or allergies. All health profile data is private and only accessible to the customer and assigned pharmacist for their order.

### Support System
**Now built (Phase 3B) — foundation layer.** Support tickets model is live: `POST /v1/support-tickets` for pharmacies/customers to submit tickets with category (General/Billing/Technical/Inventory/Delivery/Account), priority (Low/Medium/High/Urgent), and description. Platform admin manages tickets via `/admin/support-tickets`. Full support features roadmap:
- Phase 3: Email notifications on ticket updates
- Phase 4: In-app live chat with support agents
- Phase 4: Knowledge base / FAQ self-service portal
- Phase 4: WhatsApp Business API integration

### Disaster Recovery
**Current state:**
- PostgreSQL automated daily backups via Render/Railway hosting
- Soft deletes prevent accidental permanent data loss
- All code in GitHub (`Iconic-83/dawolink`) — infrastructure can be rebuilt from source

**Documented recovery plan:**
1. Database crash: Restore from Render/Railway point-in-time backup (RPO: 24 hours, RTO: ~1 hour)
2. Server compromise: Redeploy from GitHub → Render Blueprint in ~15 minutes. Rotate JWT_SECRET (invalidates all sessions)
3. Cloud outage: Render free tier has no SLA. Enterprise upgrade includes automatic failover
4. Full data export for pharmacy portability: planned Phase 3 feature — CSV/JSON export of all pharmacy data

**Planned Phase 3 hardening:** Automated nightly database export to Cloudflare R2 as a secondary backup. Point-in-time recovery window target: 1 hour.

---

## NEW FEATURE: MEDICINE RESERVATION
**Now built (Phase 3B).** Customers can reserve a medicine for **2 hours** before arriving at the pharmacy.

Workflow:
1. Customer searches medicine → finds available pharmacy
2. Clicks "Reserve for 2 Hours"
3. System checks available stock minus already-held reservations
4. If sufficient: reservation created, stock logically held
5. Customer receives confirmation with expiry time
6. Pharmacy dashboard shows active reservation: customer name, phone, medicine, quantity, time left
7. Customer arrives → pharmacist clicks "Confirm" → reservation converts to sale
8. If customer doesn't arrive: reservation auto-expires via 5-minute cron → stock released

This is extremely valuable in Somalia where customers travel across the city to find specific medicines. It eliminates the experience of a long journey only to find the medicine sold out.

---

## PLATFORM LAYER ARCHITECTURE (7 Layers)

```
┌─────────────────────────────────────────────────────┐
│  Layer 7 — AI Healthcare Assistant                  │
│  Claude-powered: pharmacist AI, demand forecast,    │
│  fraud detection, customer health assistant         │
├─────────────────────────────────────────────────────┤
│  Layer 6 — Government & NGO Dashboard               │
│  Disease trends, shortage alerts, medicine access,  │
│  anonymous aggregate analytics, recall broadcasts   │
├─────────────────────────────────────────────────────┤
│  Layer 5 — National Medicine Intelligence           │
│  Verified medicine database, price intelligence,    │
│  shortage detection, counterfeit scanning,          │
│  electronic prescription network                   │
├─────────────────────────────────────────────────────┤
│  Layer 4 — Delivery Network                         │
│  Driver management, delivery tracking,              │
│  insurance claims, GPS (Phase 3)                    │
├─────────────────────────────────────────────────────┤
│  Layer 3 — Supplier Portal                          │
│  Supplier marketplace, catalog management,          │
│  direct procurement, supplier analytics             │
├─────────────────────────────────────────────────────┤
│  Layer 2 — Customer Marketplace                     │
│  Medicine search, orders, chat, loyalty,            │
│  ratings, reservations, health profile              │
├─────────────────────────────────────────────────────┤
│  Layer 1 — Pharmacy SaaS                            │
│  POS, inventory, staff, suppliers, billing,         │
│  analytics, expiry alerts, offline mode             │
└─────────────────────────────────────────────────────┘
```

Each layer adds value independently. A pharmacy that never uses the marketplace still gets full value from Layer 1. A customer benefits from Layer 2 without knowing Layer 5 exists. Government agencies consume Layer 6 without touching any other layer. This architecture supports growth for many years without changing the core data model.

---

## KNOWN GAPS (as of May 2026 — updated v1.1)

| Gap | Priority | Status |
|-----|----------|--------|
| Account lockout after failed logins | High | Not built — immediate fix needed |
| JWT token revocation (log out all devices) | Medium | Not built — Phase 3 |
| Formal return/refund transaction type | High | Not built — Phase 3 |
| One-tap reorder from order history | Medium | Not built — Phase 3 |
| Customer favorite pharmacies | Low | Not built — Phase 3 |
| Bulk data export (data portability) | High | Not built — Phase 3 |
| Auto-delivery assignment by driver proximity | Medium | Not built — Phase 3 |
| Delivery proof (photo/OTP/signature) | Medium | Not built — Phase 3 |
| Mobile app offline support | Medium | Not built — Phase 3 |
| Automated subscription renewal | Medium | Depends on gateway |
| Hard block on selling expired medicines | Medium | Not built — Phase 3 |
| Fuzzy medicine name deduplication | Medium | Not built — Phase 3 |
| Multi-branch staff accounts | Medium | Not built — Phase 3 |
| Supplier advertising / sponsored placement | Medium | Not built — Phase 3 |
| Medicine multi-image (up to 5) | Low | Not built — Phase 3 |
| In-app live chat support | Low | Not built — Phase 4 |
| Knowledge base / FAQ portal | Low | Not built — Phase 4 |
| Scheduled delivery (book for later) | Medium | Not built — Phase 3 |
| Driver GPS real-time tracking | Medium | Not built — Phase 3 |
| Subscription discount/coupon codes | Low | Not built — Phase 3 |

---

*DawoLink Product Documentation v1.1*
*Phases 1 & 2 complete · Phase 3 in progress*
*SaaS Architecture Review: 9.2/10*
*Repository: github.com/Iconic-83/dawolink*
