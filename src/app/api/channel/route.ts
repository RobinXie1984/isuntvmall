import { publicChannelResponse } from "@/lib/owned-channel/server";
export const dynamic = "force-dynamic";
export async function GET() { return publicChannelResponse(); }
