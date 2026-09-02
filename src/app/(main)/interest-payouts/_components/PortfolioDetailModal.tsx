"use client";

import { useEffect, useRef } from "react";
import {
    X, Calendar, Wallet, BarChart3,
    CheckCircle2, AlertCircle, Layers, User, Hash,
} from "lucide-react";
import type { PortfolioInterface } from "@/interface/portfolio";
import {
    STATUS_CONFIG, MODE_CONFIG, PAYOUT_CONFIG, CATEGORY_CONFIG,
    getClientName, getClientEmail, getClientId,
    avatarGradient, getInitials,
    formatDate, fmtUsd, calcPayoutProgress,
    getCurrencyConfig, formatCurrencyAmount,
} from "./types";

interface Props {
    portfolio: PortfolioInterface | null;
    onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-[12px] text-slate-500 shrink-0">{label}</span>
            <span className="text-[12.5px] font-semibold text-slate-800 text-right">{value}</span>
        </div>
    );
}

function SectionHead({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex items-center gap-2 mb-3 mt-1">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon size={13} className="text-slate-500" />
            </div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</h4>
        </div>
    );
}

export default function PortfolioDetailModal({ portfolio, onClose }: Props) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    if (!portfolio) return null;

    const sc  = STATUS_CONFIG[portfolio.status] ?? STATUS_CONFIG.active;
    const mc  = MODE_CONFIG[portfolio.investmentMode] ?? MODE_CONFIG.lumpsum;
    const pc  = PAYOUT_CONFIG[portfolio.planSnapshot?.payoutType ?? "maturity"] ?? PAYOUT_CONFIG.maturity;
    const cat = CATEGORY_CONFIG[portfolio.planSnapshot?.category ?? "lumpsum"] ?? CATEGORY_CONFIG.lumpsum;
    const cc  = getCurrencyConfig(portfolio.paidFromWallet?.currency ?? "USD");

    const name     = getClientName(portfolio.clientId);
    const email    = getClientEmail(portfolio.clientId);
    const clientId = getClientId(portfolio.clientId);

    const paid     = portfolio.summary?.totalPaidProfitUsd ?? 0;
    const expected = portfolio.summary?.totalExpectedProfitUsd ?? 0;
    const progress = calcPayoutProgress(paid, expected);
    const pending  = Math.max(0, expected - paid);

    const roi = portfolio.planSnapshot?.roiMin
        ? portfolio.planSnapshot.roiType === "fixed" || portfolio.planSnapshot.roiMin === portfolio.planSnapshot.roiMax
            ? `${portfolio.planSnapshot.roiMin}% p.a.`
            : `${portfolio.planSnapshot.roiMin}–${portfolio.planSnapshot.roiMax}% p.a.`
        : "—";

    return (
        <div
            ref={overlayRef}
            onClick={e => { if (e.target === overlayRef.current) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-sm"
        >
            <div className="h-full w-full max-w-[520px] bg-white shadow-2xl overflow-y-auto flex flex-col">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[11px] font-mono font-semibold text-slate-400">{portfolio.portfolioId}</p>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.chip}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                {sc.label}
                            </span>
                        </div>
                        <h2 className="mt-1 text-[17px] font-bold text-slate-800 leading-tight">
                            {portfolio.planSnapshot?.name ?? "Portfolio"}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cat.chip}`}>{cat.label}</span>
                            <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded border ${mc.chip}`}>{mc.label}</span>
                            <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded border ${pc.chip}`}>{pc.label}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 shrink-0">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 px-6 py-5 space-y-6">

                    {/* Interest payout progress */}
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 p-5">
                        <p className="text-[10.5px] font-bold uppercase tracking-widest text-emerald-700 mb-3">Interest Payout Progress</p>
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <p className="text-[11px] text-emerald-600">Paid out</p>
                                <p className="text-[22px] font-black text-emerald-700 leading-tight">{fmtUsd(paid)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] text-blue-600">Expected total</p>
                                <p className="text-[18px] font-bold text-blue-700">{fmtUsd(expected)}</p>
                            </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/60 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[11px]">
                            <span className="text-emerald-600 font-semibold">{progress}% paid</span>
                            <span className="text-amber-600 font-semibold">{fmtUsd(pending)} remaining</span>
                        </div>
                    </div>

                    {/* Client */}
                    <div>
                        <SectionHead icon={User} label="Client" />
                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-[13px] font-bold shrink-0`}>
                                {getInitials(name)}
                            </div>
                            <div>
                                <p className="text-[13.5px] font-bold text-slate-800">{name}</p>
                                <p className="text-[12px] text-slate-500">{email}</p>
                                {clientId && <p className="text-[11px] font-mono text-slate-400">{clientId}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Investment details */}
                    <div>
                        <SectionHead icon={Wallet} label="Investment Details" />
                        <InfoRow label="Amount (USD)"   value={<span className="font-mono">{fmtUsd(portfolio.amountUsd)}</span>} />
                        <InfoRow label="Duration"       value={`${portfolio.durationMonths} months`} />
                        <InfoRow label="ROI"            value={roi} />
                        <InfoRow label="Paid With"      value={
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${cc.chip}`}>
                                {portfolio.paidFromWallet?.currency ?? "—"}
                                {portfolio.paidFromWallet?.amount != null && (
                                    <span className="font-mono ml-1">
                                        {formatCurrencyAmount(portfolio.paidFromWallet.amount, portfolio.paidFromWallet.currency)}
                                    </span>
                                )}
                            </span>
                        } />
                        {portfolio.paidFromWallet?.rate != null && (
                            <InfoRow label="Rate at Investment" value={`1 USD = ${portfolio.paidFromWallet.rate.toFixed(6)} ${portfolio.paidFromWallet.currency}`} />
                        )}
                    </div>

                    {/* Timeline */}
                    <div>
                        <SectionHead icon={Calendar} label="Timeline" />
                        <InfoRow label="Created"   value={formatDate(portfolio.createdAt)} />
                        <InfoRow label="Started"   value={formatDate(portfolio.startedAt)} />
                        <InfoRow label="Maturity"  value={formatDate(portfolio.maturityDate)} />
                        {portfolio.lockInEndDate && (
                            <InfoRow label="Lock-in End" value={formatDate(portfolio.lockInEndDate)} />
                        )}
                        {portfolio.closedAt && (
                            <InfoRow label="Closed"    value={formatDate(portfolio.closedAt)} />
                        )}
                    </div>

                    {/* Portfolio summary */}
                    <div>
                        <SectionHead icon={BarChart3} label="Portfolio Summary" />
                        <InfoRow label="Total Invested"     value={<span className="font-mono">{fmtUsd(portfolio.summary?.totalInvestedUsd)}</span>} />
                        <InfoRow label="Expected Profit"    value={<span className="font-mono text-blue-600">{fmtUsd(portfolio.summary?.totalExpectedProfitUsd)}</span>} />
                        <InfoRow label="Paid Profit"        value={<span className="font-mono text-emerald-600">{fmtUsd(portfolio.summary?.totalPaidProfitUsd)}</span>} />
                        <InfoRow label="Current Value"      value={<span className="font-mono">{fmtUsd(portfolio.summary?.currentValueUsd)}</span>} />
                        <InfoRow label="Expected Maturity"  value={<span className="font-mono">{fmtUsd(portfolio.summary?.expectedMaturityValueUsd)}</span>} />
                        <InfoRow label="Active Lots"        value={String(portfolio.summary?.activeLots ?? 0)} />
                        <InfoRow label="Total Lots"         value={String(portfolio.summary?.totalLots ?? 0)} />
                    </div>

                    {/* SIP metadata */}
                    {portfolio.investmentMode === "sip" && portfolio.sip && (
                        <div>
                            <SectionHead icon={Layers} label="SIP Details" />
                            <InfoRow label="Monthly Amount"      value={<span className="font-mono">{fmtUsd(portfolio.sip.monthlyAmountUsd)}</span>} />
                            <InfoRow label="Total Installments"  value={String(portfolio.sip.totalInstallments ?? "—")} />
                            <InfoRow label="Paid Installments"   value={
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    {portfolio.sip.paidInstallments}
                                </span>
                            } />
                            <InfoRow label="Missed Installments" value={
                                <span className="flex items-center gap-1">
                                    {portfolio.sip.missedInstallments > 0
                                        ? <AlertCircle size={12} className="text-rose-500" />
                                        : <CheckCircle2 size={12} className="text-emerald-500" />
                                    }
                                    {portfolio.sip.missedInstallments}
                                </span>
                            } />
                            <InfoRow label="Last Paid"  value={formatDate(portfolio.sip.lastPaidDate)} />
                            <InfoRow label="Next Due"   value={
                                <span className={portfolio.sip.nextDueDate ? "text-amber-600 font-semibold" : ""}>
                                    {formatDate(portfolio.sip.nextDueDate)}
                                </span>
                            } />
                        </div>
                    )}

                    {/* Lots breakdown */}
                    {portfolio.lots && portfolio.lots.length > 0 && (
                        <div>
                            <SectionHead icon={Hash} label={`Lots (${portfolio.lots.length})`} />
                            <div className="space-y-2">
                                {portfolio.lots.map(lot => (
                                    <div key={lot._id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lot #{lot.lotNo}</span>
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                                lot.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : lot.status === "matured" ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                            }`}>{lot.status}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px]">
                                            <div><span className="text-slate-400">Amount:</span> <span className="font-semibold">{fmtUsd(lot.amountUsd)}</span></div>
                                            <div><span className="text-slate-400">Paid:</span> <span className="font-semibold font-mono">{formatCurrencyAmount(lot.paidAmount, lot.paidCurrency)} {lot.paidCurrency}</span></div>
                                            <div><span className="text-slate-400">Monthly Int.:</span> <span className="font-semibold text-emerald-600">{fmtUsd(lot.monthlyInterestUsd)}</span></div>
                                            <div><span className="text-slate-400">Exp. Profit:</span> <span className="font-semibold text-blue-600">{fmtUsd(lot.expectedProfitUsd)}</span></div>
                                            <div><span className="text-slate-400">Invested:</span> <span className="font-semibold">{formatDate(lot.investedAt)}</span></div>
                                            <div><span className="text-slate-400">Matures:</span> <span className="font-semibold">{formatDate(lot.maturityDate)}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-3 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                        Updated {formatDate(portfolio.updatedAt)}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
