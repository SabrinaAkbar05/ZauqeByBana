import {requireOwner} from '@/lib/auth';
import {generatePdf} from '@/lib/pdf';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 await requireOwner();
 try{const {id}=await params;const bytes=await generatePdf('invoice',id);
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Zauqe-Invoice-${id.slice(0,8)}.pdf"`,'Cache-Control':'private, no-store'}});
 }catch{return new Response('Invoice not found',{status:404});}
}
