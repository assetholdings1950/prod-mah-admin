import apiClient from "@/lib/apiClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendRes = await apiClient.post("/chat/agent-admin/post", body);
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown; status?: number } };
    console.error("Error posting message to /post:", err);
    return NextResponse.json(
      err.response?.data ?? { error: "Failed to post message." },
      { status: err.response?.status ?? 500 }
    );
  }
}
