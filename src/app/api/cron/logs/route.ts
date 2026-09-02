import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page     = searchParams.get("page")     ?? "1";
        const limit    = searchParams.get("limit")    ?? "15";
        const cronName = searchParams.get("cronName") ?? undefined;
        const status   = searchParams.get("status")   ?? undefined;

        const client = await authClient();
        const backendRes = await client.get(API_ENDPOINTS.cron.logs(page, limit, cronName, status));
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch cron logs." },
            { status: err.response?.status ?? 500 }
        );
    }
}
