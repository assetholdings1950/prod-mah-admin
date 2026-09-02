import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page") ?? "1";
        const limit = searchParams.get("limit") ?? "15";
        const search = searchParams.get("search") ?? "";
        const type = searchParams.get("type") ?? undefined;
        const status = searchParams.get("status") ?? undefined;
        const userModel = searchParams.get("userModel") ?? undefined;
        const userId = searchParams.get("userId") ?? undefined;
        const startDate = searchParams.get("startDate") ?? undefined;
        const endDate = searchParams.get("endDate") ?? undefined;
        const sortBy = searchParams.get("sortBy") ?? undefined;
        const sortOrder = searchParams.get("sortOrder") ?? undefined;

        const client = await authClient();
        const backendRes = await client.get(
            API_ENDPOINTS.transactions.getList(page, limit, search, type, status, userModel, startDate, endDate, sortBy, sortOrder, userId)
        );
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch transactions." },
            { status: err.response?.status ?? 500 }
        );
    }
}
