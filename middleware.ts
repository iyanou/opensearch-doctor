import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/");

  if (isPublic) return NextResponse.next();
  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
});

export const config = {
  // Run on all paths except static assets and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|.*\\.png$|.*\\.svg$).*)"],
};
