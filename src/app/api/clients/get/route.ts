import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ?? "1";
    const limit = searchParams.get("limit") ?? "10";
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? undefined;
    const kycStatus = searchParams.get("kycStatus") ?? undefined;
    const riskProfile = searchParams.get("riskProfile") ?? undefined;
    const country = searchParams.get("country") ?? undefined;
    const preferredCurrency = searchParams.get("preferredCurrency") ?? undefined;

    try {
        const client = await authClient();
        const backendRes = await client.get(
            API_ENDPOINTS.clients.getClientList(page, limit, search, status, kycStatus, riskProfile, country, preferredCurrency)
        );

        if (!backendRes?.data?.data) {
            return NextResponse.json(backendRes.data);
        }

        return NextResponse.json(backendRes.data, {
            status: backendRes.data.statusCode,
        });
    } catch (error) {
        console.log("error while fetching client list ", error)
        return NextResponse.json(
            { error: "client list fetching failed." },
            { status: 500 }
        );
    }
}
