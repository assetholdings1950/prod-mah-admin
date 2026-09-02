import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

    try {
        const payload = await req.json();

        const backendRes = await apiClient.post(API_ENDPOINTS.investmentPlans.create, payload);

        if (!backendRes?.data) {
            return NextResponse.json(backendRes.data);
        }

        return NextResponse.json(backendRes.data, {
            status: backendRes.data.statusCode,
        });
    } catch {
        return NextResponse.json(
            { error: "Investment plans creation failed." },
            { status: 500 }
        );
    }
}
