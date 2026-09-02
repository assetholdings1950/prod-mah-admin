import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const { clientId } = (await req.json()) as { clientId: string };
        if (!clientId) {
            return NextResponse.json({ error: "clientId is required." }, { status: 400 });
        }
        const client = await authClient();
        const backendRes = await client.patch("/clients/admin/reset-portfolio-value", { clientId });
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Reset failed." },
            { status: err.response?.status ?? 500 }
        );
    }
}
