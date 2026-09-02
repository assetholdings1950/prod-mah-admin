import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const client = await authClient();

        const backendRes = await client.patch(
            API_ENDPOINTS.consultant.update(id),
            body
        );

        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { status: false, message: "Failed to update consultation request." },
            { status: err.response?.status ?? 500 }
        );
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const client = await authClient();

        const backendRes = await client.delete(
            API_ENDPOINTS.consultant.delete(id)
        );

        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { status: false, message: "Failed to delete consultation request." },
            { status: err.response?.status ?? 500 }
        );
    }
}
