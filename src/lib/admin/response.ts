import { NextResponse } from "next/server";
import { StaffError } from "@/lib/staff/auth";
import { BatchError } from "@/lib/batch/contracts";
import { ZodError } from "zod";
export function privateResponse(value: unknown, status=200) { return NextResponse.json(value,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}}); }
export function operationFailure(error: unknown) {
  if (error instanceof StaffError || error instanceof BatchError) return privateResponse({ok:false,code:error.message},error.status);
  if (error instanceof ZodError) return privateResponse({ok:false,code:"INVALID_INPUT"},422);
  return privateResponse({ok:false,code:"OPERATION_FAILED"},500);
}
