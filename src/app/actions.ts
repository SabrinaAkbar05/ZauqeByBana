'use server';
import {cookies} from 'next/headers';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {adminAuth,adminDb} from '@/lib/firebase/admin';
import {addQuote,setQuoteStatus,issueInvoice,recordPayment} from '@/lib/firebase/finance';
import {requireOwner,requireUser} from '@/lib/auth';
import {errorMessage} from '@/lib/utils';

const str=(fd:FormData,key:string)=>String(fd.get(key)??'').trim();
const optional=(v:string)=>v||null;
const uuid=z.uuid();
const name=z.string().trim().min(2).max(160);
const amount=z.coerce.number().finite().nonnegative().max(99999999999);
const positiveAmount=z.coerce.number().finite().positive().max(99999999999);
const day=z.iso.date();
function done(path:string,note:string):never{revalidatePath('/','layout');redirect(`${path}?ok=${encodeURIComponent(note)}`);}
function fail(path:string,e:unknown):never{
  if(e&&typeof e==='object'&&'digest' in e&&String(e.digest).startsWith('NEXT_REDIRECT'))throw e;
  redirect(`${path}?error=${encodeURIComponent(errorMessage(e))}`);
}
function must<T>(result:{data?:T|null;error:{message:string}|null}):T{
  if(result.error)throw new Error(result.error.message);
  return result.data as T;
}

