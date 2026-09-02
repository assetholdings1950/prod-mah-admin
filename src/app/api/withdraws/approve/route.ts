import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const client = await authClient();
        const backendRes = await client.patch(API_ENDPOINTS.withdrawals.approve(id), body);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to approve withdrawal." },
            { status: err.response?.status ?? 500 }
        );
    }
}
