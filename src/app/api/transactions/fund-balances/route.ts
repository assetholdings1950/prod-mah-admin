import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId") ?? "";
        const userModel = searchParams.get("userModel") ?? "Client";

        const client = await authClient();
        const backendRes = await client.get(
            API_ENDPOINTS.transactions.fundBalances(userId, userModel)
        );
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch fund balances." },
            { status: err.response?.status ?? 500 }
        );
    }
}
