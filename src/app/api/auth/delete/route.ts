import apiClient from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const idParams = searchParams.get("ids");

    let ids: string[] = [];

    if (idParams) {
        try {
            ids = JSON.parse(idParams);
        } catch {

            return NextResponse.json(
                { message: "Invalid user id format" },
                { status: 400 }
            );
        }
    }

    console.log("Final payload", ids);

    try {
        const backendRes = await apiClient.delete(
            API_ENDPOINTS.auth.delete(ids)
        );


        if (!backendRes?.data) {
            return NextResponse.json(backendRes.data);
        }

        return NextResponse.json(backendRes.data, {
            status: backendRes.data.statusCode,
        });
    } catch {

        return NextResponse.json({ error: "user deletion failed" }, { status: 500 });
    }
}
