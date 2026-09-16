import apiClient from "@/lib/apiClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const backendRes = await apiClient.get("/chat/agent-admin/agents");
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown; status?: number } };
    console.error("Error fetching agent list for admin chat:", err);
    return NextResponse.json(
      err.response?.data ?? { error: "Failed to fetch agents for chat." },
      { status: err.response?.status ?? 500 }
    );
  }
}
