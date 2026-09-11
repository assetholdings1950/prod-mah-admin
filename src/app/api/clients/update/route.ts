import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        const client = await authClient();
        const backendRes = await client.post(API_ENDPOINTS.clients.update, payload);

        return NextResponse.json(backendRes.data, {
            status: backendRes.status,
        });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        console.error("Error updating client:", err);
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to update client." },
            { status: err.response?.status ?? 500 }
        );
    }
}
