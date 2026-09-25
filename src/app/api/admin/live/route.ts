import { requireStaff } from "@/lib/staff/auth";
import { getLiveDrafts } from "@/lib/live/operations";
import { privateResponse,operationFailure } from "@/lib/admin/response";
import { z } from "zod";
export async function GET(request:Request){try{const staff=await requireStaff(request);const page=z.coerce.number().int().min(0).max(10000).parse(new URL(request.url).searchParams.get("page")||0);return privateResponse(await getLiveDrafts(staff,page));}catch(error){return operationFailure(error);}}
export async function POST(){return privateResponse({ok:false,code:"USE_VERSIONED_LIVE_WORKFLOW"},410);}
