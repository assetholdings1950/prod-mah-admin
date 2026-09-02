import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ?? "1";
    const limit = searchParams.get("limit") ?? "10";
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "all"
    const roles = searchParams.get("roles");

    console.log(roles)
    let roleId = []

    if (roles) {
        try {
            roleId = JSON.parse(roles);
        } catch {
            return NextResponse.json(
                { message: "Invalid user id format" },
                { status: 400 }
            );
        }
    }


    try {
        const backendRes = await apiClient.get(API_ENDPOINTS.auth.getUser(search, page, limit, status, roleId));

        if (!backendRes?.data?.data) {
            return NextResponse.json(backendRes.data);
        }

        return NextResponse.json(backendRes.data, {
            status: backendRes.data.statusCode,
        });
    } catch (error) {
        console.log("error while fetching user list", error)
        return NextResponse.json(
            { error: "user list fetching failed." },
            { status: 500 }
        );
    }
}
