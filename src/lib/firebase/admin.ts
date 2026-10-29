import 'server-only';
import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function firebaseAdminApp(): App {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not set');
  if ((email && !privateKey) || (privateKey && !email)) throw new Error('Both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required');
  return initializeApp({
    projectId,
    credential: email && privateKey ? cert({projectId,clientEmail:email,privateKey}) : applicationDefault()
  });
}
export const adminAuth = () => getAuth(firebaseAdminApp());
export const adminDb = () => getFirestore(firebaseAdminApp());
export const adminStorage = () => getStorage(firebaseAdminApp());
