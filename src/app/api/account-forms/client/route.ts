import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const clientId = new URL(request.url).searchParams.get("clientId");
    if (!clientId) return NextResponse.json({ status: false, message: "clientId is required." }, { status: 400 });
    try {
        const client = await authClient();
        const response = await client.get(API_ENDPOINTS.accountForms.getByClient(clientId));
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err.response?.data ?? { status: false, message: "Failed to fetch account form." }, { status: err.response?.status ?? 500 });
    }
}
