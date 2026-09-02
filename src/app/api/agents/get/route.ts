import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ?? "1";
    const limit = searchParams.get("limit") ?? "10";
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? undefined;
    const kycStatus = searchParams.get("kycStatus") ?? undefined;
    const agentLevel = searchParams.get("agentLevel") ?? undefined;
    const country = searchParams.get("country") ?? undefined;
    const preferredCurrency = searchParams.get("preferredCurrency") ?? undefined;

    try {
        const backendRes = await apiClient.get(
            API_ENDPOINTS.agents.getAgentList(page, limit, search, status, kycStatus, agentLevel, country, preferredCurrency)
        );

        return NextResponse.json(backendRes.data, {
            status: backendRes.status,
        });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        console.error("error while fetching agent list ", err);
        return NextResponse.json(
            err.response?.data ?? { error: "agent list fetching failed." },
            { status: err.response?.status ?? 500 }
        );
    }
}
