'use client';

import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

export function firebaseClientAuth() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value || value.startsWith('YOUR_PROJECT'))
    .map(([key]) => `NEXT_PUBLIC_FIREBASE_${({
      apiKey: 'API_KEY', authDomain: 'AUTH_DOMAIN', projectId: 'PROJECT_ID',
      storageBucket: 'STORAGE_BUCKET', appId: 'APP_ID', messagingSenderId: 'MESSAGING_SENDER_ID',
    } as Record<string, string>)[key]}`);
  if (missing.length) {
    throw new Error(`Firebase configuration missing: ${missing.join(', ')}. Update .env.local and restart npm run dev.`);
  }
  return getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig));
}
