import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const refreshToken = req.cookies.get("adminRefreshToken")?.value;

    try {
        const backendRes = await apiClient.post(
            API_ENDPOINTS.auth.logout,
            { refreshToken }
        );


        // Prepare response
        const res = NextResponse.json(backendRes.data, {
            status: backendRes.status || 200,
        });

        if (backendRes.data.status) {
            // Clear cookies
            res.cookies.set("adminAccessToken", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: 0,
            });

            res.cookies.set("adminRefreshToken", "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: 0,
            });
        }

        return res;
    } catch {
        return NextResponse.json({ error: "logout failed!" }, { status: 500 });
    }
}
