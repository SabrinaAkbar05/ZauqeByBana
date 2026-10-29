import {NextResponse,type NextRequest} from 'next/server';
import {adminAuth,adminDb} from '@/lib/firebase/admin';
export const runtime='nodejs';
const SESSION_MS=5*24*60*60*1000;
const cookieName='caterflow_session';
function sameOrigin(req:NextRequest){
  const origin=req.headers.get('origin');
  return !!origin && new URL(origin).host===req.nextUrl.host && new URL(origin).protocol===req.nextUrl.protocol;
}
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});
  try{
    const {idToken}=await req.json() as {idToken?:string};
    if(!idToken||typeof idToken!=='string'||idToken.length>15000)throw new Error('Missing sign-in token');
    const decoded=await adminAuth().verifyIdToken(idToken,true);
    if(Date.now()/1000-decoded.auth_time>5*60)throw new Error('Recent sign-in required');
    const doc=await adminDb().collection('profiles').doc(decoded.uid).get();
    if(!doc.exists || doc.data()?.status!=='active'||!['owner','staff'].includes(doc.data()?.role)){
      return NextResponse.json({error:'This account has not been activated by the owner.'},{status:403});
    }
    const cookie=await adminAuth().createSessionCookie(idToken,{expiresIn:SESSION_MS});
    const response=NextResponse.json({ok:true});
    response.cookies.set(cookieName,cookie,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_MS/1000});
    return response;
  }catch{
    return NextResponse.json({error:'Unable to sign in. Check your credentials or account access.'},{status:401});
  }
}
export async function DELETE(req:NextRequest){
  if(!sameOrigin(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});
  const response=NextResponse.json({ok:true});
  response.cookies.set(cookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
  return response;
}
