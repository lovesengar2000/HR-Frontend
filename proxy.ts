import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ── Paths that never require authentication ─────────────── */
const PUBLIC_PATHS = [
  "/",
  "/api",
  "/landing",
  "/faq",
  "/login",
  "/register",
  "/forgotPassword",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("authToken")?.value;

  /* 1. Always allow public paths through */
  if (isPublic(pathname)) {
    /* Already logged in — skip login/register/landing, go to dashboard */
    if (
      token &&
      (pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/landing") ||
        pathname === "/")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  /* 2. Protected path — no token → back to landing */
  if (!token) {
    return NextResponse.redirect(new URL("/landing", request.url));
  }

  return NextResponse.next();
}

/* Run on every route except Next.js internals and static files */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)).*)",
  ],
};
