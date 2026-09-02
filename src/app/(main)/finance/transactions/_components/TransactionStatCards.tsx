"use client";

import { ArrowDownCircle, ArrowUpCircle, TrendingUp, Coins, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { TransactionSummary } from "@/interface/transaction";
import { getCurrencyConfig, formatCurrencyAmount } from "./types";

interface Props {
    summary: TransactionSummary;
    loading?: boolean;
}

const EMPTY: TransactionSummary = {
    totalCount: 0, completedCount: 0, pendingCount: 0, failedCount: 0,
    depositCount: 0, withdrawalCount: 0, investmentCount: 0, earningCount: 0,
    completedVolume: 0, volumeByCurrency: {},
};

function CountCard({
    label, value, sub, icon: Icon, accentClass, loading,
}: {
    label: string; value: number; sub: string;
    icon: React.ElementType; accentClass: string; loading?: boolean;
}) {
    return (
        <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-4 flex items-start gap-3">
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />
            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accentClass.replace(/bg-(\w+)-(\d+)/, "bg-$1-100")}`}>
                <Icon size={15} className={accentClass.replace("bg-", "text-")} />
            </div>
            <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
                {loading
                    ? <div className="h-6 w-10 rounded bg-slate-100 animate-pulse my-0.5" />
                    : <p className="text-xl font-black text-slate-800 leading-tight">{value.toLocaleString()}</p>
                }
                <span className="text-[11px] text-slate-400">{sub}</span>
            </div>
        </div>
    );
}

function CurrencyVolumeCard({
    currency, total, count, loading,
}: {
    currency: string; total: number; count: number; loading?: boolean;
}) {
    const cc = getCurrencyConfig(currency);
    const CIcon = cc.icon;
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
                {loading
                    ? <div className="h-6 w-20 rounded bg-slate-100 animate-pulse my-0.5" />
                    : <p className="text-[15px] font-black text-slate-800 leading-tight truncate">
                        {cc.symbol}{formatCurrencyAmount(total, currency)}
                      </p>
                }
                <span className="text-[11px] text-slate-400">{count.toLocaleString()} completed</span>
            </div>
        </div>
    );
}

export default function TransactionStatCards({ summary = EMPTY, loading }: Props) {
    const currencyEntries = Object.entries(summary.volumeByCurrency ?? {})
        .filter(([, v]) => v.total > 0)
        .sort((a, b) => b[1].total - a[1].total);

    return (
        <div className="flex flex-col gap-3">
            {/* Row 1: counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <CountCard label="Completed" value={summary.completedCount} sub="transactions" icon={CheckCircle2} accentClass="bg-emerald-500" loading={loading} />
                <CountCard label="Pending"   value={summary.pendingCount}   sub="transactions" icon={Clock}         accentClass="bg-amber-400"  loading={loading} />
                <CountCard label="Failed"    value={summary.failedCount}    sub="transactions" icon={XCircle}       accentClass="bg-red-400"    loading={loading} />
                <CountCard label="Deposits"  value={summary.depositCount}   sub="transactions" icon={ArrowDownCircle} accentClass="bg-emerald-400" loading={loading} />
                <CountCard label="Withdrawals" value={summary.withdrawalCount} sub="transactions" icon={ArrowUpCircle} accentClass="bg-rose-400" loading={loading} />
                <CountCard label="Investments" value={summary.investmentCount} sub="transactions" icon={TrendingUp}  accentClass="bg-blue-400"   loading={loading} />
                <CountCard label="Earnings"  value={summary.earningCount}   sub="transactions" icon={Coins}         accentClass="bg-amber-500"  loading={loading} />
            </div>

            {/* Row 2: volume per currency (only non-zero) */}
            {(loading || currencyEntries.length > 0) && (
                <div className={`grid gap-3 ${loading ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : `grid-cols-2 sm:grid-cols-${Math.min(currencyEntries.length, 3)} lg:grid-cols-${Math.min(currencyEntries.length, 6)}`}`}>
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <CurrencyVolumeCard key={i} currency="USD" total={0} count={0} loading />
                        ))
                        : currencyEntries.map(([currency, { total, count }]) => (
                            <CurrencyVolumeCard key={currency} currency={currency} total={total} count={count} />
                        ))
                    }
                </div>
            )}
        </div>
    );
}
