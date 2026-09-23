import { NextResponse } from "next/server";
import { isAdminRequest, isSameOriginRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/http";
import { kolInputSchema } from "@/lib/ingest/kols";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return errorResponse(null,"Invalid request origin.",403);
 if(!isAdminRequest(request))return errorResponse(null,"Admin sign-in required.",401);
 try {
  const input=kolInputSchema.parse(await request.json());
  const {data,error}=await getSupabaseAdmin().from("kols").upsert({slug:input.slug,display_name:input.displayName,bio:input.bio,status:input.status},{onConflict:"slug"}).select("id, slug").single();
  if(error)throw new Error("Host could not be saved.");
  return NextResponse.json({ok:true,kol:data});
 }catch(error){return errorResponse(error,"Host could not be saved.");}
}
