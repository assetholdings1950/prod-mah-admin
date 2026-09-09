import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const client = await authClient();
        const backendRes = await client.post(API_ENDPOINTS.bonds.update, await req.json());
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err.response?.data ?? { error: "Bond update failed." }, { status: err.response?.status ?? 500 });
    }
}
