import { requireStaff, requireStaffOrigin } from "@/lib/staff/auth";
import { readStaffJson, staffFailure, staffResponse } from "@/lib/staff/http";
import { getLiveOperationsDetail, runLiveAction } from "@/lib/live/operations";
import { liveActionSchema } from "@/lib/live/operations-schema";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return staffResponse({ ok: true, ...await getLiveOperationsDetail((await params).id, await requireStaff(request)) }); }
  catch (error) { return staffFailure(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireStaffOrigin(request); const staff = await requireStaff(request);
    const action = liveActionSchema.parse(await readStaffJson(request, 24576));
    return staffResponse({ ok: true, ...await runLiveAction((await params).id, staff, action) });
  } catch (error) { return staffFailure(error); }
}
