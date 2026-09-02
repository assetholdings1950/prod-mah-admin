import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/authClient";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
    try {
        const { path } = await context.params;
        const endpoint = `/hiring/${path.join("/")}${request.nextUrl.search}`;
        const client = await authClient();
        const method = request.method.toLowerCase();
        let body: unknown;
        if (["post", "put", "patch"].includes(method)) {
            const rawBody = await request.text();
            body = rawBody ? JSON.parse(rawBody) : undefined;
        }
        const response = await client.request({ method, url: endpoint, data: body });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: unknown) {
        const apiError = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            apiError.response?.data ?? { success: false, message: "Hiring request failed." },
            { status: apiError.response?.status ?? 500 },
        );
    }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
