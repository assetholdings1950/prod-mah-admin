import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const client = await authClient();
        const backendRes = await client.patch(`/commission-tier-policies/${id}`, await req.json());
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { status: false, message: "Failed to update commission tier policy." },
            { status: err.response?.status ?? 500 },
        );
    }
}
