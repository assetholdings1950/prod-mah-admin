import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ status: false, message: "Form id is required." }, { status: 400 });
    try {
        const client = await authClient();
        const response = await client.patch(API_ENDPOINTS.accountForms.updateStatus(id), await request.json());
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(err.response?.data ?? { status: false, message: "Failed to update account form." }, { status: err.response?.status ?? 500 });
    }
}
