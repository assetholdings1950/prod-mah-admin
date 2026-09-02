import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json() as { userId: string };

        if (!userId) {
            return NextResponse.json({ error: "No agent ID provided." }, { status: 400 });
        }

        const client = await authClient();
        const backendRes = await client.post(API_ENDPOINTS.agents.approveKyc, { userId });

        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        console.error("Error approving agent KYC:", err);
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to approve agent KYC." },
            { status: err.response?.status ?? 500 }
        );
    }
}
