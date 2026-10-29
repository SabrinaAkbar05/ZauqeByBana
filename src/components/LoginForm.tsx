'use client';

import { useState, type FormEvent } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ArrowRight } from 'lucide-react';
import { firebaseClientAuth } from '@/lib/firebase/client';

/** A slow/unreachable Firebase service must not leave the form loading forever. */
async function withTimeout<T>(promise: Promise<T>, step: string, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${step} timed out after ${Math.round(milliseconds / 1000)} seconds. Check your connection and the browser Network tab.`)),
          milliseconds,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function readableLoginError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (/auth\/(invalid-credential|wrong-password|user-not-found|invalid-login-credentials)/i.test(text)) {
    return 'Incorrect email or password. Use the account and password created for this Firebase project.';
  }
  if (/auth\/operation-not-allowed/i.test(text)) {
    return 'Email/Password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.';
  }
  if (/auth\/(invalid-api-key|api-key-not-valid)/i.test(text)) {
    return 'Firebase API key is invalid. Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local, then restart the development server.';
  }
  if (/auth\/(network-request-failed|timeout)/i.test(text)) {
    return 'Cannot reach Firebase Authentication. Check the browser Network tab, your connection, and any VPN or firewall.';
  }
  if (/auth\/too-many-requests/i.test(text)) {
    return 'Too many attempts. Please try again later.';
  }
  if (/AbortError/i.test(text)) {
    return 'Session creation timed out. Check the terminal running npm run dev and the Network request /api/auth/session.';
  }
  return text;
}

export function LoginForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    setError('');
    setBusy(true);
    setProgress('Checking Firebase configuration…');
    let auth: ReturnType<typeof firebaseClientAuth> | undefined;
    let step = 'Firebase initialization';

    try {
      auth = firebaseClientAuth();
      step = 'Firebase email/password authentication';
      setProgress('Verifying account with Firebase…');
      // Never print email/password or ID tokens in the browser console.
      console.info('[Zauqe login] Starting Firebase sign-in');
      const credentials = await withTimeout(signInWithEmailAndPassword(auth, email, password), step, 20000);

      step = 'Retrieving Firebase ID token';
      setProgress('Preparing secure session…');
      const idToken = await withTimeout(credentials.user.getIdToken(), step, 10000);

      step = 'Creating server session';
      setProgress('Creating your workspace session…');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      let response: Response;
      try {
        response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ idToken }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) {
        throw new Error(payload?.error || `Session endpoint failed (HTTP ${response.status}). Check npm run dev terminal.`);
      }

      step = 'Opening dashboard';
      setProgress('Opening dashboard…');
      // Firebase client login is only used to obtain the ID token. App access uses
      // the HttpOnly server session cookie, so clear the temporary client session.
      await withTimeout(signOut(auth), 'Finishing Firebase sign-in', 5000).catch((signoutError) => {
        console.warn('[Zauqe login] Client sign-out cleanup:', signoutError);
      });
      // Full navigation makes the freshly set HttpOnly session cookie visible to
      // the server components on the next page request.
      window.location.replace('/dashboard');
    } catch (err) {
      console.error(`[Zauqe login] Failed during: ${step}`, err);
      setError(readableLoginError(err));
      // Best effort only — never let cleanup freeze the form again.
      if (auth) void signOut(auth).catch(() => {});
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  return <>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    <form onSubmit={onSubmit} className="stack">
      <label className="field">
        <span>Email address</span>
        <input type="email" name="email" placeholder="owner@zauqe.com" required autoComplete="email" />
      </label>
      <label className="field">
        <span>Password</span>
        <input type="password" name="password" minLength={6} required autoComplete="current-password" />
      </label>
      <button disabled={busy} className="btn btn-primary btn-wide" type="submit">
        {busy ? progress || 'Signing in…' : 'Sign in securely'} <ArrowRight size={17} />
      </button>
    </form>
  </>;
}
