import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

    try {
        const payload = await req.json();

        const backendRes = await apiClient.post(
            API_ENDPOINTS.auth.signin,
            payload
        );



        // Generating JWT
        const accessToken = backendRes.data.accessToken
        const refreshToken = backendRes.data.refreshToken

        const res = NextResponse.json(backendRes.data, {
            status: backendRes.status || 200,
        });

        // Storing the tokens in cookies
        res.cookies.set("adminAccessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 15, // 15 min — matches backend JWT expiry
        });

        res.cookies.set("adminRefreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days — matches backend JWT expiry
        });

        return res;
    } catch {
        return NextResponse.json({ error: "Signin failed!" }, { status: 500 });
    }
}
