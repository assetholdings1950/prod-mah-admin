import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        const backendRes = await apiClient.post(API_ENDPOINTS.investmentPlans.update, payload);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        const err = error as { response?: { data?: unknown; status?: number } };
        console.error("Error updating investment plan:", err);
        return NextResponse.json(
            err.response?.data ?? { error: "Investment plan update failed." },
            { status: err.response?.status ?? 500 }
        );
    }
}
