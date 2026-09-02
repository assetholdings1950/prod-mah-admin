import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const payload = await req.json();
        const client = await authClient();
        const backendRes = await client.patch(API_ENDPOINTS.withdrawals.bulkApprove, payload);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to bulk approve withdrawals." },
            { status: err.response?.status ?? 500 }
        );
    }
}
