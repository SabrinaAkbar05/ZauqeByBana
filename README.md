# CaterFlow Pro — Firebase Phase 1

Private catering + event decoration business management for **one company**, with an owner and restricted staff users.

**Stack:** Next.js 16 / React / TypeScript / Firebase Authentication / Cloud Firestore / Firebase Admin SDK / Tailwind CSS / pdf-lib.

## Phase 1 screens

- Owner/staff login and role-based access
- Dashboard with bookings, customers and owner-only financial KPIs
- Customers and linked event booking calendar
- Catering/decoration/equipment/service packages
- Quote builder with detailed services, discount, tax and PDF export
- Accepted quote → one invoice, invoice PDF export
- Invoice advances/installments and balance management
- Event expenses and estimated gross profit
- Staff provisioning, enabling/disabling, password changes
- Company settings for PDFs

**Important:** Firebase Storage rules are included and deny all direct access. Uploads, decorations boards, vendor scheduling and inventory reservation are Phase 2, not falsely presented as functional in this version.

## 1 — Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/), **Create project**.
2. Under **Build → Authentication → Sign-in method**, enable **Email/Password**.
3. Under **Build → Firestore Database**, create the Firestore database (choose a region appropriate for the business). Keep rules restrictive.
4. In **Project settings → General → Your apps**, register a **Web app** and copy its Firebase config.
5. In **Project settings → Service accounts**, generate a new private key. **Never commit or share the JSON or `private_key`.**
6. Storage is optional for Phase 1. Do not loosen storage rules until a file-upload feature is built.

## 2 — Configure the application

```bash
npm install
cp .env.example .env.local
```

On Windows Command Prompt use `copy .env.example .env.local`, then edit `.env.local` in VS Code.

Fill all `NEXT_PUBLIC_FIREBASE_*` web config values and the following **server-only** values from the service account:

```dotenv
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Use the exact JSON private-key content, with line breaks represented as `\n` inside this quoted environment variable. The server converts `\n` back into line breaks at runtime.

**Alternative:** For local development use Google Application Default Credentials (`GOOGLE_APPLICATION_CREDENTIALS` pointing to the local service-account JSON). Never put that file in this project or Git. Vercel generally uses `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` instead.

## 3 — Deploy security rules

Install Firebase CLI if you don't have it:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

The repo includes `firebase/firestore.rules`, which denies all browser Firestore operations; all business queries use the server-side Admin SDK. `firebase/storage.rules` is also deny-all; deploy storage rules only once you have configured a Storage bucket and decided to use it.

**Note:** Firebase Admin SDK bypasses Firestore security rules. Owner/staff checks therefore happen in the Next.js server and are mandatory. Do not use `adminDb` in public routes or client components.

## 4 — Create the first owner

Append these three entries to `.env.local` for the **initial bootstrap only**:

```dotenv
OWNER_EMAIL=owner@yourcompany.com
OWNER_PASSWORD=CHANGE_TO_A_UNIQUE_12_PLUS_CHARACTER_PASSWORD
OWNER_NAME=Business Owner
BUSINESS_NAME=My Catering Company
```

Run from the project root with **Node.js 22+**:

```bash
node --env-file=.env.local scripts/bootstrap-owner.mjs
```

This provisions a Firebase Auth email/password user, creates the `profiles/{firebaseUid}` document with `role=owner`, and creates the `businesses/main` company document. It will refuse to promote a second owner if an owner profile exists. **After success, remove `OWNER_PASSWORD` from `.env.local`.**

This step is necessary: simply creating an Auth account in the Firebase Console does not give it owner access.

## 5 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in as the owner, then create a customer → event → package → quote → invoice → payment → expense.

Verify before deploying:

```bash
npm run typecheck
npm run build
npm test
```

You need network access for `npm install` and Firebase cloud access for integration tests. TypeScript parsing tests alone do not prove that Firebase services work.

## 6 — Staff accounts

Under **Team Access**, the owner supplies each staff member's name, email and strong **temporary password**. The owner shares the password securely; this starter does **not** send automated invitation emails. Staff then use the **Change password** link in the sidebar. Unprofiled Firebase Auth accounts are not authorized to sign into the workspace, even if registered through Firebase Auth APIs.

Staff can view/edit customers/events and view service packages, but cannot access quotations, invoices, payments, expenses, profits, team management or company settings. Disabling a staff account updates their Firestore profile and Firebase Auth account.

## 7 — Deployment (Vercel)

- Push project to GitHub without `.env.local`, Firebase JSON keys or any secret file.
- Import the repository into Vercel as a Next.js project.
- Add all listed web config variables and server-only credential variables in **Project → Settings → Environment Variables**.
- Add the production domain to **Firebase Authentication → Settings → Authorized domains**.
- Ensure the deployment uses the Next.js Node.js runtime (not a static export).
- Complete all tests in `docs/TEST_PLAN.md` before using real client financial records.

## Source folders

```text
caterflow-pro/
├── src/
│   ├── app/
│   │   ├── (auth)/               login, disabled-user notice, password change
│   │   ├── (app)/                owner and staff app pages
│   │   ├── api/auth/session/     Firebase token → server cookie
│   │   ├── api/quotes/.../pdf/   owner-only PDF endpoint
│   │   ├── api/invoices/.../pdf/ owner-only PDF endpoint
│   │   └── actions.ts            server-side business operations
│   ├── components/              dashboard/UI forms and calendar
│   └── lib/
│       ├── firebase/
│       │   ├── admin.ts           server-only Firebase Admin initialization
│       │   ├── client.ts          client Auth (no Firestore browser access)
│       │   ├── data.ts            Firestore read and simple CRUD adapter
│       │   └── finance.ts         atomic quotations/invoices/payments
│       ├── auth.ts               session verification and owner/staff guard
│       ├── pdf.ts                PDF generation
│       └── utils.ts
├── firebase/                     Firestore and Storage security rules
├── scripts/bootstrap-owner.mjs   one-time owner setup
├── docs/                         architecture and testing
└── .env.example
```

### Constraints and architecture details

See `docs/ARCHITECTURE.md` for the Firestore document model, server authorization and transactions. The single-company data adapter filters/sorts small collections on the server and **must be upgraded to indexed/paginated queries** for higher data volume. Automated emails, immutable audit logging, refunds and accounting-level financial ledgers are out of scope for the starter.

## Latest login diagnostic patch

The full project ZIP includes the updated `src/components/LoginForm.tsx` (progress labels, timeouts, visible login errors), plus the Firebase client configuration checks. The login form no longer silently waits forever on the most common stalled authentication and session requests. It does **not** by itself correct invalid Firebase credentials or solve a separate Next.js hydration error. Consult `START_HERE.md` and `docs/LOGIN_DEBUG_STEPS.md`.
