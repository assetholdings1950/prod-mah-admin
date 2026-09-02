"use client";

import {
    TrendingUp, Wallet, Activity,
    Clock, CheckCircle2, ArrowUpRight,
} from "lucide-react";
import type { PortfolioPayoutAdminSummary } from "@/interface/portfolio";
import { fmtUsd } from "./types";

interface Props {
    summary: PortfolioPayoutAdminSummary;
    loading?: boolean;
}

function StatCard({
    label, value, sub, icon: Icon, accent, loading,
}: {
    label: string; value: string; sub: string;
    icon: React.ElementType; accent: string; loading?: boolean;
}) {
    return (
        <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4 flex items-start gap-3">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${accent}`} />
            <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.replace("bg-", "bg-").replace("-400", "-100").replace("-500", "-100").replace("-600", "-100")}`}>
                <Icon size={16} className={accent.replace("bg-", "text-")} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                {loading
                    ? <div className="h-6 w-24 rounded bg-slate-100 animate-pulse my-0.5" />
                    : <p className="text-[18px] font-black text-slate-800 leading-tight truncate">{value}</p>
                }
                <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

function MiniStat({ label, value, color, loading }: { label: string; value: string; color: string; loading?: boolean }) {
    return (
        <div className={`rounded-xl px-4 py-3 border ${color}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
            {loading
                ? <div className="h-5 w-16 rounded bg-current opacity-20 animate-pulse mt-1" />
                : <p className="text-[15px] font-black mt-0.5">{value}</p>
            }
        </div>
    );
}

export default function PayoutStatCards({ summary, loading }: Props) {
    const payoutPct = summary.totalExpectedProfitUsd > 0
        ? Math.round((summary.totalPaidProfitUsd / summary.totalExpectedProfitUsd) * 100)
        : 0;

    return (
        <div className="space-y-3">
            {/* Row 1 — primary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Total Paid Out"     value={fmtUsd(summary.totalPaidProfitUsd)}     sub="all-time interest"         icon={CheckCircle2}  accent="bg-emerald-500" loading={loading} />
                <StatCard label="Pending Payout"     value={fmtUsd(summary.pendingProfitUsd)}       sub="expected – paid"           icon={Clock}         accent="bg-amber-400"  loading={loading} />
                <StatCard label="Total Expected"     value={fmtUsd(summary.totalExpectedProfitUsd)} sub="across all portfolios"     icon={TrendingUp}    accent="bg-blue-500"   loading={loading} />
                <StatCard label="This Month"         value={fmtUsd(summary.thisMonthPaidUsd)}       sub={`${summary.thisMonthPayoutCount} payouts`} icon={ArrowUpRight} accent="bg-violet-500" loading={loading} />
                <StatCard label="Active Portfolios"  value={String(summary.activeCount)}            sub="earning interest now"      icon={Activity}      accent="bg-sky-500"    loading={loading} />
                <StatCard label="Total AUM"          value={fmtUsd(summary.totalInvestedUsd)}       sub="assets under management"   icon={Wallet}        accent="bg-indigo-500" loading={loading} />
            </div>

            {/* Row 2 — breakdown mini-stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <MiniStat label="SIP Portfolios"       value={String(summary.sipCount)}             color="bg-blue-50 text-blue-700 border-blue-100"     loading={loading} />
                <MiniStat label="Lump Sum"             value={String(summary.lumpsumCount)}         color="bg-violet-50 text-violet-700 border-violet-100" loading={loading} />
                <MiniStat label="Monthly Payout Plans" value={String(summary.monthlyPayoutCount)}   color="bg-emerald-50 text-emerald-700 border-emerald-100" loading={loading} />
                <MiniStat label="Maturity Plans"       value={String(summary.maturityPayoutCount)}  color="bg-amber-50 text-amber-700 border-amber-100"   loading={loading} />
                <MiniStat label="Matured"              value={String(summary.maturedCount)}         color="bg-slate-50 text-slate-600 border-slate-100"   loading={loading} />

                {/* Payout completion bar */}
                <div className="rounded-xl px-4 py-3 border bg-white border-slate-100 col-span-2 sm:col-span-4 lg:col-span-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid / Expected</p>
                    <p className="text-[15px] font-black text-slate-800 mt-0.5">{loading ? "—" : `${payoutPct}%`}</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                            style={{ width: loading ? "0%" : `${payoutPct}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
