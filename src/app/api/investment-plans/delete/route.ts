import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    try {
        const { ids } = (await req.json()) as { ids: string[] };

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No plan IDs provided." }, { status: 400 });
        }

        const backendRes = await apiClient.delete(API_ENDPOINTS.investmentPlans.delete(ids));
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        const err = error as { response?: { data?: unknown; status?: number } };
        console.error("Error deleting investment plan(s):", err);
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to delete investment plan(s)." },
            { status: err.response?.status ?? 500 }
        );
    }
}
