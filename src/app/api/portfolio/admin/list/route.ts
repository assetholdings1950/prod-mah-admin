import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page           = searchParams.get("page")          ?? "1";
        const limit          = searchParams.get("limit")         ?? "20";
        const search         = searchParams.get("search")        ?? "";
        const status         = searchParams.get("status")        ?? undefined;
        const investmentMode = searchParams.get("investmentMode") ?? undefined;
        const category       = searchParams.get("category")      ?? undefined;
        const clientId       = searchParams.get("clientId")      ?? undefined;
        const startDate      = searchParams.get("startDate")     ?? undefined;
        const endDate        = searchParams.get("endDate")       ?? undefined;
        const sortBy         = searchParams.get("sortBy")        ?? undefined;
        const sortOrder      = searchParams.get("sortOrder")     ?? undefined;

        const client = await authClient();
        const backendRes = await client.get(
            API_ENDPOINTS.portfolios.adminList(
                page, limit, search,
                status, investmentMode, category, clientId,
                startDate, endDate, sortBy, sortOrder,
            )
        );
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch portfolio list." },
            { status: err.response?.status ?? 500 }
        );
    }
}
