import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
        try {
            const backendRes = await apiClient.get(API_ENDPOINTS.investmentPlans.getById(id));
            return NextResponse.json(backendRes.data, { status: backendRes.status });
        } catch (error) {
            const err = error as { response?: { data?: unknown; status?: number } };
            return NextResponse.json(
                err.response?.data ?? { error: "Failed to fetch investment plan." },
                { status: err.response?.status ?? 500 }
            );
        }
    }

    const page = searchParams.get("page") ?? "1";
    const limit = searchParams.get("limit") ?? "12";
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const riskLevel = searchParams.get("riskLevel") ?? undefined;

    try {
        const backendRes = await apiClient.get(
            API_ENDPOINTS.investmentPlans.getList(page, limit, search, category, status, riskLevel)
        );
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        console.error("Error fetching investment plans:", error);
        return NextResponse.json(
            { error: "Investment plans list fetching failed." },
            { status: 500 }
        );
    }
}
