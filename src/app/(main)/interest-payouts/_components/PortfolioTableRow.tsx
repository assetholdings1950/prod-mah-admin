"use client";

import type { PortfolioInterface } from "@/interface/portfolio";
import {
    STATUS_CONFIG, MODE_CONFIG, PAYOUT_CONFIG, CATEGORY_CONFIG,
    getClientName, getClientEmail, getClientId,
    avatarGradient, getInitials,
    formatDate, fmtUsd, calcPayoutProgress,
} from "./types";

interface Props {
    portfolio: PortfolioInterface;
    onClick: (p: PortfolioInterface) => void;
}

export default function PortfolioTableRow({ portfolio, onClick }: Props) {
    const sc  = STATUS_CONFIG[portfolio.status] ?? STATUS_CONFIG.active;
    const mc  = MODE_CONFIG[portfolio.investmentMode] ?? MODE_CONFIG.lumpsum;
    const pc  = PAYOUT_CONFIG[portfolio.planSnapshot?.payoutType ?? "maturity"] ?? PAYOUT_CONFIG.maturity;
    const cat = CATEGORY_CONFIG[portfolio.planSnapshot?.category ?? "lumpsum"] ?? CATEGORY_CONFIG.lumpsum;

    const name     = getClientName(portfolio.clientId);
    const email    = getClientEmail(portfolio.clientId);
    const clientId = getClientId(portfolio.clientId);

    const paid     = portfolio.summary?.totalPaidProfitUsd ?? 0;
    const expected = portfolio.summary?.totalExpectedProfitUsd ?? 0;
    const progress = calcPayoutProgress(paid, expected);
    const pending  = Math.max(0, expected - paid);

    const roi = portfolio.planSnapshot?.roiMin
        ? portfolio.planSnapshot.roiType === "fixed" || portfolio.planSnapshot.roiMin === portfolio.planSnapshot.roiMax
            ? `${portfolio.planSnapshot.roiMin}%`
            : `${portfolio.planSnapshot.roiMin}–${portfolio.planSnapshot.roiMax}%`
        : "—";

    return (
        <tr
            onClick={() => onClick(portfolio)}
            className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer group"
        >
            {/* Client */}
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                        {getInitials(name)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{email}</p>
                        {clientId && <p className="text-[10px] font-mono text-slate-300">{clientId}</p>}
                    </div>
                </div>
            </td>

            {/* Portfolio ID */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <p className="text-[12px] font-mono font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    {portfolio.portfolioId}
                </p>
                <span className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cat.chip}`}>
                    {cat.label}
                </span>
            </td>

            {/* Plan */}
            <td className="px-4 py-3.5">
                <p className="text-[12.5px] font-medium text-slate-700 max-w-[160px] truncate">
                    {portfolio.planSnapshot?.name ?? "—"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded border ${mc.chip}`}>{mc.label}</span>
                    <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded border ${pc.chip}`}>{pc.label}</span>
                </div>
            </td>

            {/* Invested */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <p className="text-[13px] font-bold text-slate-800">{fmtUsd(portfolio.amountUsd)}</p>
                <p className="text-[11px] text-slate-400">{portfolio.durationMonths} months</p>
            </td>

            {/* Expected profit */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <p className="text-[13px] font-bold text-blue-600">{fmtUsd(expected)}</p>
                <p className="text-[11px] text-slate-400">ROI {roi} p.a.</p>
            </td>

            {/* Paid / Progress */}
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[12px] font-bold text-emerald-600">{fmtUsd(paid)}</p>
                            <span className="text-[10px] font-bold text-slate-400">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-emerald-400"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </td>

            {/* Pending */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <p className={`text-[13px] font-bold ${pending > 0 ? "text-amber-600" : "text-slate-400"}`}>
                    {fmtUsd(pending)}
                </p>
                <p className="text-[11px] text-slate-400">remaining</p>
            </td>

            {/* Maturity */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <p className="text-[12px] text-slate-600">{formatDate(portfolio.maturityDate)}</p>
                {portfolio.startedAt && (
                    <p className="text-[11px] text-slate-400">started {formatDate(portfolio.startedAt)}</p>
                )}
            </td>

            {/* Status */}
            <td className="px-4 py-3.5">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${sc.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                </span>
            </td>
        </tr>
    );
}
