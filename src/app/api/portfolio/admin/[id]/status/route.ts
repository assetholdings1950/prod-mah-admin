import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const client = await authClient();
        const backendRes = await client.patch(`/portfolio/admin/${id}/status`, body);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to update portfolio status." },
            { status: err.response?.status ?? 500 }
        );
    }
}
