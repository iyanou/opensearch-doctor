import { NextResponse } from "next/server";

// Email/password signup is disabled — authentication is Google OAuth only.
export async function POST() {
  return NextResponse.json({ error: "Sign up via Google OAuth" }, { status: 410 });
}
