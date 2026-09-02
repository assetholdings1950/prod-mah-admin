import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/authClient";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
    try {
        const { path = [] } = await context.params;
        const endpoint = `/fund-trust-reports${path.length ? `/${path.join("/")}` : ""}${request.nextUrl.search}`;
        const client = await authClient();
        const method = request.method.toLowerCase();
        let data: unknown;
        if (["post", "put", "patch", "delete"].includes(method)) {
            const rawBody = await request.text();
            data = rawBody ? JSON.parse(rawBody) : undefined;
        }
        const response = await client.request({ method, url: endpoint, data });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const apiError = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(apiError.response?.data ?? { status: false, message: "Fund report request failed." }, { status: apiError.response?.status ?? 500 });
    }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
