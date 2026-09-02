import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    try {
        const { ids } = (await req.json()) as { ids: string[] };

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No payment method IDs provided." }, { status: 400 });
        }

        const client = await authClient();
        const backendRes = await client.delete(API_ENDPOINTS.paymentMethods.delete(ids));
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to delete payment method(s)." },
            { status: err.response?.status ?? 500 }
        );
    }
}
