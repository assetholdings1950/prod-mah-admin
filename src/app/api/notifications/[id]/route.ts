import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const client = await authClient();
        const response = await client.get(API_ENDPOINTS.notifications.getById(id));
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err.response?.data ?? { status: false, message: "Failed to fetch notification." }, { status: err.response?.status ?? 500 });
    }
}
