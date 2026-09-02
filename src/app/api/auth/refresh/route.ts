import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const refreshToken = (await cookies()).get("adminRefreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 401 }
      );
    }

    const backendRes = await apiClient.post(API_ENDPOINTS.auth.refresh, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = backendRes.data;

    const res = NextResponse.json({ accessToken });

    // Update accessToken cookie
    res.cookies.set("adminAccessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15, // 15 min — matches backend JWT expiry
    });

    // Update refreshToken cookie too (if returned)
    if (newRefreshToken) {
      res.cookies.set("adminRefreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days — matches backend JWT expiry
      });
    }

    return res;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Refresh API Route Error:", err.message);
    } else {
      console.error("Refresh API Route Error:", err);
    }
    return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
  }
}
