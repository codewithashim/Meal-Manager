import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/forgot-password");

  const protectedRoutes = [
    "/dashboard",
    "/users",
    "/rooms",
    "/meals",
    "/expenses",
    "/payments",
    "/bills",
    "/complaints",
    "/notices",
    "/notifications",
    "/reports",
    "/settings",
    "/audit-logs",
  ];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
