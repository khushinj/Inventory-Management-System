import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ACCESS_CONTROLLED_ROUTE_PREFIXES,
  AUTH_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
  getDefaultRouteForRole,
  isRole,
  isRouteAllowedForRole,
} from "@/lib/adminAuth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAccessControlledRoute = ACCESS_CONTROLLED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isAccessControlledRoute) {
    return NextResponse.next();
  }

  const hasAccess = request.cookies.get(AUTH_COOKIE_NAME)?.value === "true";
  const roleValue = request.cookies.get(AUTH_ROLE_COOKIE_NAME)?.value ?? "";

  if (!hasAccess || !isRole(roleValue)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isRouteAllowedForRole(pathname, roleValue)) {
    const allowedUrl = new URL(getDefaultRouteForRole(roleValue), request.url);
    return NextResponse.redirect(allowedUrl);
  }

  const isInventoryEditRoute =
    pathname.startsWith("/shop-inventory/edit/") ||
    pathname.startsWith("/domestic-inventory/edit/") ||
    pathname.startsWith("/online-inventory/edit/");

  if (isInventoryEditRoute && roleValue !== "admin") {
    const allowedUrl = new URL(getDefaultRouteForRole(roleValue), request.url);
    return NextResponse.redirect(allowedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/analytics/:path*",
    "/shop-analytics/:path*",
    "/ecommerce-analytics/:path*",
    "/domestic-analytics/:path*",
    "/retail/:path*",
    "/shop/:path*",
    "/shop-inventory/:path*",
    "/shop-stock-returned/:path*",
    "/daily-report/:path*",
    "/domestic-homepage/:path*",
    "/domestic/:path*",
    "/domestic-inventory/:path*",
    "/domestic-online-sales/:path*",
    "/purchase-order-dashboard/:path*",
    "/online-homepage/:path*",
    "/online/:path*",
    "/online-inventory/:path*",
    "/online-daily-report/:path*",
    "/inventory-po-access/:path*",
    "/jobcard-access/:path*",
    "/jobcard/:path*",
    "/jobcard-dashboard/:path*",
    "/jobcard-forms/:path*",
  ],
};
