import 'server-only';
import {randomUUID} from 'node:crypto';
import {adminDb} from './admin';

/** Phase 1 single-company data access. All calls execute on trusted Next.js server only. */
type Row={id:string;[field:string]:any};
type Table='businesses'|'profiles'|'customers'|'events'|'packages'|'quotes'|'quote_items'|'invoices'|'payments'|'expenses';
type Failure={message:string};
type Result<T>={data:T|null;error:Failure|null;count:number|null};
const ok=<T>(data:T,count:number|null=null):Result<T>=>({data,error:null,count});
const err=<T>(error:unknown):Result<T>=>({data:null,error:{message:error instanceof Error?error.message:'Database request failed'},count:null});
type Condition={kind:'eq'|'neq'|'in';field:string;value:unknown};

class Query {
  private conditions:Condition[]=[];
  private sortField?:string;
  private sortAsc=true;
  private take?:number;
  private head=false;
  constructor(private table:Table,private fields='*',private updates?:Record<string,unknown>){ }
  eq(field:string,value:unknown){this.conditions.push({kind:'eq',field,value});return this;}
  neq(field:string,value:unknown){this.conditions.push({kind:'neq',field,value});return this;}
  in(field:string,values:unknown[]){this.conditions.push({kind:'in',field,value:values});return this;}
  order(field:string,{ascending=true}:{ascending?:boolean}={}){this.sortField=field;this.sortAsc=ascending;return this;}
  limit(value:number){this.take=value;return this;}
  private match(row:Row){return this.conditions.every(c=>{
    const value=row[c.field];
    return c.kind==='eq'?value===c.value:c.kind==='neq'?value!==c.value:Array.isArray(c.value)&&c.value.includes(value);
  });}
  private async hydrate(rows:Row[]){
    // Specific requested joins are assembled server-side from Firestore reference IDs.
    const needs=(collection:string)=>this.fields.includes(collection+'(');
    return Promise.all(rows.map(async row=>{
      const hydrated={...row};
      if(this.table==='events' && needs('customers') && row.customer_id){
        const snap=await adminDb().collection('customers').doc(row.customer_id).get();
        hydrated.customers=snap.exists?{id:snap.id,...snap.data()}:null;
      }
      if(['quotes','invoices','expenses'].includes(this.table) && needs('events') && row.event_id){
        const snap=await adminDb().collection('events').doc(row.event_id).get();
        hydrated.events=snap.exists?{id:snap.id,...snap.data()}:null;
      }
      if(this.table==='payments' && needs('invoices') && row.invoice_id){
        const snap=await adminDb().collection('invoices').doc(row.invoice_id).get();
        hydrated.invoices=snap.exists?{id:snap.id,...snap.data()}:null;
      }
      if(this.table==='quotes' && needs('quote_items')){
        const snap=await adminDb().collection('quote_items').where('quote_id','==',row.id).get();
        hydrated.quote_items=snap.docs.map(d=>({id:d.id,...d.data()}));
      }
      return hydrated;
    }));
  }
  private async execute():Promise<Result<Row[]>>{
    try{
      const store=adminDb();
      if(this.updates){
        const docId=this.conditions.find(c=>c.kind==='eq'&&c.field==='id')?.value;
        if(typeof docId!=='string'||!docId)throw new Error('An exact document ID is required for updates.');
        if(!this.match({id:docId}))throw new Error('Invalid update filter.');
        await store.collection(this.table).doc(docId).update({...this.updates,updated_at:new Date().toISOString()});
        return ok([]);
      }
      // This starter deliberately loads each small single-business collection before filtering.
      // Replace with indexed Firestore queries and pagination when data volumes increase.
      let rows:Row[];
      const id=this.conditions.find(c=>c.field==='id' && c.kind==='eq')?.value;
      if(typeof id==='string'){
        const doc=await store.collection(this.table).doc(id).get();
        rows=doc.exists?[{id:doc.id,...doc.data()}]:[];
      }else{
        const snapshot=await store.collection(this.table).get();
        rows=snapshot.docs.map(d=>({id:d.id,...d.data()}));
      }
      rows=rows.filter(r=>this.match(r));
      if(this.sortField){const f=this.sortField,ascending=this.sortAsc;rows.sort((a,b)=>{
        const x=a[f],y=b[f];
        const comp=x==null?(y==null?0:-1):y==null?1:typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y));
        return comp*(ascending?1:-1);
      });}
      const count=rows.length;
      if(this.take!==undefined)rows=rows.slice(0,this.take);
      if(this.head)return ok([],count);
      return ok(await this.hydrate(rows),count);
    }catch(e){return err(e);}
  }
  async single():Promise<Result<Row>>{
    const result=await this.execute();
    if(result.error)return err(result.error.message);
    if(result.data?.length!==1)return err('Expected exactly one record.');
    return ok(result.data[0]);
  }
  async maybeSingle():Promise<Result<Row | null>>{
    const result=await this.execute();
    if(result.error)return err(result.error.message);
    if((result.data?.length||0)>1)return err('Expected at most one record.');
    return ok(result.data?.[0]||null);
  }
  then<TResult1=Result<Row[]>,TResult2=never>(
    onfulfilled?:((value:Result<Row[]>)=>TResult1|PromiseLike<TResult1>)|null,
    onrejected?:((reason:unknown)=>TResult2|PromiseLike<TResult2>)|null
  ):Promise<TResult1|TResult2>{return this.execute().then(onfulfilled,onrejected);}
}

export function dataClient(){return {
  from(table:Table){return {
    select(fields='*',options?:{head?:boolean;count?:'exact'}){
      const query=new Query(table,fields);
      if(options?.head)(query as any).head=true;
      return query;
    },
    async insert(value:Record<string,unknown>):Promise<Result<Row>>{
      try{
        if(table==='invoices'||table==='quotes'||table==='payments'||table==='quote_items'||table==='profiles')throw new Error('Use the dedicated secure workflow for this collection.');
        const id=randomUUID();const now=new Date().toISOString();
        if(table==='events'){
          const id=value.customer_id;
          if(typeof id!=='string'||!(await adminDb().collection('customers').doc(id).get()).exists)throw new Error('Customer no longer exists.');
        }
        if(table==='expenses'){
          const id=value.event_id;
          if(typeof id!=='string'||!(await adminDb().collection('events').doc(id).get()).exists)throw new Error('Event no longer exists.');
        }
        const payload={...value,id,created_at:now,updated_at:now,...(table==='events'?{status:'inquiry'}:{}),...(table==='packages'?{active:true}:{})};
        await adminDb().collection(table).doc(id).create(payload);
        return ok(payload);
      }catch(e){return err(e);}
    },
    update(values:Record<string,unknown>){
      if(['invoices','payments','quote_items','quotes','profiles'].includes(table))throw new Error('This collection requires a dedicated workflow.');
      return new Query(table,'*',values);
    }
  };}
};}
