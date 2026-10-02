import { NextResponse } from "next/server";
import { authClient } from "@/lib/authClient";

type RouteContext = { params: Promise<{ id: string; documentType: string }> };

export async function GET(_request: Request, context: RouteContext) {
    try {
        const { id, documentType } = await context.params;
        if (!["offering-document", "term-sheet"].includes(documentType)) {
            return NextResponse.json({ status: false, message: "Invalid bond document type." }, { status: 400 });
        }

        const client = await authClient();
        const response = await client.get(
            `/bonds/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentType)}`,
            { responseType: "arraybuffer" },
        );
        return new NextResponse(new Uint8Array(response.data), {
            status: 200,
            headers: {
                "Content-Type": String(response.headers["content-type"] || "application/octet-stream"),
                "Content-Disposition": String(response.headers["content-disposition"] || "attachment"),
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error: unknown) {
        const apiError = error as { response?: { status?: number; data?: { message?: string } } };
        return NextResponse.json(
            { status: false, message: apiError.response?.data?.message || "Bond document download failed." },
            { status: apiError.response?.status ?? 500 },
        );
    }
}
