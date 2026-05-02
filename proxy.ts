import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/privacy",
  "/terms",
  "/contact",
  "/blog",
  "/docs",
  "/sitemap.xml",
  "/robots.txt",
  "/api/auth",
  "/api/agent",
  "/api/webhooks",
  "/api/v1",
  "/api/health",
  "/api/cron",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublic) return NextResponse.next();

  // Check if session cookie exists — actual session verification happens
  // server-side in the dashboard layout via auth()
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  const hasSession = req.cookies.has(cookieName);

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Prevent caching of authenticated pages
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
