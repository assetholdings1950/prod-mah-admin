import { authClient } from "@/lib/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await authClient();
        const backendRes = await client.get("/commission-tier-policies");
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { status: false, message: "Failed to fetch commission tier policies." },
            { status: err.response?.status ?? 500 },
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const client = await authClient();
        const backendRes = await client.post("/commission-tier-policies", await req.json());
        return NextResponse.json(backendRes.data, { status: backendRes.status });
    } catch (error: unknown) {
        const err = error as { response?: { data?: unknown; status?: number } };
        return NextResponse.json(
            err.response?.data ?? { status: false, message: "Failed to create commission tier policy." },
            { status: err.response?.status ?? 500 },
        );
    }
}
