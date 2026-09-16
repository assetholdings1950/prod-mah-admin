import apiClient from "@/lib/apiClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId") || "";
  const reader = searchParams.get("reader") || "admin";

  try {
    const backendRes = await apiClient.get(
      `/chat/agent-admin/messages?agentId=${encodeURIComponent(agentId)}&reader=${encodeURIComponent(reader)}`
    );
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown; status?: number } };
    console.error("Error fetching agent-admin messages:", err);
    return NextResponse.json(
      err.response?.data ?? { error: "Failed to fetch chat messages." },
      { status: err.response?.status ?? 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendRes = await apiClient.post("/chat/agent-admin/messages", body);
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown; status?: number } };
    console.error("Error posting agent-admin message:", error);
    return NextResponse.json(
      err.response?.data ?? { error: "Failed to post chat message." },
      { status: err.response?.status ?? 500 }
    );
  }
}
