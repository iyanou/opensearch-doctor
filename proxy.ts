import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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

  // NextAuth v5 encrypts JWTs (JWE) — must pass salt for correct decryption
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    salt: process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token",
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Prevent browsers and CDNs from caching authenticated page responses.
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

export const config = {
  // Exclude Next.js internals and all static assets (images, fonts, SVGs, icons)
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
