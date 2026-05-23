import { NextResponse } from "next/server";

export function middleware(request) {
  // In a real production app, we would verify the Firebase Session Cookie here.
  // For this MVP, we are using client-side auth state for redirects, 
  // but middleware can add an extra layer of protection.
  
  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard")) {
    // Check for auth cookie (you would set this on login)
    // const session = request.cookies.get("session");
    // if (!session) return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
