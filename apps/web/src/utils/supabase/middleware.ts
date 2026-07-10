import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthUserId } from "@/lib/auth/session";

const ADMIN_PUBLIC = ["/admin/login"];
const CANDIDATE_PUBLIC = ["/candidate/login", "/candidate/signup"];

function isCandidateTokenRoute(pathname: string) {
  return /^\/candidate\/[^/]+$/.test(pathname) && !CANDIDATE_PUBLIC.includes(pathname);
}

function redirectTo(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  return NextResponse.redirect(url);
}

/** Routes that require auth gating. Everything else (marketing, apply, interview
 * token links, static) skips the Supabase round-trip entirely for speed. */
function needsAuthCheck(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/admin")) return true;
  // Candidate profile + auth pages need gating; the interview token route
  // (`/candidate/<token>`) is public and handled without an auth lookup.
  if (pathname === "/candidate/profile") return true;
  if (pathname === "/candidate/login" || pathname === "/candidate/signup") return true;
  return false;
}

async function getSessionProfile(supabase: ReturnType<typeof createServerClient>) {
  const userId = await getAuthUserId(supabase);
  if (!userId) return { userId: null, accountType: null as string | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();

  return { userId, accountType: profile?.account_type ?? null };
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Legacy portals merged into admin
  if (pathname.startsWith("/final-interview") || pathname.startsWith("/partner")) {
    if (pathname.endsWith("/login")) return redirectTo(request, "/admin/login");
    if (pathname.includes("/candidates/")) {
      const id = pathname.split("/candidates/")[1]?.split("/")[0];
      if (id) return redirectTo(request, `/admin/candidates/${id}`);
    }
    return redirectTo(request, "/admin/candidates");
  }

  // Fast path: public routes never hit Supabase from middleware.
  if (!needsAuthCheck(pathname)) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { userId, accountType } = await getSessionProfile(supabase);

  if (pathname.startsWith("/admin")) {
    const isPublic = ADMIN_PUBLIC.some((p) => pathname === p);
    if (!isPublic && !userId) {
      return redirectTo(request, "/admin/login");
    }
    if (!isPublic && accountType && accountType !== "org_admin") {
      if (accountType === "candidate") return redirectTo(request, "/candidate/profile");
      return redirectTo(request, "/admin/login");
    }
    if (pathname === "/admin/login" && userId && accountType === "org_admin") {
      return redirectTo(request, "/admin");
    }
  }

  if (pathname.startsWith("/candidate")) {
    const isPublic =
      CANDIDATE_PUBLIC.includes(pathname) || isCandidateTokenRoute(pathname);
    if (pathname === "/candidate/profile" && !userId) {
      return redirectTo(request, "/candidate/login");
    }
    if (
      (pathname === "/candidate/login" || pathname === "/candidate/signup") &&
      userId &&
      accountType === "candidate"
    ) {
      return redirectTo(request, "/candidate/profile");
    }
    if (pathname === "/candidate/profile" && accountType === "org_admin") {
      return redirectTo(request, "/admin");
    }
    if (!isPublic && pathname.startsWith("/candidate/") && !userId) {
      return redirectTo(request, "/candidate/login");
    }
  }

  if (pathname === "/login" && userId) {
    if (accountType === "org_admin") return redirectTo(request, "/admin");
    if (accountType === "candidate") return redirectTo(request, "/candidate/profile");
  }

  return supabaseResponse;
}
