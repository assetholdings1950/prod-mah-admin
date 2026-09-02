import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    let payload: unknown;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    try {
        const client = await authClient();
        const backendRes = await client.post(API_ENDPOINTS.agents.create, payload);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { message: "Failed to create agent account." },
            { status: err.response?.status ?? 500 }
        );
    }
}
