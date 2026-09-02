import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
        return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    try {
        const client = await authClient();
        const backendRes = await client.get(API_ENDPOINTS.agents.bankDetails.getList(clientId));
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch bank details." },
            { status: err.response?.status ?? 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const client = await authClient();
        const backendRes = await client.post(API_ENDPOINTS.agents.bankDetails.add, payload);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to add bank detail." },
            { status: err.response?.status ?? 500 }
        );
    }
}
