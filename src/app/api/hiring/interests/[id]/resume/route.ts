import { NextResponse } from "next/server";
import { authClient } from "@/lib/authClient";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const client = await authClient();
        const response = await client.get(
            `/hiring/interests/${encodeURIComponent(id)}/resume`,
            { responseType: "arraybuffer" },
        );
        return new NextResponse(new Uint8Array(response.data), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": response.headers["content-disposition"] || "attachment; filename=resume.pdf",
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error: unknown) {
        const apiError = error as { response?: { status?: number } };
        return NextResponse.json(
            { success: false, message: "Resume download failed." },
            { status: apiError.response?.status ?? 500 },
        );
    }
}
