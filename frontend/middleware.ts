import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/adminAuth";

const protectedRoutes = ["/analytics", "/shop-analytics", "/ecommerce-analytics", "/domestic-analytics"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const hasAccess = request.cookies.get(AUTH_COOKIE_NAME)?.value === "true";
  if (hasAccess) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/analytics/:path*", "/shop-analytics/:path*", "/ecommerce-analytics/:path*", "/domestic-analytics/:path*"],
};
