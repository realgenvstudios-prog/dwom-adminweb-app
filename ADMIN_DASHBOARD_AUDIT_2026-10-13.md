# Admin Dashboard — Non-Functional / Fake-Data Audit (2026-10-13)

Full sweep of every page outside the Finance/Workers/Founder-Ledger/Marketing work built earlier this session (already verified separately). Mobile app (`dwom-user-app`) was also audited — only one minor finding there, listed at the bottom.

Status column: all items below are **unfixed** as of this writing.

## Broken / misleading (real bugs)

| # | Location | Issue | Status |
|---|----------|-------|--------|
| 1 | `src/components/SettingsPage.tsx` / `src/components/settings/useSettingsData.ts:119-141` (`handleSave`) | Paystack public/secret key fields and SMTP/SendGrid API key fields are editable in the UI but never included in the save payload sent to the backend. Admin edits them, sees "Settings saved successfully," nothing persists. Backend already supports these fields (`UpdateSettingsDto`) — pure frontend wiring gap. | Unfixed |
| 2 | `src/components/settings/SecurityAuditSection.tsx` | "Change Password" field is collected into state but has no save handler/API call anywhere. | Unfixed |
| 3 | `src/components/subscriptions/SubscriptionsTrendChart.tsx:51-59` | On fetch failure, silently substitutes fabricated "steady growth" numbers (100, 105, 110, 115, 120) instead of showing an error — a down backend looks like healthy growth. | Unfixed |
| 4 | `src/components/OrdersPage.tsx:170` | "Export CSV" button has no `onClick` handler at all. | Unfixed |
| 5 | `src/components/AdminsPage.tsx:241-242` | "View" and "Edit" buttons only `logger.log(...)` — no modal/detail/edit form opens. | Unfixed |
| 6 | `src/components/settings/SecurityAuditSection.tsx:40` | "View Audit Logs" button is a true no-op (`onClick={() => {}}`). | Unfixed |
| 7 | `src/components/settings/EmailNotificationSection.tsx:61` | "Template Management" button is a true no-op. | Unfixed |
| 8 | `src/components/SupportPage.tsx:240-241` | Ticket-list "Prev"/"Next" pagination buttons have no handlers — pagination doesn't work. | Unfixed |

## Cleanup / minor

| # | Location | Issue | Status |
|---|----------|-------|--------|
| 9 | `src/components/finance/financeMockData.ts` | Entire file unused anywhere in the codebase — leftover mock data, should be deleted. | Unfixed |
| 10 | `src/components/ProductsPage.tsx:12-21` | Falls back to hardcoded fake categories (Vegetables/Grains/Spices/Bundles) if the real fetch returns an empty array, not just on error. | Unfixed |

## Mobile app (`dwom-user-app`)

| # | Location | Issue | Status |
|---|----------|-------|--------|
| 11 | `src/screens/CreatePlanStep2Screen.tsx:293` | Product-card `Pressable` wrapping each row has no `onPress` — only the inner "Add"/"Choose" button is tappable, unlike every other product grid in the app. Cosmetic, not broken. | Unfixed |

## Confirmed clean (checked, no issues)

Dashboard, Coupons, Data Deletion Requests, Notes & Search Tracking, Analytics, Delivery Zones, Warehouse Operations, Suppliers & Purchases, Seasonal Products, Categories, Bundles, Riders, Customers, Subscriptions summary cards, all 36 mobile screens' navigation registration, all mobile service-layer data sourcing.
