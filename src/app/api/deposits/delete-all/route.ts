import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextResponse } from "next/server";

export async function DELETE() {
    try {
        const client = await authClient();
        const backendRes = await client.delete(API_ENDPOINTS.deposits.deleteAll);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Delete all failed." },
            { status: err.response?.status ?? 500 }
        );
    }
}
