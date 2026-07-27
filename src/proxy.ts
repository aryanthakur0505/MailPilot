// ==================================================
// MailPilot — Proxy (Route Protection)
// ==================================================
// Next.js 16+ uses proxy.ts instead of middleware.ts.
// Protects dashboard routes — redirects unauthenticated
// users to the login page.

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
