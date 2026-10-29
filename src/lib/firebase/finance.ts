import 'server-only';
import {randomUUID} from 'node:crypto';
import {adminDb} from './admin';
import {calcQuoteTotal} from '@/lib/utils';

export type QuoteLine={category:'catering'|'decoration'|'equipment'|'staffing'|'other';description:string;quantity:number;unit_price:number};
const cents=(value:number)=>Math.round(value*100);
const fromCents=(value:number)=>value/100;
const now=()=>new Date().toISOString();

export async function addQuote(eventId:string,discount:number,taxRate:number,notes:string,items:QuoteLine[]){
 const db=adminDb(),id=randomUUID(),eventRef=db.collection('events').doc(eventId),quoteRef=db.collection('quotes').doc(id);
 const subtotal=items.reduce((sum,item)=>sum+item.quantity*item.unit_price,0);
 if(discount>subtotal||subtotal<=0)throw new Error('Discount cannot exceed the subtotal.');
 const total=calcQuoteTotal(items,discount,taxRate);
 if(total<=0)throw new Error('Quotation total must be greater than zero.');
 await db.runTransaction(async tx=>{
   const ev=await tx.get(eventRef);
   if(!ev.exists)throw new Error('The selected event does not exist.');
   tx.create(quoteRef,{id,event_id:eventId,status:'draft',discount,tax_rate:taxRate,notes,total,created_at:now(),updated_at:now()});
   for(const line of items){const ref=db.collection('quote_items').doc(randomUUID());tx.create(ref,{id:ref.id,quote_id:id,...line,created_at:now()});}
   if(ev.data()?.status==='inquiry')tx.update(eventRef,{status:'quoted',updated_at:now()});
 });
 return id;
}

export async function setQuoteStatus(id:string,status:'draft'|'sent'|'accepted'|'rejected'){
 const db=adminDb(),ref=db.collection('quotes').doc(id),invoiceRef=db.collection('invoices').doc(id);
 await db.runTransaction(async tx=>{
   const [quote,invoice]=await Promise.all([tx.get(ref),tx.get(invoiceRef)]);
   if(!quote.exists)throw new Error('Quotation not found.');
   if(invoice.exists&&status!=='accepted')throw new Error('An invoiced quotation must remain accepted.');
   tx.update(ref,{status,updated_at:now()});
 });
}

export async function issueInvoice(quoteId:string,dueDate:string|null){
 const db=adminDb(),ref=db.collection('invoices').doc(quoteId),quoteRef=db.collection('quotes').doc(quoteId),counter=db.collection('counters').doc('invoices');
 await db.runTransaction(async tx=>{
   // Read every document before any write, as required by Firestore transactions.
   const [quote,existing,sequence]=await Promise.all([tx.get(quoteRef),tx.get(ref),tx.get(counter)]);
   if(!quote.exists||quote.data()?.status!=='accepted')throw new Error('Only accepted quotations can be invoiced.');
   if(existing.exists)throw new Error('This quotation already has an invoice.');
   const number=(sequence.data()?.next||0)+1;
   const date=now();
   const invoiceNo=`CF-${date.slice(0,4)}-${String(number).padStart(6,'0')}`;
   tx.set(counter,{next:number},{merge:true});
   tx.create(ref,{id:ref.id,quote_id:quoteId,event_id:quote.data()!.event_id,invoice_no:invoiceNo,amount:quote.data()!.total,paid_amount:0,status:'sent',due_date:dueDate,issued_at:date,created_at:date,updated_at:date});
 });
 return quoteId;
}

export async function recordPayment(invoiceId:string,amount:number,paidAt:string,method:string,reference:string,notes:string){
 const db=adminDb(),invoiceRef=db.collection('invoices').doc(invoiceId),paymentRef=db.collection('payments').doc(randomUUID());
 const increment=cents(amount);
 if(increment<=0)throw new Error('Payment must be at least PKR 0.01.');
 await db.runTransaction(async tx=>{
   const invoice=await tx.get(invoiceRef);
   if(!invoice.exists)throw new Error('Invoice no longer exists.');
   const value=invoice.data()!;
   if(value.status==='void')throw new Error('Cannot record a payment for a void invoice.');
   const existing=cents(Number(value.paid_amount||0)),invoiceAmount=cents(Number(value.amount));
   if(existing+increment>invoiceAmount)throw new Error('Payment exceeds the outstanding invoice balance.');
   const updated=existing+increment,status=updated===invoiceAmount?'paid':'partially_paid';
   tx.create(paymentRef,{id:paymentRef.id,invoice_id:invoiceId,amount:fromCents(increment),paid_at:paidAt,method,reference,notes,created_at:now()});
   tx.update(invoiceRef,{paid_amount:fromCents(updated),status,updated_at:now()});
 });
 return paymentRef.id;
}
