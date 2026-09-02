import appClient from "@/lib/appClient";

export type FundReportStatus = "draft" | "published";

export type FundReportRecord = {
    id: string; fundId: string; fundName: string; title: string; status: FundReportStatus;
    reportDate: string; reportTime: string; timezone: string; currencyCode: string;
    summary: string; internalNotes: string; activity: unknown[]; allocations: unknown[]; profits: unknown[];
    allocationSource: string; sourceReference: string; methodology: string; feeBasis: string;
    reviewer: string; disclosure: string; showPublicly: boolean; publishDate: string; publishTime: string;
    revisionReason: string; privacyThreshold: string; checks: boolean[]; createdAt: string; updatedAt: string;
};

export type FundReportListResponse = {
    items: FundReportRecord[];
    total: number;
    page: number;
    limit: number;
    pages: number;
    counts: { all: number; published: number; draft: number };
};

export const createReportId = () => "";

export async function getFundReports(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<FundReportListResponse> {
    const response = await appClient.get("/api/fund-reports", { params });
    return response.data;
}

export async function getFundReport(id: string): Promise<FundReportRecord> {
    const response = await appClient.get(`/api/fund-reports/${encodeURIComponent(id)}`);
    return response.data.report;
}

export async function saveFundReport(report: FundReportRecord): Promise<FundReportRecord> {
    if (report.id) {
        const response = await appClient.put(`/api/fund-reports/${encodeURIComponent(report.id)}`, report);
        return response.data.report;
    }
    const response = await appClient.post("/api/fund-reports", report);
    return response.data.report;
}

export async function deleteFundReports(ids: string[]) {
    const response = await appClient.delete("/api/fund-reports", { data: { ids } });
    return response.data;
}
