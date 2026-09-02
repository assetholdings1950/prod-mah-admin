import { authClient } from "@/lib/authClient";
import { API_ENDPOINTS } from "@/lib/config/apiConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await authClient();
        const backendRes = await client.get(API_ENDPOINTS.jobs.adminList);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to fetch jobs." },
            { status: err.response?.status ?? 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    let payload: unknown;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    try {
        const client = await authClient();
        const backendRes = await client.post(API_ENDPOINTS.jobs.create, payload);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to create job." },
            { status: err.response?.status ?? 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "No job ID provided." }, { status: 400 });
    }

    let payload: unknown;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    try {
        const client = await authClient();
        const backendRes = await client.put(API_ENDPOINTS.jobs.update(id), payload);
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to update job." },
            { status: err.response?.status ?? 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "No job ID provided." }, { status: 400 });
    }

    try {
        const client = await authClient();
        const backendRes = await client.delete(API_ENDPOINTS.jobs.delete(id));
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { error: "Failed to delete job." },
            { status: err.response?.status ?? 500 }
        );
    }
}
