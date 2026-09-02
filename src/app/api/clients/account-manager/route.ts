import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const { clientId, accountManagerId } = await req.json();
        if (!clientId) {
            return NextResponse.json({ status: false, message: "clientId is required." }, { status: 400 });
        }
        const client = await authClient();
        const backendRes = await client.patch(`/clients/${clientId}/account-manager`, { accountManagerId });
        return NextResponse.json(backendRes.data, { status: backendRes.status || 200 });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { status: false, message: "Failed to update Account Manager." },
            { status: err.response?.status ?? 500 }
        );
    }
}
