"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownToLine,
    ArrowUpFromLine,
    Bitcoin,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    Download,
    Info,
    Loader2,
    RefreshCw,
    TrendingUp,
    UserRound,
    WalletCards,
} from "lucide-react";
import appClient from "@/lib/appClient";
import Select from "@/components/common/Select";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

type GroupBy = "daily" | "weekly" | "monthly";
type ReportTab = "cash-flow" | "sip-collection";

interface TrendPoint {
    key: string;
    label: string;
    depositsUsd: number;
    withdrawalsUsd: number;
    netFlowUsd: number;
}

interface CurrencyBreakdown {
    currency: string;
    nativeVolume: number;
    usdEquivalent: number;
    transactions: number;
    sharePct: number;
}

interface SipOutcome {
    key: string;
    label: string;
    autoPaid: number;
    manualPaid: number;
    missed: number;
    recovered: number;
}

interface AttentionClient {
    clientId: string;
    clientName: string;
    email: string;
    portfolioId: string;
    planName: string;
    missedInstallments: number;
    outstandingUsd: number;
    lastAttemptAt: string | null;
}

interface FinancialReport {
    status: boolean;
    generatedAt: string;
    warnings: string[];
    cashFlow: {
        summary: {
            approvedDepositsUsd: number;
            approvedWithdrawalsUsd: number;
            netCashFlowUsd: number;
            pendingVolumeUsd: number;
            approvedDepositCount: number;
            approvedWithdrawalCount: number;
            pendingDepositCount: number;
            pendingWithdrawalCount: number;
        };
        trend: TrendPoint[];
        currencyBreakdown: CurrencyBreakdown[];
        userBreakdown: {
            clientPct: number;
            agentPct: number;
            clientVolumeUsd: number;
            agentVolumeUsd: number;
        };
    };
    sipCollection: {
        summary: {
            totalSipPortfolios: number;
            expectedInstallments: number;
            autoPaid: number;
            manualPaid: number;
            missed: number;
            recovered: number;
            insufficientBalance: number;
            processingErrors: number;
            collectionRate: number;
            outstandingUsd: number;
        };
        outcomes: SipOutcome[];
        clientsRequiringAttention: AttentionClient[];
        trackingNote: string;
    };
}

const ASSET_COLORS: Record<string, string> = {
    BTC: "#f59e0b",
    USDT: "#10b981",
    ETH: "#2563eb",
    TRX: "#ef4444",
    SOL: "#7c3aed",
};

function isoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function initialDates() {
    const now = new Date();
    return {
        from: isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))),
        to: isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))),
    };
}

