'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, updatePassword, signOut } from 'firebase/auth';
import { firebaseClientAuth } from '@/lib/firebase/client';
import { BrandLogo } from '@/components/BrandLogo';

export default function ChangePassword() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const data = new FormData(e.currentTarget);
    const oldPass = String(data.get('old') || '');
    const next = String(data.get('password') || '');
    const confirm = String(data.get('confirm') || '');

    if (next !== confirm) {
      setError('New passwords do not match.');
      setBusy(false);
      return;
    }
    if (next.length < 12) {
      setError('Use at least 12 characters.');
      setBusy(false);
      return;
    }

    const auth = firebaseClientAuth();
    try {
      const result = await signInWithEmailAndPassword(auth, String(data.get('email')), oldPass);
      await updatePassword(result.user, next);
      await signOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      setSuccess('Password updated successfully. Please sign in with your new credentials.');
      router.replace('/login');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      await signOut(auth).catch(() => {});
      setBusy(false);
    }
  }

  return (
    <main className="center-screen">
      <section className="pending-card">
        <div className="flex justify-center mb-4">
          <BrandLogo size="md" showText={true} tagline={true} />
        </div>
        <h1>Security credentials</h1>
        <p>Update your ZAUQÉ BY BANA account password to ensure workspace protection.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert">{success}</div>}

        <form onSubmit={submit} className="stack">
          <label className="field">
            <span>Account email</span>
            <input type="email" name="email" required placeholder="owner@zauqe.com" />
          </label>
          <label className="field">
            <span>Current password</span>
            <input type="password" name="old" required />
          </label>
          <label className="field">
            <span>New password</span>
            <input type="password" name="password" minLength={12} required placeholder="At least 12 characters" />
          </label>
          <label className="field">
            <span>Confirm new password</span>
            <input type="password" name="confirm" minLength={12} required />
          </label>
          <button className="btn btn-primary btn-wide" disabled={busy}>
            {busy ? 'Updating credentials…' : 'Update password'}
          </button>
          <div className="text-center mt-3">
            <Link href="/dashboard" className="text-link">
              ← Return to dashboard
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
