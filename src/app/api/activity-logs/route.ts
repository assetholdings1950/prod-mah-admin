import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page      = searchParams.get("page")      ?? "1";
        const limit     = searchParams.get("limit")     ?? "20";
        const userId    = searchParams.get("userId")    ?? undefined;
        const userModel = searchParams.get("userModel") ?? undefined;
        const category  = searchParams.get("category")  ?? undefined;
        const action    = searchParams.get("action")    ?? undefined;
        const search    = searchParams.get("search")    ?? undefined;

        const client = await authClient();
        const backendRes = await client.get(
            API_ENDPOINTS.activityLogs.getList(page, limit, userId, userModel, category, action, search)
        );
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch activity logs." },
            { status: err.response?.status ?? 500 }
        );
    }
}
