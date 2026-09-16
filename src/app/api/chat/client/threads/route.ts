import apiClient from "@/lib/apiClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const backendRes = await apiClient.get("/chat/threads");
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown; status?: number } };
    console.error("Error fetching client-agent conversation threads:", err);
    return NextResponse.json(
      err.response?.data ?? { error: "Failed to fetch client-agent threads." },
      { status: err.response?.status ?? 500 }
    );
  }
}
