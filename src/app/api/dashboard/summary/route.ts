import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await authClient();
        const backendRes = await client.get(
            API_ENDPOINTS.dashboard.summary
        );

        return NextResponse.json(backendRes.data, {
            status: backendRes.status,
        });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        console.error("error while fetching dashboard summary ", err);
        return NextResponse.json(
            err.response?.data ?? { error: "dashboard summary fetching failed." },
            { status: err.response?.status ?? 500 }
        );
    }
}
