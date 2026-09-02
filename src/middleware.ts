import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

function isExpired(token?: string) {
  if (!token) return true;
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded?.exp) return true;
    // Treat as expired 30 s before actual expiry so middleware
    // refreshes proactively instead of letting the backend reject it
    return Date.now() >= decoded.exp * 1000 - 30 * 1000;
  } catch {
    return true;
  }
}

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("adminAccessToken")?.value;
  const refreshToken = req.cookies.get("adminRefreshToken")?.value;
  const path = req.nextUrl.pathname;
  const cookieHeader = req.headers.get("cookie") || "";

  const publicRoutes = ["/sign-in", "/auth/signup", "/auth/reset-password"];
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));

  // Already authenticated — redirect away from public pages
  if (isPublicRoute && accessToken && !isExpired(accessToken)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isPublicRoute) {
    if (!accessToken || isExpired(accessToken)) {
      if (refreshToken) {
        try {
          const response = await fetch(
            `${req.nextUrl.origin}/api/auth/refresh`,
            {
              method: "POST",
              credentials: "include",
              headers: { cookie: cookieHeader },
            }
          );

          if (response.status === 200) {
            const { accessToken: newAccessToken } = await response.json();
            const res = NextResponse.next();
            res.cookies.set("adminAccessToken", newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
              path: "/",
              maxAge: 60 * 15, // 15 min — matches backend JWT expiry
            });
            return res;
          }
        } catch (err) {
          console.error("Middleware refresh failed:", err);
        }
      }

      // No valid token and refresh failed → redirect to sign-in
      const redirectUrl = new URL("/sign-in", req.url);
      redirectUrl.searchParams.set(
        "callbackUrl",
        req.nextUrl.pathname + req.nextUrl.search
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/sign-in",
    "/agents/:path*",
    "/clients/:path*",
    "/investment-plans/:path*",
    "/notifications/:path*",
    "/jobs/:path*",
  ],
};