export async function signOut(){
  (await cookies()).delete('caterflow_session');
  redirect('/login');
}
export async function createCustomer(formData:FormData){
  const path='/customers';
  try{
    const {db}=await requireUser();
    const payload=z.object({full_name:name,phone:z.string().min(6).max(40),email:z.union([z.email(),z.literal('')]),address:z.string().max(350),notes:z.string().max(1500)}).parse({
      full_name:str(formData,'full_name'),phone:str(formData,'phone'),email:str(formData,'email'),address:str(formData,'address'),notes:str(formData,'notes')
    });
    must(await db.from('customers').insert({...payload,email:optional(payload.email)}));
  }catch(e){fail(path,e);}
  done(path,'Customer added');
}
export async function updateCustomer(formData:FormData){
  const id=str(formData,'id'),path=`/customers/${id}`;
  try{
    const {db}=await requireUser();
    const payload=z.object({id:uuid,full_name:name,phone:z.string().min(6).max(40),email:z.union([z.email(),z.literal('')]),address:z.string().max(350),notes:z.string().max(1500)}).parse({
      id,full_name:str(formData,'full_name'),phone:str(formData,'phone'),email:str(formData,'email'),address:str(formData,'address'),notes:str(formData,'notes')
    });
    must(await db.from('customers').update({full_name:payload.full_name,phone:payload.phone,email:optional(payload.email),address:payload.address,notes:payload.notes}).eq('id',id));
  }catch(e){fail(path,e);}
  done(path,'Customer updated');
}
export async function createEvent(formData:FormData){
  const path='/events';
  try{
    const {db}=await requireUser();
    const payload=z.object({customer_id:uuid,title:name,event_type:name,event_date:day,venue:name,guest_count:z.coerce.number().int().min(1).max(100000),notes:z.string().max(3000)}).parse({
      customer_id:str(formData,'customer_id'),title:str(formData,'title'),event_type:str(formData,'event_type'),event_date:str(formData,'event_date'),venue:str(formData,'venue'),guest_count:str(formData,'guest_count'),notes:str(formData,'notes')
    });
    must(await db.from('events').insert({...payload,start_time:optional(str(formData,'start_time')),end_time:optional(str(formData,'end_time'))}));
  }catch(e){fail(path,e);}
  done(path,'Event created');
}
export async function updateEvent(formData:FormData){
  const id=str(formData,'id'),path=`/events/${id}`;
  try{
    const {db}=await requireUser();
    const payload=z.object({id:uuid,title:name,event_type:name,event_date:day,venue:name,guest_count:z.coerce.number().int().min(1).max(100000),status:z.enum(['inquiry','quoted','confirmed','in_progress','completed','cancelled']),notes:z.string().max(3000)}).parse({
      id,title:str(formData,'title'),event_type:str(formData,'event_type'),event_date:str(formData,'event_date'),venue:str(formData,'venue'),guest_count:str(formData,'guest_count'),status:str(formData,'status'),notes:str(formData,'notes')
    });
    must(await db.from('events').update({...payload,start_time:optional(str(formData,'start_time')),end_time:optional(str(formData,'end_time'))}).eq('id',id));
  }catch(e){fail(path,e);}
  done(path,'Event updated');
}
export async function createPackage(formData:FormData){
  const path='/packages';
  try{
    const {db}=await requireOwner();
    const data=z.object({name:name,category:z.enum(['catering','decoration','equipment','staffing','other']),description:z.string().max(2000),price_per_person:amount}).parse({
      name:str(formData,'name'),category:str(formData,'category'),description:str(formData,'description'),price_per_person:str(formData,'price_per_person')
    });
    must(await db.from('packages').insert(data));
  }catch(e){fail(path,e);}
  done(path,'Package saved');
}
export async function updatePackage(formData:FormData){
  const id=str(formData,'id'),path=`/packages/${id}`;
  try{
    const {db}=await requireOwner();
    const data=z.object({id:uuid,name:name,category:z.enum(['catering','decoration','equipment','staffing','other']),description:z.string().max(2000),price_per_person:amount,active:z.enum(['true','false'])}).parse({
      id,name:str(formData,'name'),category:str(formData,'category'),description:str(formData,'description'),price_per_person:str(formData,'price_per_person'),active:str(formData,'active')
    });
    must(await db.from('packages').update({name:data.name,category:data.category,description:data.description,price_per_person:data.price_per_person,active:data.active==='true'}).eq('id',id));
  }catch(e){fail(path,e);}
  done(path,'Package updated');
}
export async function createQuote(formData:FormData){
  const path='/quotes';
  try{
    await requireOwner();
    const lineSchema=z.object({category:z.enum(['catering','decoration','equipment','staffing','other']),description:name,quantity:positiveAmount,unit_price:amount});
    const lines=z.array(lineSchema).min(1).max(80).parse(JSON.parse(str(formData,'items_json')));
    const values=z.object({event_id:uuid,discount:amount,tax_rate:z.coerce.number().finite().min(0).max(100),notes:z.string().max(2000)}).parse({
      event_id:str(formData,'event_id'),discount:str(formData,'discount')||'0',tax_rate:str(formData,'tax_rate')||'0',notes:str(formData,'notes')
    });
    await addQuote(values.event_id,values.discount,values.tax_rate,values.notes,lines);
  }catch(e){fail(path,e);}
  done(path,'Quotation created');
}
export async function changeQuoteStatus(formData:FormData){
  const path='/quotes';
  try{
    await requireOwner();
    const id=uuid.parse(str(formData,'id'));
    const status=z.enum(['draft','sent','accepted','rejected']).parse(str(formData,'status'));
    await setQuoteStatus(id,status);
  }catch(e){fail(path,e);}
  done(path,'Quotation status updated');
}
export async function createInvoice(formData:FormData){
  const path='/invoices';
  try{
    await requireOwner();
    const id=uuid.parse(str(formData,'quote_id'));
    const due=optional(str(formData,'due_date'));
    if(due)day.parse(due);
    await issueInvoice(id,due);
  }catch(e){fail(path,e);}
  done(path,'Invoice issued');
}
export async function createPayment(formData:FormData){
  const path='/payments';
  try{
    await requireOwner();
    const data=z.object({invoice_id:uuid,amount:positiveAmount,paid_at:day,method:name,reference:z.string().max(120),notes:z.string().max(500)}).parse({
      invoice_id:str(formData,'invoice_id'),amount:str(formData,'amount'),paid_at:str(formData,'paid_at'),method:str(formData,'method'),reference:str(formData,'reference'),notes:str(formData,'notes')
    });
    await recordPayment(data.invoice_id,data.amount,data.paid_at,data.method,data.reference,data.notes);
  }catch(e){fail(path,e);}
  done(path,'Payment recorded');
}
export async function createExpense(formData:FormData){
  const path='/expenses';
  try{
    const {db}=await requireOwner();
    const data=z.object({event_id:uuid,category:z.enum(['food','decoration','labor','transport','rental','other']),description:name,vendor_name:z.string().max(200),amount:positiveAmount,incurred_at:day}).parse({
      event_id:str(formData,'event_id'),category:str(formData,'category'),description:str(formData,'description'),vendor_name:str(formData,'vendor_name'),amount:str(formData,'amount'),incurred_at:str(formData,'incurred_at')
    });
    must(await db.from('expenses').insert(data));
  }catch(e){fail(path,e);}
  done(path,'Expense recorded');
}
/** Staff accounts are provisioned by the owner; no email invitation is implied. */
export async function createStaff(formData:FormData){
  const path='/team';
  try{
    await requireOwner();
    const email=z.email().parse(str(formData,'email').toLowerCase());
    const full_name=name.parse(str(formData,'full_name'));
    const password=z.string().min(12).max(128).parse(str(formData,'password'));
    const auth=adminAuth();
    const record=await auth.createUser({email,password,displayName:full_name,emailVerified:false,disabled:false});
    try{
      const now=new Date().toISOString();
      await adminDb().collection('profiles').doc(record.uid).create({id:record.uid,email,full_name,role:'staff',status:'active',created_at:now,updated_at:now});
    }catch(e){await auth.deleteUser(record.uid);throw e;}
  }catch(e){fail(path,e);}
  done(path,'Staff account created. Share credentials securely and ask the employee to change their password.');
}
export async function setStaffStatus(formData:FormData){
  const path='/team';
  try{
    const {user}=await requireOwner();
    const id=z.string().min(8).max(160).parse(str(formData,'id'));
    const status=z.enum(['active','disabled']).parse(str(formData,'status'));
    if(id===user.id)throw new Error('You cannot change your own access.');
    const ref=adminDb().collection('profiles').doc(id);
    const snapshot=await ref.get();
    if(!snapshot.exists||snapshot.data()?.role!=='staff')throw new Error('Only staff accounts can be changed.');
    await adminAuth().updateUser(id,{disabled:status==='disabled'});
    if(status==='disabled')await adminAuth().revokeRefreshTokens(id);
    await ref.update({status,updated_at:new Date().toISOString()});
  }catch(e){fail(path,e);}
  done(path,'Staff access updated');
}
export async function updateBusiness(formData:FormData){
  const path='/settings';
  try{
    const {db}=await requireOwner();
    const data=z.object({name:name,phone:z.string().max(60),email:z.union([z.email(),z.literal('')]),address:z.string().max(500)}).parse({
      name:str(formData,'name'),phone:str(formData,'phone'),email:str(formData,'email'),address:str(formData,'address')
    });
    must(await db.from('businesses').update({...data,email:optional(data.email)}).eq('id','main'));
  }catch(e){fail(path,e);}
  done(path,'Company details updated');
}
