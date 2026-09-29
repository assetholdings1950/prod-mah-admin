import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const agentId = request.nextUrl.searchParams.get("agentId");
    if (!agentId) return NextResponse.json({ status: false, message: "agentId is required" }, { status: 400 });
    try {
        const client = await authClient();
        const backendRes = await client.get(`/agent/${agentId}/salary-payments`, { params: request.nextUrl.searchParams });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err.response?.data ?? { status: false, message: "Failed to fetch salary payments." }, { status: err.response?.status ?? 500 });
    }
}

export async function POST(request: NextRequest) {
    const agentId = request.nextUrl.searchParams.get("agentId");
    if (!agentId) return NextResponse.json({ status: false, message: "agentId is required" }, { status: 400 });
    try {
        const client = await authClient();
        const backendRes = await client.post(`/agent/${agentId}/salary-payments`, await request.json());
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err.response?.data ?? { status: false, message: "Failed to credit salary." }, { status: err.response?.status ?? 500 });
    }
}
