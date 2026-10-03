import { getStoreProfile } from "@/lib/store-profile";
export function GET(request: Request) { return Response.redirect(new URL(getStoreProfile().brand.icons.favicon, request.url), 307); }
