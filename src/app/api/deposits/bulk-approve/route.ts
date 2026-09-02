import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const { ids } = (await req.json()) as { ids: string[] };
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "ids array is required." }, { status: 400 });
        }
        const client = await authClient();
        const backendRes = await client.patch(API_ENDPOINTS.deposits.bulkApprove, { ids });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Bulk approve failed." },
            { status: err.response?.status ?? 500 }
        );
    }
}
