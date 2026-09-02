import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page") || "1";
        const limit = searchParams.get("limit") || "10";
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "all";
        const topic = searchParams.get("topic") || "all";

        const client = await authClient();

        const backendRes = await client.get(
            API_ENDPOINTS.consultant.adminList(page, limit, search, status, topic)
        );

        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { status: false, message: "Failed to fetch consultation requests." },
            { status: err.response?.status ?? 500 }
        );
    }
}
