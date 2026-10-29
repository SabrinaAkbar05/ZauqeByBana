/** One-time owner bootstrap. Run with: node --env-file=.env.local scripts/bootstrap-owner.mjs */
import {initializeApp,cert,applicationDefault,getApps} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';

const projectId=process.env.FIREBASE_PROJECT_ID||process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail=process.env.FIREBASE_CLIENT_EMAIL;
const privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,'\n');
const email=process.env.OWNER_EMAIL?.trim().toLowerCase();
const password=process.env.OWNER_PASSWORD;
const fullName=process.env.OWNER_NAME?.trim()||'Business Owner';
if(!projectId||!email||!password||password.length<12){
  console.error('Set FIREBASE_PROJECT_ID, OWNER_EMAIL and OWNER_PASSWORD (12+ characters) in .env.local');process.exit(1);
}
if(!getApps().length)initializeApp({projectId,credential:clientEmail&&privateKey?cert({projectId,clientEmail,privateKey}):applicationDefault()});
const db=getFirestore(),auth=getAuth();
const existingOwners=await db.collection('profiles').where('role','==','owner').limit(1).get();
if(!existingOwners.empty){
  console.error('An owner already exists. Refusing to add/promote another owner.');process.exit(1);
}
let user,created=false;
try{user=await auth.getUserByEmail(email);}
catch(e){if(e.code!=='auth/user-not-found')throw e;user=await auth.createUser({email,password,displayName:fullName});created=true;}
const prior=await db.collection('profiles').doc(user.uid).get();
if(prior.exists){console.error('A profile for this user already exists. Owner bootstrapping aborted.');process.exit(1);}
const now=new Date().toISOString();
const batch=db.batch();
batch.create(db.collection('profiles').doc(user.uid),{id:user.uid,full_name:fullName,email,role:'owner',status:'active',created_at:now,updated_at:now});
const businessRef=db.collection('businesses').doc('main');
if(!(await businessRef.get()).exists)batch.create(businessRef,{id:'main',name:process.env.BUSINESS_NAME||'ZAUQÉ BY BANA',phone:'',email,address:'',currency:'PKR',created_at:now,updated_at:now});
await batch.commit();
console.log(`Owner created successfully: ${email} (${user.uid})`);
console.log('Remove OWNER_PASSWORD from .env.local after the bootstrap and keep the Firebase service account secret.');
