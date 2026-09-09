import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/authClient";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path?: string[] }> };

function failure(error: unknown, fallback: string) {
    const err = error as { response?: { data?: unknown; status?: number } };
    return NextResponse.json(
        err.response?.data ?? { status: false, message: fallback },
        { status: err.response?.status ?? 500 },
    );
}

async function proxy(req: NextRequest, context: RouteContext) {
    try {
        const { path = [] } = await context.params;
        const suffix = path.length ? `/${path.map(encodeURIComponent).join("/")}` : "";
        const endpoint = `/email-center${suffix}${req.nextUrl.search}`;
        const client = await authClient();
        const method = req.method.toLowerCase();
        let data: FormData | Record<string, unknown> | undefined;
        if (!["get", "head"].includes(method)) {
            const contentType = req.headers.get("content-type") || "";
            data = contentType.includes("multipart/form-data")
                ? await req.formData()
                : await req.json();
        }
        const response = await client.request({
            method,
            url: endpoint,
            data,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error) {
        return failure(error, "Email Center request failed.");
    }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
