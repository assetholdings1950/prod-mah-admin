import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const id = new URL(req.url).searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID is required." }, { status: 400 });
        }

        const client = await authClient();
        const backendRes = await client.get(API_ENDPOINTS.deposits.getById(id));
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch deposit." },
            { status: err.response?.status ?? 500 }
        );
    }
}
