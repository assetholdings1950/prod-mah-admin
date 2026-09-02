import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const client = await authClient();
        const backendRes = await client.get(`/portfolio/admin/detail/${id}`);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch portfolio detail." },
            { status: err.response?.status ?? 500 }
        );
    }
}
