import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ?? "1";
    const limit = searchParams.get("limit") ?? "10";
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? undefined;
    const userModel = searchParams.get("userModel") ?? undefined;
    const userId = searchParams.get("userId") ?? undefined;

    try {
        const client = await authClient();
        const backendRes = await client.get(
            API_ENDPOINTS.withdrawals.getList(page, limit, search, status, userModel, userId)
        );
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch withdrawal requests." },
            { status: err.response?.status ?? 500 }
        );
    }
}
