import FundReportForm from "@/components/fund-reports/FundReportForm";

export default async function EditFundReportPage({ params }: { params: Promise<{ reportId: string }> }) {
    const { reportId } = await params;
    return <FundReportForm reportId={reportId} />;
}
