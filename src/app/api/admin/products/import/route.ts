import { privateResponse } from "@/lib/admin/response";
export async function POST() { return privateResponse({ok:false,code:"USE_APPROVED_BATCH_WORKFLOW"},410); }
