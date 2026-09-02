import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    try {
        const { clientId } = await params;
        const client = await authClient();
        const backendRes = await client.delete(`/portfolio/admin/client/${clientId}`);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to delete client portfolios." },
            { status: err.response?.status ?? 500 }
        );
    }
}
