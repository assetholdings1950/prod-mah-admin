import apiClient from "@/lib/apiClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId") || "";
  const reader = searchParams.get("reader") || "admin";

  try {
    const backendRes = await apiClient.get(
      `/chat/agent-admin/get?agentId=${encodeURIComponent(agentId)}&reader=${encodeURIComponent(reader)}`
    );
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown; status?: number } };
    console.error("Error fetching messages from /get:", err);
    return NextResponse.json(
      err.response?.data ?? { error: "Failed to fetch messages." },
      { status: err.response?.status ?? 500 }
    );
  }
}
