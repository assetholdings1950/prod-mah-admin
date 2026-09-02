import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const client = await authClient();
        const backendRes = await client.get(API_ENDPOINTS.reports.financial(request.nextUrl.searchParams));
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { status: false, message: "Failed to generate financial report." },
            { status: err.response?.status ?? 500 }
        );
    }
}
