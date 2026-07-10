import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only run on routes that may need auth gating. Everything else (marketing,
  // apply, interview token links, API, static assets) is served without the
  // middleware overhead.
  matcher: [
    "/login",
    "/admin/:path*",
    "/candidate/:path*",
    "/final-interview/:path*",
    "/partner/:path*",
  ],
};
