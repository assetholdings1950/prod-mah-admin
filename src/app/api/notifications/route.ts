import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";

function failure(error: unknown, fallback: string) {
    const err = error as { response?: { data?: unknown; status?: number } };
    return NextResponse.json(err.response?.data ?? { status: false, message: fallback }, { status: err.response?.status ?? 500 });
}

export async function GET(req: NextRequest) {
    try {
        const client = await authClient();
        const params = new URL(req.url).searchParams;
        const response = await client.get(API_ENDPOINTS.notifications.getList(params));
        return NextResponse.json(response.data, { status: response.status });
    } catch (error) {
        return failure(error, "Failed to fetch notifications.");
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const client = await authClient();
        const body = await req.json();
        const response = await client.patch(API_ENDPOINTS.notifications.updateReadState, body);
        return NextResponse.json(response.data, { status: response.status });
    } catch (error) {
        return failure(error, "Failed to update notifications.");
    }
}
