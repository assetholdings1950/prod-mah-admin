import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    try {
        const id = params.get("id");
        const endpoint = id ? API_ENDPOINTS.bonds.getById(id) : API_ENDPOINTS.bonds.getList(
            params.get("page") ?? "1", params.get("limit") ?? "12", params.get("search") ?? "",
            params.get("status") ?? undefined, params.get("riskLevel") ?? undefined,
            params.get("couponFrequency") ?? undefined
        );
        const client = await authClient();
        const backendRes = await client.get(endpoint);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err.response?.data ?? { error: "Failed to fetch bonds." }, { status: err.response?.status ?? 500 });
    }
}
