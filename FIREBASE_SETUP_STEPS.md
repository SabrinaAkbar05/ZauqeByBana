# CaterFlow Pro: Firebase quick-start checklist

1. Create your Firebase project in https://console.firebase.google.com/.
2. Enable **Authentication → Email/Password**.
3. Create **Firestore Database** in production mode.
4. Register a Firebase Web App and copy its config variables.
5. Generate a service account in **Project settings → Service accounts**; do not upload or commit its private key.
6. Open this folder in VS Code; copy `.env.example` to `.env.local`.
7. Fill `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
8. Deploy `firebase/firestore.rules` with Firebase CLI (`firebase deploy --only firestore:rules`).
9. Temporarily add `OWNER_EMAIL`, `OWNER_PASSWORD`, and `OWNER_NAME` to `.env.local`, then run `node --env-file=.env.local scripts/bootstrap-owner.mjs`.
10. Remove `OWNER_PASSWORD` from `.env.local` after successful setup.
11. Run `npm install`, `npm run dev`, open http://localhost:3000 and sign in.
12. Test **customer → event → package → quote → accepted → invoice → payment → expense** before any real client use.

**Data model:** `profiles`, `businesses`, `customers`, `events`, `packages`, `quotes`, `quote_items`, `invoices`, `payments`, `expenses` and `counters` in Cloud Firestore. All writes and reads happen server-side via Firebase Admin SDK; no Supabase or PostgreSQL.

Read `README.md` for the detailed Windows setup, security guidance and deployment instructions.

## Login stuck on "Signing in..." or red Next.js issue indicator

This source includes a fix so Firebase setup errors are caught and displayed on the login form rather than leaving the button stuck. After replacing your local files, stop the dev server, run `npm run dev`, and try signing in again.

1. Verify `.env.local` contains the six `NEXT_PUBLIC_FIREBASE_*` values from Firebase Console → Project settings → Your apps → Web app, **and** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` from the same project's service account. Don't share the private key.
2. Firebase Console → Authentication → Sign-in method → Email/Password must be enabled.
3. Run the one-time owner bootstrap per the guide; Auth user alone is not enough. `profiles/{uid}` must exist with `role: owner` and `status: active`.
4. If the form reports an error, inspect browser DevTools → Console and Network → `POST /api/auth/session`. A response saying "This account has not been activated" means the Firestore profile needs attention.
5. Click the red "1 Issue" indicator and inspect the detailed Next.js error; it may be unrelated to Firebase login.

## Update included in this complete folder

This release integrates the **latest login timeout and diagnostic UI** directly into `src/components/LoginForm.tsx`, plus the client Firebase configuration checks in `src/lib/firebase/client.ts`. No separate patch is needed. See `START_HERE.md` and `docs/LOGIN_DEBUG_STEPS.md` for troubleshooting.

**Important:** Existing Firebase configuration goes in a local `.env.local` that is deliberately absent from this distributable ZIP. Do not rerun owner bootstrap if the owner already exists.
