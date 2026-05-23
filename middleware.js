import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // We only care about dashboard routes for this MVP
  if (path.startsWith("/dashboard")) {
    // In production, you'd check for a 'session' cookie here.
    // For now, the client-side AuthProvider handles the heavy lifting,
    // but we can add a placeholder for future server-side verification.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
