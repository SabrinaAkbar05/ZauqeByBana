import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {adminAuth,adminDb} from '@/lib/firebase/admin';
import {dataClient} from '@/lib/firebase/data';

export type AccessRole='owner'|'staff';
export type Profile={id:string;full_name:string|null;email:string;role:AccessRole;status:'active'|'pending'|'disabled';created_at:string};

export async function requireUser(){
  const cookie=(await cookies()).get('caterflow_session')?.value;
  if(!cookie)redirect('/login');
  let uid='';
  try{uid=(await adminAuth().verifySessionCookie(cookie,true)).uid;}
  catch{redirect('/login');}
  const snapshot=await adminDb().collection('profiles').doc(uid).get();
  const profile=snapshot.exists?({...snapshot.data(),id:snapshot.id} as Profile):null;
  if(!profile || profile.status!=='active') redirect('/pending');
  if(profile.role!=='owner' && profile.role!=='staff')redirect('/pending');
  return {db:dataClient(),user:{id:uid},profile};
}
export async function requireOwner(){
  const context=await requireUser();
  if(context.profile.role!=='owner')redirect('/dashboard');
  return context;
}