function usd(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function cryptoAmount(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(Number(value || 0));
}

function compactUsd(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(Number(value || 0));
}

function formatDate(value: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function csvCell(value: unknown) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
}

function SectionHeading({ icon: Icon, title, detail }: { icon: typeof TrendingUp; title: string; detail: string }) {
    return (
        <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={15} />
            </span>
            <div>
                <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">{detail}</p>
            </div>
        </div>
    );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: {
    label: string;
    value: string;
    detail: string;
    icon: typeof TrendingUp;
    tone: "green" | "red" | "blue" | "amber";
}) {
    const colors = {
        green: "bg-emerald-50 text-emerald-600 border-emerald-100",
        red: "bg-red-50 text-red-500 border-red-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
    }[tone];
    return (
        <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold text-slate-500">{label}</p>
                    <p className="mt-1 text-xl font-black tracking-tight text-slate-900">{value}</p>
                    <p className="mt-1 text-[9px] text-slate-400">{detail}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full border ${colors}`}><Icon size={18} /></span>
            </div>
        </article>
    );
}

function CashFlowChart({ data }: { data: TrendPoint[] }) {
    const width = 820;
    const height = 270;
    const left = 58;
    const right = 18;
    const top = 22;
    const bottom = 42;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const max = Math.max(1, ...data.flatMap(item => [item.depositsUsd, item.withdrawalsUsd, Math.abs(item.netFlowUsd)]));
    const x = (index: number) => left + (data.length <= 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
    const y = (value: number) => top + chartHeight - (Math.max(0, value) / max) * chartHeight;
    const path = (key: "depositsUsd" | "withdrawalsUsd") => data.map((item, index) => `${index ? "L" : "M"}${x(index)},${y(item[key])}`).join(" ");
    const labelStep = Math.max(1, Math.ceil(data.length / 7));

    return (
        <div className="mt-4 min-h-[280px] overflow-x-auto">
            {data.length === 0 ? (
                <div className="flex h-[260px] items-center justify-center text-xs text-slate-400">No cash-flow activity for this period.</div>
            ) : (
                <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] min-w-[720px] w-full" role="img" aria-label="Cash flow trend chart">
                    <defs>
                        <linearGradient id="deposit-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                        const lineY = top + chartHeight * ratio;
                        return (
                            <g key={ratio}>
                                <line x1={left} x2={width - right} y1={lineY} y2={lineY} stroke="#e2e8f0" strokeDasharray="4 5" />
                                <text x={left - 10} y={lineY + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{compactUsd(max * (1 - ratio))}</text>
                            </g>
                        );
                    })}
                    {data.map((item, index) => {
                        const barWidth = Math.max(3, Math.min(12, chartWidth / Math.max(data.length, 1) / 2.4));
                        const barHeight = Math.abs(item.netFlowUsd) / max * chartHeight;
                        return <rect key={item.key} x={x(index) - barWidth / 2} y={top + chartHeight - barHeight} width={barWidth} height={barHeight} rx="2" fill="#6366f1" opacity="0.2"><title>{item.label}: net {usd(item.netFlowUsd)}</title></rect>;
                    })}
                    <path d={`${path("depositsUsd")} L${x(data.length - 1)},${top + chartHeight} L${x(0)},${top + chartHeight} Z`} fill="url(#deposit-fill)" />
                    <path d={path("depositsUsd")} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={path("withdrawalsUsd")} fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    {data.map((item, index) => (
                        <g key={`point-${item.key}`}>
                            <circle cx={x(index)} cy={y(item.depositsUsd)} r="2.8" fill="#10b981"><title>{item.label}: deposits {usd(item.depositsUsd)}</title></circle>
                            <circle cx={x(index)} cy={y(item.withdrawalsUsd)} r="2.5" fill="#ef4444"><title>{item.label}: withdrawals {usd(item.withdrawalsUsd)}</title></circle>
                            {(index % labelStep === 0 || index === data.length - 1) && <text x={x(index)} y={height - 13} textAnchor="middle" fontSize="9" fill="#64748b">{item.label}</text>}
                        </g>
                    ))}
                </svg>
            )}
        </div>
    );
}

function CurrencyPanel({ rows, clientPct, agentPct }: { rows: CurrencyBreakdown[]; clientPct: number; agentPct: number }) {
    let cursor = 0;
    const slices = rows.map(row => {
        const from = cursor;
        cursor += row.sharePct;
        return `${ASSET_COLORS[row.currency] || "#64748b"} ${from}% ${cursor}%`;
    });
    const gradient = rows.length ? `conic-gradient(${slices.join(",")})` : "conic-gradient(#e2e8f0 0 100%)";

    return (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Currency Breakdown</h3>
                    <p className="mt-0.5 text-[9px] text-slate-500">Share calculated from approved deposit USD equivalents.</p>
                </div>
                <Bitcoin size={18} className="text-amber-500" />
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full" style={{ background: gradient }}>
                    <div className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white shadow-inner">
                        <span className="text-lg font-black text-slate-900">{rows.length}</span>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Assets</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[440px] text-[10px]">
                        <thead><tr className="border-b border-slate-200 text-left text-[8px] uppercase tracking-wider text-slate-400"><th className="pb-2">Asset</th><th className="pb-2">Native volume</th><th className="pb-2">USD equivalent</th><th className="pb-2 text-right">Transactions</th></tr></thead>
                        <tbody>
                            {rows.map(row => (
                                <tr key={row.currency} className="border-b border-slate-100 last:border-0">
                                    <td className="py-2 font-bold text-slate-800"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: ASSET_COLORS[row.currency] || "#64748b" }} />{row.currency} <span className="text-[8px] font-medium text-slate-400">{row.sharePct}%</span></td>
                                    <td className="py-2 font-mono text-slate-600">{cryptoAmount(row.nativeVolume)}</td>
                                    <td className="py-2 font-bold text-slate-800">{usd(row.usdEquivalent)}</td>
                                    <td className="py-2 text-right text-slate-500">{row.transactions}</td>
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-400">No approved deposits.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-[9px] font-semibold text-slate-500"><span>Client <b className="text-blue-600">{clientPct}%</b></span><span>Agent <b className="text-indigo-600">{agentPct}%</b></span></div>
                <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="bg-blue-600" style={{ width: `${clientPct}%` }} /><span className="bg-indigo-400" style={{ width: `${agentPct}%` }} /></div>
            </div>
        </section>
    );
}

function SipMetric({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof TrendingUp; tone: string }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon size={16} /></span>
            <div className="min-w-0"><p className="truncate text-[9px] font-medium text-slate-500">{label}</p><p className="mt-0.5 text-base font-black text-slate-900">{value}</p></div>
        </div>
    );
}

function SipOutcomeChart({ data }: { data: SipOutcome[] }) {
    const max = Math.max(1, ...data.map(row => row.autoPaid + row.manualPaid + row.missed + row.recovered));
    return (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-900">Installment Outcomes</h3>
            <div className="mt-2 flex flex-wrap gap-3 text-[8px] font-semibold text-slate-500">
                {[["Auto Paid", "bg-emerald-500"], ["Manual Paid", "bg-violet-500"], ["Missed", "bg-amber-500"], ["Recovered", "bg-blue-500"]].map(([label, color]) => <span key={label} className="inline-flex items-center gap-1"><i className={`h-2 w-2 rounded-sm ${color}`} />{label}</span>)}
            </div>
            <div className="mt-5 flex h-48 items-end gap-3 border-b border-slate-200 px-2">
                {data.map(row => {
                    const values = [
                        [row.autoPaid, "bg-emerald-500"],
                        [row.manualPaid, "bg-violet-500"],
                        [row.missed, "bg-amber-500"],
                        [row.recovered, "bg-blue-500"],
                    ] as const;
                    return (
                        <div key={row.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                            <div className="flex w-full max-w-14 flex-col-reverse overflow-hidden rounded-t-md" style={{ height: `${Math.max(4, (values.reduce((sum, [v]) => sum + v, 0) / max) * 165)}px` }}>
                                {values.map(([value, color], index) => value > 0 && <div key={index} className={`${color} flex min-h-3 items-center justify-center text-[7px] font-bold text-white`} style={{ flex: value }} title={`${value}`}>{value}</div>)}
                            </div>
                            <span className="mt-2 max-w-full truncate text-[8px] text-slate-500">{row.label}</span>
                        </div>
                    );
                })}
                {data.length === 0 && <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No SIP outcomes recorded.</div>}
            </div>
        </section>
    );
}

function CollectionHealth({ summary }: { summary: FinancialReport["sipCollection"]["summary"] }) {
    const rate = Math.max(0, Math.min(100, summary.collectionRate));
    const healthRows: Array<{
        label: string;
        value: string | number;
        Icon: typeof TrendingUp;
        tone: string;
    }> = [
        { label: "Outstanding", value: usd(summary.outstandingUsd), Icon: CircleDollarSign, tone: "bg-amber-50 text-amber-600" },
        { label: "Recovered", value: summary.recovered, Icon: RefreshCw, tone: "bg-emerald-50 text-emerald-600" },
        { label: "Insufficient Balance", value: summary.insufficientBalance, Icon: AlertCircle, tone: "bg-red-50 text-red-500" },
        { label: "Processing Errors", value: summary.processingErrors, Icon: AlertTriangle, tone: "bg-violet-50 text-violet-600" },
    ];
    return (
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-900">Collection Health</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full" style={{ background: `conic-gradient(#10b981 0 ${rate}%, #e2e8f0 ${rate}% 100%)` }}>
                    <div className="flex h-[122px] w-[122px] flex-col items-center justify-center rounded-full bg-white"><span className="text-3xl font-black text-emerald-600">{rate}%</span><span className="text-[9px] font-semibold text-slate-500">Collection Rate</span></div>
                </div>
                <div className="divide-y divide-slate-100">
                    {healthRows.map(({ label, value, Icon, tone }) => (
                        <div key={label} className="flex items-center gap-2 py-3 first:pt-0 last:pb-0">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tone}`}><Icon size={14} /></span>
                            <span className="flex-1 text-[10px] font-medium text-slate-600">{label}</span>
                            <span className="text-sm font-black text-slate-900">{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FinancialReportsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedTab = searchParams.get("tab");
    const activeTab: ReportTab = requestedTab === "sip-collection" ? "sip-collection" : "cash-flow";
    const defaults = useMemo(initialDates, []);
    const [from, setFrom] = useState(defaults.from);
    const [to, setTo] = useState(defaults.to);
    const [currency, setCurrency] = useState("all");
    const [userModel, setUserModel] = useState("all");
    const [groupBy, setGroupBy] = useState<GroupBy>("daily");
    const [report, setReport] = useState<FinancialReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const changeTab = (tab: ReportTab) => {
        const next = new URLSearchParams(searchParams.toString());
        next.set("tab", tab);
        router.replace(`?${next.toString()}`, { scroll: false });
    };

    const fetchReport = useCallback(async () => {
        if (!from || !to || from > to) {
            toastError("Choose a valid report date range.");
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({ from, to, currency, userModel, groupBy });
            const response = await appClient.get(`/api/reports/financial?${params}`);
            if (!response.data?.status) throw new Error(response.data?.message || "Failed to load report.");
            setReport(response.data);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            toastError(err.response?.data?.message || err.message || "Failed to load financial report.");
        } finally {
            setLoading(false);
        }
    }, [from, to, currency, userModel, groupBy]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const exportCsv = () => {
        if (!report) return;
        setExporting(true);
        try {
            const rows: unknown[][] = [
                ["MAH Financial Reports"],
                ["Period", from, to],
                ["Currency", currency],
                ["User Type", userModel],
                ["Generated At", report.generatedAt],
                [],
                ["CASH FLOW SUMMARY"],
                ["Metric", "Value USD", "Count"],
                ["Approved Deposits", report.cashFlow.summary.approvedDepositsUsd, report.cashFlow.summary.approvedDepositCount],
                ["Approved Withdrawals", report.cashFlow.summary.approvedWithdrawalsUsd, report.cashFlow.summary.approvedWithdrawalCount],
                ["Net Cash Flow", report.cashFlow.summary.netCashFlowUsd, ""],
                ["Pending Volume", report.cashFlow.summary.pendingVolumeUsd, report.cashFlow.summary.pendingDepositCount + report.cashFlow.summary.pendingWithdrawalCount],
                [],
                ["CURRENCY BREAKDOWN"],
                ["Asset", "Native Volume", "USD Equivalent", "Transactions", "Share %"],
                ...report.cashFlow.currencyBreakdown.map(row => [row.currency, row.nativeVolume, row.usdEquivalent, row.transactions, row.sharePct]),
                [],
                ["CASH FLOW TREND"],
                ["Period", "Deposits USD", "Withdrawals USD", "Net Flow USD"],
                ...report.cashFlow.trend.map(row => [row.label, row.depositsUsd, row.withdrawalsUsd, row.netFlowUsd]),
                [],
                ["SIP COLLECTION SUMMARY"],
                ["Total SIP Portfolios", report.sipCollection.summary.totalSipPortfolios],
                ["Expected Installments", report.sipCollection.summary.expectedInstallments],
                ["Auto Paid", report.sipCollection.summary.autoPaid],
                ["Manual Paid", report.sipCollection.summary.manualPaid],
                ["Missed", report.sipCollection.summary.missed],
                ["Recovered", report.sipCollection.summary.recovered],
                ["Collection Rate %", report.sipCollection.summary.collectionRate],
                ["Outstanding USD", report.sipCollection.summary.outstandingUsd],
                [],
                ["SIP OUTCOMES"],
                ["Period", "Auto Paid", "Manual Paid", "Missed", "Recovered"],
                ...report.sipCollection.outcomes.map(row => [row.label, row.autoPaid, row.manualPaid, row.missed, row.recovered]),
                [],
                ["CLIENTS REQUIRING ATTENTION"],
                ["Client", "Email", "Portfolio", "Plan", "Missed", "Outstanding USD", "Last Attempt"],
                ...report.sipCollection.clientsRequiringAttention.map(row => [row.clientName, row.email, row.portfolioId, row.planName, row.missedInstallments, row.outstandingUsd, row.lastAttemptAt || ""]),
            ];
            const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
            const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `mah-financial-report-${from}-to-${to}.csv`;
            anchor.click();
            URL.revokeObjectURL(url);
            toastSuccess("Financial report exported successfully.");
        } finally {
            setExporting(false);
        }
    };

    const cash = report?.cashFlow;
    const sip = report?.sipCollection;

    return (
        <div className="mx-auto flex min-w-0 w-full max-w-[1500px] flex-col gap-5 overflow-x-hidden px-3 py-5 sm:px-4 lg:px-5">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-950">Financial Reports</h1>
                    <p className="mt-1 text-[11px] text-slate-500">Cash flow intelligence and SIP collection performance</p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                    <label className="block"><span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">From</span><span className="relative block"><CalendarDays size={13} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" /><input type="date" value={from} max={to} onChange={event => setFrom(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-2 text-[10px] font-medium text-slate-700 shadow-sm outline-none focus:border-blue-400" /></span></label>
                    <label className="block"><span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">To</span><input type="date" value={to} min={from} onChange={event => setTo(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-medium text-slate-700 shadow-sm outline-none focus:border-blue-400" /></label>
                    <div><span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">Currency</span><Select size="sm" value={currency} onChange={setCurrency} options={[{ value: "all", label: "All crypto" }, ...["BTC", "ETH", "USDT", "SOL", "TRX"].map(value => ({ value, label: value }))]} /></div>
                    <div><span className="mb-1 block text-[8px] font-bold uppercase tracking-wider text-slate-400">User type</span><Select size="sm" value={userModel} onChange={setUserModel} options={[{ value: "all", label: "All users" }, { value: "Client", label: "Clients" }, { value: "Agent", label: "Agents" }]} /></div>
                    <button onClick={exportCsv} disabled={!report || loading || exporting} className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-[10px] font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}Export Report</button>
                </div>
            </header>

            <nav className="flex max-w-full items-center gap-1 overflow-x-auto border-b border-slate-200" aria-label="Report sections">
                <button onClick={() => changeTab("cash-flow")} aria-selected={activeTab === "cash-flow"} className={`border-b-2 px-5 py-2.5 text-[10px] font-bold transition-colors ${activeTab === "cash-flow" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Cash Flow</button>
                <button onClick={() => changeTab("sip-collection")} aria-selected={activeTab === "sip-collection"} className={`flex items-center gap-2 border-b-2 px-5 py-2.5 text-[10px] font-bold transition-colors ${activeTab === "sip-collection" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>SIP Collection{Boolean(sip?.summary.missed) && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] text-amber-700">{sip?.summary.missed} Missed</span>}</button>
                <button onClick={fetchReport} disabled={loading} className="ml-auto flex items-center gap-1.5 px-2 py-2 text-[9px] font-semibold text-slate-500 hover:text-blue-600 disabled:opacity-50"><RefreshCw size={11} className={loading ? "animate-spin" : ""} />Refresh</button>
            </nav>

            {report?.warnings?.length ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] text-amber-800"><span className="font-bold">Conversion notice:</span> {report.warnings.join(" · ")}</div> : null}

            {loading && !report ? (
                <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 size={24} className="animate-spin text-blue-600" /></div>
            ) : !report ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center"><AlertCircle size={26} className="text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">Report unavailable</p><button onClick={fetchReport} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-[10px] font-bold text-white">Try again</button></div>
            ) : (
                <>
                    {activeTab === "cash-flow" && <section className="min-w-0 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard label="Approved Deposits" value={usd(cash!.summary.approvedDepositsUsd)} detail={`Combined USD equivalent · ${cash!.summary.approvedDepositCount} transactions`} icon={ArrowDownToLine} tone="green" />
                            <MetricCard label="Approved Withdrawals" value={usd(cash!.summary.approvedWithdrawalsUsd)} detail={`${cash!.summary.approvedWithdrawalCount} completed withdrawals`} icon={ArrowUpFromLine} tone="red" />
                            <MetricCard label="Net Cash Flow" value={usd(cash!.summary.netCashFlowUsd)} detail="Approved deposits minus withdrawals" icon={TrendingUp} tone="blue" />
                            <MetricCard label="Pending Volume" value={usd(cash!.summary.pendingVolumeUsd)} detail={`${cash!.summary.pendingDepositCount + cash!.summary.pendingWithdrawalCount} pending requests`} icon={Clock3} tone="amber" />
                        </div>

                        <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <SectionHeading icon={TrendingUp} title="Cash Flow Trend" detail="Approved deposits, withdrawals, and net flow in USD equivalent." />
                                    <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">{(["daily", "weekly", "monthly"] as GroupBy[]).map(value => <button key={value} onClick={() => setGroupBy(value)} className={`rounded-md px-3 py-1.5 text-[9px] font-bold capitalize transition ${groupBy === value ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-800"}`}>{value}</button>)}</div>
                                </div>
                                <div className="mt-3 flex gap-4 border-b border-slate-100 pb-2 text-[8px] font-semibold text-slate-500"><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" />Deposits</span><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-red-500" />Withdrawals</span><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-indigo-300" />Net flow</span></div>
                                <CashFlowChart data={cash!.trend} />
                            </section>
                            <CurrencyPanel rows={cash!.currencyBreakdown} clientPct={cash!.userBreakdown.clientPct} agentPct={cash!.userBreakdown.agentPct} />
                        </div>
                    </section>}

                    {activeTab === "sip-collection" && <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                        <SectionHeading icon={WalletCards} title="SIP Collection Performance" detail="Scheduled installment collection, recovery, and wallet-failure monitoring." />
                        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                            <SipMetric label="Total SIP Portfolios" value={sip!.summary.totalSipPortfolios} icon={WalletCards} tone="bg-blue-50 text-blue-600" />
                            <SipMetric label="Expected Installments" value={sip!.summary.expectedInstallments} icon={CalendarDays} tone="bg-blue-50 text-blue-600" />
                            <SipMetric label="Auto Paid" value={sip!.summary.autoPaid} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-600" />
                            <SipMetric label="Manual Paid" value={sip!.summary.manualPaid} icon={UserRound} tone="bg-violet-50 text-violet-600" />
                            <SipMetric label="Missed" value={sip!.summary.missed} icon={AlertTriangle} tone="bg-amber-50 text-amber-600" />
                            <SipMetric label="Collection Rate" value={`${sip!.summary.collectionRate}%`} icon={TrendingUp} tone="bg-emerald-50 text-emerald-600" />
                        </div>
                        <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"><SipOutcomeChart data={sip!.outcomes} /><CollectionHealth summary={sip!.summary} /></div>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="text-xs font-extrabold text-slate-900">Clients Requiring Attention</h3><p className="mt-0.5 text-[9px] text-slate-500">Current SIP portfolios with unresolved missed installments.</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-700">{sip!.clientsRequiringAttention.length} portfolios</span></div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-[10px]">
                                    <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-[8px] uppercase tracking-wider text-slate-400"><th className="px-4 py-2.5">Client</th><th className="px-4 py-2.5">Portfolio</th><th className="px-4 py-2.5">Plan</th><th className="px-4 py-2.5">Missed</th><th className="px-4 py-2.5">Outstanding</th><th className="px-4 py-2.5">Last attempt</th><th className="px-4 py-2.5 text-right">Action</th></tr></thead>
                                    <tbody>
                                        {sip!.clientsRequiringAttention.map(row => <tr key={row.portfolioId} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/30"><td className="px-4 py-3"><p className="font-bold text-slate-800">{row.clientName}</p><p className="text-[8px] text-slate-400">{row.email}</p></td><td className="px-4 py-3 font-mono text-[9px] text-slate-600">{row.portfolioId}</td><td className="px-4 py-3 text-slate-600">{row.planName}</td><td className="px-4 py-3"><span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-bold text-amber-700">{row.missedInstallments}</span></td><td className="px-4 py-3 font-bold text-red-500">{usd(row.outstandingUsd)}</td><td className="px-4 py-3 text-slate-500">{formatDate(row.lastAttemptAt)}</td><td className="px-4 py-3 text-right"><Link href={`/clients/${row.clientId}/edit?tab=portfolio`} className="font-bold text-blue-600 hover:underline">View client</Link></td></tr>)}
                                        {sip!.clientsRequiringAttention.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No clients currently require SIP collection attention.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        <p className="flex items-start gap-1.5 px-1 text-[9px] leading-relaxed text-slate-400"><Info size={11} className="mt-0.5 shrink-0" />{sip!.trackingNote}</p>
                    </section>}

                    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-1 pt-3 text-[9px] text-slate-400"><span className="inline-flex items-center gap-1.5"><Info size={11} />Amounts prefer transaction-time conversion snapshots; legacy rows use the current CoinGecko rate.</span><span>Updated {formatDate(report.generatedAt)}</span></footer>
                </>
            )}
        </div>
    );
}

export default function FinancialReportsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-[520px] items-center justify-center"><Loader2 size={24} className="animate-spin text-blue-600" /></div>}>
            <FinancialReportsPageInner />
        </Suspense>
    );
}
