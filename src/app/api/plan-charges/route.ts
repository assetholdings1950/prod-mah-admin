import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res  = await apiClient.post(API_ENDPOINTS.planCharges.upsert, body);
        return NextResponse.json(res.data, { status: res.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to save plan charges." },
            { status: err.response?.status ?? 500 }
        );
    }
}
