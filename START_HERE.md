# CaterFlow Pro — Firebase Edition (complete updated Phase 1)

This is the **entire** CaterFlow Pro source folder. It includes the Firebase Admin/server integration, Firestore data and transaction workflows, owner/staff access, dashboard, customers, events, catering/decor packages, quotations, invoices, payments, expenses, PDFs, and the most recent login diagnostic patch.

## IMPORTANT: keep your existing Firebase project and configuration

- **Do not recreate your Firebase project or owner user** if they already exist.
- This ZIP intentionally **does not contain** `.env.local`, private service-account keys, `node_modules`, or `.next`.
- If you're replacing an older project folder, copy its working `.env.local` into this new folder **on your own computer**. Never send `.env.local` to anyone or commit it to GitHub.
- Extract the ZIP first. The folder inside it is named `caterflow-pro`.

## Run locally (Windows PowerShell / VS Code terminal)

```powershell
cd path\to\caterflow-pro
npm install
npm run dev
```

Open `http://localhost:3000/login`.

If this is your first setup, copy `.env.example` to `.env.local`, add your **own** Firebase web and Firebase Admin values, then follow `FIREBASE_SETUP_STEPS.md` to bootstrap the **first** owner exactly once.

## Debug login if it hangs

The updated `src/components/LoginForm.tsx` has an error message and explicit progress indicators, with timeouts for Firebase Auth, token retrieval, and `/api/auth/session`.

1. Stop server (`Ctrl+C`), optionally delete `.next`, then run `npm run dev` again.
2. Hard refresh `Ctrl+Shift+R` in the browser.
3. Try signing in. Note which step displays: **Verifying account with Firebase**, **Preparing secure session**, or **Creating your workspace session**.
4. If you see the red Next.js **1 Issue** badge, click it for the full error. Also inspect DevTools `F12 > Console` and `Network`, and check the VS Code terminal.
5. Share only sanitized error text/screenshots; **never share passwords, ID tokens, cookies or service-account secrets**.

The diagnostic patch prevents many indefinite spinners but cannot guarantee a successful login without correct Firebase credentials, an active `profiles/{uid}` entry and reachable Firebase services.

## Verify before deploying

```powershell
npm run typecheck
npm test
npm run build
```

Then manually test: `owner login → customer → event → package → quote → accepted → invoice → payment → expense` and confirm staff permissions. See `docs/TEST_PLAN.md`.

## Project folders

- `src/app/(auth)` — login, pending, password reset/change
- `src/app/(app)` — protected dashboard and business screens
- `src/app/api/auth/session` — Firebase ID token to HttpOnly server session
- `src/app/actions.ts` — server business operations
- `src/components` — UI, forms, calendar, login diagnostics
- `src/lib/firebase` — client and Admin initialization, Firestore access and finance transactions
- `firebase/` — Firestore/Storage rules
- `scripts/bootstrap-owner.mjs` — first-owner setup (run **only** if needed)
- `docs/` — architecture, test plan and login troubleshooting

No Supabase code or database is required.
