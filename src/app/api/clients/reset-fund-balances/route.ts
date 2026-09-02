import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const { userId, userModel } = (await req.json()) as { userId: string; userModel?: string };
        if (!userId) {
            return NextResponse.json({ error: "userId is required." }, { status: 400 });
        }
        const client = await authClient();
        const backendRes = await client.patch("/transactions/admin/reset-fund-balances", { userId, userModel });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Reset failed." },
            { status: err.response?.status ?? 500 }
        );
    }
}
