# CaterFlow Pro — Firebase Phase 1 test plan

## Preconditions

- Firebase Authentication email/password provider enabled.
- Firestore created and rules deployed (`firebase/firestore.rules`).
- Firebase server service account configured, `node --env-file=.env.local scripts/bootstrap-owner.mjs` completed.
- `npm install`, `npm run typecheck`, `npm run build`, `npm test` pass with real node_modules.

## End-to-end owner flow

1. Sign in with the bootstrapped owner; check cookie is HttpOnly and no service-account key appears in client bundles.
2. Add a customer; verify customer appears in directory and details can be edited.
3. Create an event under the customer; confirm event detail and calendar both show it.
4. Add catering and decoration packages; create a quotation with several line items; verify totals.
5. Check that accepted and pending quotation statuses update; ensure quote item prices are snapshots.
6. Accept a quotation and issue an invoice; verify exact one invoice for the quote and PDF download.
7. Record an advance and a final installment; verify `paid_amount`, balance due and status are correct.
8. Attempt to overpay an invoice; verify no payment record is created and invoice stays unchanged.
9. Record an event expense; verify dashboard, event estimated profit and expense register.
10. Edit business settings; verify company name/address on PDF.

## Staff/permission scenarios

1. Owner creates staff account with temporary 12+ character password; staff can sign in.
2. Staff can create/edit customers and events, view packages, but cannot open finance, team or settings routes.
3. Staff cannot invoke owner server actions directly; owner guard rejects the request.
4. Staff cannot directly fetch Firestore data via Firebase Web SDK with browser credentials because deny-all rules apply.
5. Disable staff; verify login is blocked and existing cookie no longer grants access.
6. Re-enable staff; verify access can be restored after sign-in.
7. Staff changes password, then signs in again.

## Concurrency and data integrity

1. Issue two invoices concurrently from one accepted quote: at most one invoice exists.
2. Submit two payments simultaneously where combined total exceeds balance: one must fail, no overpayment.
3. Change a quote after invoicing: cannot move away from `accepted`.
4. Reject a quote with 0 lines, 0 total, discount > subtotal or invalid quantities.
5. Verify that an Auth user without an active `profiles/{uid}` cannot obtain an application session, and bootstrap refuses a second owner.

## Current verification status

- This Firebase Phase 1 implementation was prepared within a sandbox, without a live Firebase project or service account; a live end-to-end run has **not** been performed.
- Use the commands above in your own workspace for real integration/build verification.
