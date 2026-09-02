import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId") ?? "";
        const userModel = searchParams.get("userModel") ?? "Client";

        if (!userId) {
            return NextResponse.json({ error: "userId is required." }, { status: 400 });
        }
        const client = await authClient();
        const backendRes = await client.delete(
            `/transactions/admin/user-transactions?userId=${userId}&userModel=${userModel}`
        );
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Delete failed." },
            { status: err.response?.status ?? 500 }
        );
    }
}
