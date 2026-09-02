import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await authClient();
        const backendRes = await client.get(API_ENDPOINTS.jobs.adminList);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch jobs." },
            { status: err.response?.status ?? 500 }
        );
    }
}
