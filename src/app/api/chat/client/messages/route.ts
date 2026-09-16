import apiClient from "@/lib/apiClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const agentId = searchParams.get("agentId");
    const reader = searchParams.get("reader");

    const backendRes = await apiClient.get("/chat/messages", {
      params: { clientId, agentId, reader },
    });
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown; status?: number } };
    console.error("Error fetching client-agent chat messages:", error);
    return NextResponse.json(
      err.response?.data ?? { error: "Failed to fetch messages." },
      { status: err.response?.status ?? 500 }
    );
  }
}
