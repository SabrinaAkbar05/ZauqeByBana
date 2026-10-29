# CaterFlow Pro: debug a hanging sign-in

This patch only replaces `src/components/LoginForm.tsx` in your existing Firebase project. Do **not** overwrite `.env.local`, Firestore data, or owner accounts.

## Apply the change

1. Open the CaterFlow Pro folder in VS Code.
2. Replace **`src/components/LoginForm.tsx`** with the enclosed file.
3. Stop Next.js with **Ctrl+C**.
4. Start it again with **`npm run dev`** (if necessary, delete the `.next` folder first).
5. In your browser hard-refresh the page with **Ctrl+Shift+R**, then try the login.

## What the new sign-in status means

- **Verifying account with Firebase…**: browser is waiting for Firebase Authentication (check whether Email/Password is enabled, Firebase config, Network requests to `identitytoolkit.googleapis.com`). A 20-second timeout reveals stalled requests.
- **Preparing secure session…**: the browser is waiting for an ID token.
- **Creating your workspace session…**: browser is waiting for `POST /api/auth/session` (check terminal, Firebase Admin credentials and `profiles/{uid}`). A 20-second AbortController cancels stalled HTTP requests.
- **Opening dashboard…**: the server session was created; dashboard page loading is next.

The patch reports an error in the UI and Console when a step fails, rather than leaving the button stuck forever. The timeout does not diagnose the underlying cause by itself.

## Inspect Next.js's separate red `1 Issue` badge

Click the badge and save the error text or screenshot. It may be a React hydration error unrelated to Firebase. Also open Developer Tools (F12) → Console and Network. Filter Network for `identitytoolkit` and `session` and look at status codes and pending requests. **Never share passwords, Firebase ID tokens, or the private key**.

## Verify owner setup

- Firebase Console → Authentication → Users: email/password user exists.
- Firebase Console → Firestore → `profiles` → document ID must exactly equal the Auth UID, and fields `role: "owner"` and `status: "active"` must exist.
- If you haven't run owner setup, see the original `FIREBASE_SETUP_STEPS.md`. Never recreate owner accounts blindly.

## Security

The patch does not change access rules, payments, or Firestore data. The client gets an ID token, sends it via HTTPS (localhost during development) to the server session route, and navigates only after the server confirms the session cookie.
