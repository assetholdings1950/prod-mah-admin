"use client";

import {
    getCurrencyConfig,
    CURRENCY_CONFIG,
    formatCurrencyAmount,
} from "@/app/(main)/finance/transactions/_components/types";

export interface DepositSummary {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalAgentRequests: number;
    totalClientRequests: number;
    approvedVolumeByCurrency: Record<string, { total: number; count: number }>;
}

interface Props {
    summary: DepositSummary;
    loading?: boolean;
}

function CountCard({
    label, value, sub, accentClass, loading,
}: {
    label: string; value: string | number; sub: string; accentClass: string; loading?: boolean;
}) {
    return (
        <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4 flex flex-col gap-1.5">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
            {loading ? (
                <div className="h-7 w-16 rounded bg-slate-100 animate-pulse my-0.5" />
            ) : (
                <span className="text-2xl font-black text-slate-800">{value}</span>
            )}
            <span className="text-[11px] text-slate-400">{sub}</span>
        </div>
    );
}

function CurrencyVolumeCard({
    currency, total, count, loading,
}: {
    currency: string; total: number; count: number; loading?: boolean;
}) {
    const cc = getCurrencyConfig(currency);
    const CIcon = CURRENCY_CONFIG[currency]?.icon;

    return (
        <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4 flex items-start gap-3">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${cc.accentBar}`} />
            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cc.iconBg}`}>
                {CIcon
                    ? <CIcon size={15} className={cc.iconColor} />
                    : <span className={`text-[15px] font-black leading-none ${cc.iconColor}`}>{cc.symbol}</span>
                }
            </div>
            <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{cc.label} Volume</span>
                {loading ? (
                    <div className="h-6 w-20 rounded bg-slate-100 animate-pulse my-0.5" />
                ) : (
                    <p className="text-[15px] font-black text-slate-800 leading-tight truncate">
                        {cc.symbol}{formatCurrencyAmount(total, currency)}
                    </p>
                )}
                <span className="text-[11px] text-slate-400">{count.toLocaleString()} approved</span>
            </div>
        </div>
    );
}

export default function DepositStatCards({ summary, loading }: Props) {
    const currencyEntries = Object.entries(summary.approvedVolumeByCurrency ?? {})
        .filter(([, v]) => v.total > 0)
        .sort((a, b) => b[1].total - a[1].total);

    return (
        <div className="flex flex-col gap-3">
            {/* Row 1 — status + source counts (always 5 cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <CountCard label="Pending"        value={summary.pendingCount}       sub="awaiting review" accentClass="bg-amber-400"   loading={loading} />
                <CountCard label="Approved"       value={summary.approvedCount}      sub="total approved"  accentClass="bg-emerald-400" loading={loading} />
                <CountCard label="Rejected"       value={summary.rejectedCount}      sub="total rejected"  accentClass="bg-red-400"     loading={loading} />
                <CountCard label="Agent Requests" value={summary.totalAgentRequests} sub="by agents"       accentClass="bg-violet-400"  loading={loading} />
                <CountCard label="Client Requests"value={summary.totalClientRequests}sub="by clients"      accentClass="bg-blue-400"    loading={loading} />
            </div>

            {/* Row 2 — per-currency approved volume (only non-zero currencies) */}
            {(loading || currencyEntries.length > 0) && (
                <div className={`grid gap-3 ${
                    loading
                        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
                        : `grid-cols-2 sm:grid-cols-${Math.min(currencyEntries.length, 3)} lg:grid-cols-${Math.min(currencyEntries.length, 6)}`
                }`}>
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <CurrencyVolumeCard key={i} currency="USD" total={0} count={0} loading />
                        ))
                        : currencyEntries.map(([currency, { total, count }]) => (
                            <CurrencyVolumeCard key={currency} currency={currency} total={total} count={count} />
                        ))
                    }
                </div>
            )}

            {/* Edge: approved count > 0 but all zero volumes (unlikely but safe) */}
            {!loading && summary.approvedCount > 0 && currencyEntries.length === 0 && (
                <p className="text-[11px] text-slate-400 px-1">
                    Approved volume breakdown unavailable — no currency data found.
                </p>
            )}
        </div>
    );
}
