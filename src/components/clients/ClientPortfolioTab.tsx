"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Select from "@/components/common/Select";
import {
    AlertCircle, AlertTriangle, BarChart3, Banknote, Bitcoin,
    CalendarDays, CheckCircle2, ChevronDown, ChevronRight,
    Clock, Info, LockKeyhole, PauseCircle, RefreshCw,
    Trash2, TrendingUp, Wallet, X, XCircle,
} from "lucide-react";
import appClient from "@/lib/appClient";
import { useAppSelector } from "@/store/hooks/hooks";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";
import ConfirmModal from "@/app/(main)/finance/deposits/_components/ConfirmModal";

// ─── Inline helpers ────────────────────────────────────────────────────────────

function fmtFull(v: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD",
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(v);
}
function fmtDate(iso: string | null | undefined) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
function fmtCrypto(n: number) {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(n);
}
function daysBetween(from: string | null | undefined, to: string | null | undefined) {
    if (!from || !to) return 0;
    return Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
}
function addMonths(base: Date, months: number): Date {
    const d = new Date(base);
    d.setMonth(d.getMonth() + months);
    return d;
}

// ─── Payout schedule (inlined from client) ────────────────────────────────────

interface ScheduleRow { period: string; date: Date; periodicAmount: number; cumulative: number; isMaturity: boolean; }

function buildPayoutSchedule(p: Portfolio): ScheduleRow[] {
    if (!p.startedAt) return [];
    const snap = p.planSnapshot;
    const roiMin = snap.roiMin ?? 0;
    const monthlyInt = (p.amountUsd * roiMin / 100) / 12;
    const start = new Date(p.startedAt);
    const duration = p.durationMonths;
    const payoutType = snap.payoutType;
    const isSip = p.investmentMode === "sip";
    const rows: ScheduleRow[] = [];

    const shortMonth = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    if (isSip) {
        const totalInst = p.sip?.totalInstallments ?? duration;
        if (payoutType === "maturity") {
            let cum = 0;
            for (let i = 0; i < totalInst; i++) {
                const lotProfit = monthlyInt * Math.max(1, duration - i);
                cum += lotProfit;
                rows.push({ period: `Inst. ${i + 1} — ${shortMonth(addMonths(start, i))}`, date: addMonths(start, duration), periodicAmount: lotProfit, cumulative: cum, isMaturity: i === totalInst - 1 });
            }
        } else {
            const groupByYear = duration > 24;
            if (groupByYear) {
                const totalYears = Math.ceil(duration / 12);
                let totalCum = 0;
                for (let y = 1; y <= totalYears; y++) {
                    const yEnd = Math.min(y * 12, duration);
                    let yearTotal = 0;
                    for (let m = (y - 1) * 12 + 1; m <= yEnd; m++) yearTotal += Math.min(m, totalInst) * monthlyInt;
                    totalCum += yearTotal;
                    rows.push({ period: `Year ${y}`, date: addMonths(start, yEnd), periodicAmount: yearTotal, cumulative: totalCum, isMaturity: yEnd >= duration });
                }
            } else {
                let cum = 0;
                for (let m = 1; m <= duration; m++) {
                    const income = Math.min(m, totalInst) * monthlyInt;
                    cum += income;
                    rows.push({ period: shortMonth(addMonths(start, m)), date: addMonths(start, m), periodicAmount: income, cumulative: cum, isMaturity: m === duration });
                }
            }
        }
        return rows;
    }

    if (payoutType === "monthly") {
        const groupByYear = duration > 24;
        if (groupByYear) {
            const totalYears = Math.ceil(duration / 12);
            for (let y = 1; y <= totalYears; y++) {
                const elapsed = Math.min(y * 12, duration);
                rows.push({ period: `Year ${y}`, date: addMonths(start, elapsed), periodicAmount: monthlyInt * (elapsed - (y - 1) * 12), cumulative: monthlyInt * elapsed, isMaturity: elapsed >= duration });
            }
        } else {
            for (let m = 1; m <= duration; m++) rows.push({ period: shortMonth(addMonths(start, m)), date: addMonths(start, m), periodicAmount: monthlyInt, cumulative: monthlyInt * m, isMaturity: m === duration });
        }
    } else if (payoutType === "quarterly") {
        let cum = 0;
        for (let m = 3; m <= duration; m += 3) {
            cum += monthlyInt * 3;
            rows.push({ period: `Q${Math.round(m / 3)} — ${shortMonth(addMonths(start, m))}`, date: addMonths(start, m), periodicAmount: monthlyInt * 3, cumulative: cum, isMaturity: m >= duration });
        }
        const rem = duration % 3;
        if (rem > 0) { cum += monthlyInt * rem; rows.push({ period: `Final — ${shortMonth(addMonths(start, duration))}`, date: addMonths(start, duration), periodicAmount: monthlyInt * rem, cumulative: cum, isMaturity: true }); }
    } else {
        for (let y = 1; y * 12 <= duration; y++) rows.push({ period: `Year ${y}`, date: addMonths(start, y * 12), periodicAmount: monthlyInt * 12, cumulative: monthlyInt * y * 12, isMaturity: y * 12 === duration });
        const rem = duration % 12;
        if (rem > 0) rows.push({ period: "Maturity", date: addMonths(start, duration), periodicAmount: monthlyInt * rem, cumulative: monthlyInt * duration, isMaturity: true });
        if (rows.length) rows[rows.length - 1].isMaturity = true;
    }
    return rows;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioLot { _id: string; lotNo: number; amountUsd: number; paidCurrency: string; paidAmount: number; rate: number; expectedProfitUsd: number; maturityDate: string; status: "active" | "matured" | "closed"; }

interface Portfolio {
    _id: string;
    portfolioId: string;
    investmentMode: "sip" | "lumpsum";
    amountUsd: number;
    durationMonths: number;
    status: "active" | "paused" | "matured" | "closed" | "cancelled";
    planSnapshot: { name: string; category: string; riskLevel: string; roiMin: number; roiMax?: number; roiPeriod: string; payoutType: string; exitPenaltyPercent?: number; lockInMonths?: number | null; };
    paidFromWallet: { currency: string; amount: number; rate: number; source?: string; lockedAt?: string; };
    sip?: { monthlyAmountUsd: number | null; totalInstallments: number | null; paidInstallments: number; missedInstallments: number; nextDueDate: string | null; lastPaidDate: string | null; } | null;
    lots?: PortfolioLot[];
    summary: { totalInvestedUsd: number; totalExpectedProfitUsd: number; totalPaidProfitUsd: number; currentValueUsd: number; expectedMaturityValueUsd: number; totalLots: number; activeLots: number; maturedLots: number; };
    closedSummary?: { reason: "maturity" | "early_exit" | "admin" | null; note: string | null; principal: number | null; earnedUsd: number | null; penaltyPct: number | null; penaltyUsd: number | null; chargesBreakdown: { particular: string; chargePercent: number; chargeUsd: number }[]; totalChargesUsd: number; netRefundUsd: number | null; payoutCurrency: string | null; convertedAmount: number | null; rate: number | null; } | null;
    startedAt: string | null;
    maturityDate: string | null;
    lockInEndDate?: string | null;
    closedAt?: string | null;
    createdAt: string;
}

type ConfirmState = { open: boolean; title: string; description: string; confirmLabel: string; variant: "danger" | "warning" | "success"; onConfirm: () => void; };
const CLOSED_CONFIRM: ConfirmState = { open: false, title: "", description: "", confirmLabel: "", variant: "danger", onConfirm: () => { } };

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
    active: "bg-emerald-500", paused: "bg-amber-400",
    matured: "bg-blue-500", closed: "bg-slate-400", cancelled: "bg-red-400",
};
const STATUS_BADGE: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paused: "bg-amber-50 text-amber-700 border-amber-200",
    matured: "bg-blue-50 text-blue-700 border-blue-200",
    closed: "bg-slate-50 text-slate-600 border-slate-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
};
const STATUS_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    active: CheckCircle2, paused: PauseCircle, matured: BarChart3, closed: XCircle, cancelled: AlertTriangle,
};
const CATEGORY_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    monthly: BarChart3, lumpsum: Banknote, crypto: Bitcoin,
};
const CATEGORY_LABEL: Record<string, string> = { monthly: "Monthly SIP", lumpsum: "Lump Sum", crypto: "Digital Assets" };
const LOT_STATUS_CLS: Record<string, string> = { active: "bg-emerald-50 text-emerald-700", matured: "bg-blue-50 text-blue-700", closed: "bg-slate-100 text-slate-500" };
import React from "react";

// ─── Tiny shared primitives ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-50">
                <h4 className="text-[13px] font-bold text-slate-800">{title}</h4>
            </div>
            <div className="px-5 py-4">{children}</div>
        </div>
    );
}

function IRow({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
                <span className="text-slate-400">{icon}</span>{label}
            </div>
            <span className={`text-[12px] font-semibold text-slate-800 ${valueClass ?? ""}`}>{value}</span>
        </div>
    );
}

function MiniStat({ label, value, green }: { label: string; value: string; green?: boolean }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1.5 text-[13px] font-bold ${green ? "text-emerald-600" : "text-slate-800"}`}>{value}</p>
        </div>
    );
}

// ─── Expanded detail sections ──────────────────────────────────────────────────

function ProgressBar({ p }: { p: Portfolio }) {
    if (!p.startedAt || !p.maturityDate) return null;
    const total = daysBetween(p.startedAt, p.maturityDate);
    const elapsed = daysBetween(p.startedAt, new Date().toISOString());
    const pct = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-400">
                <span>{fmtDate(p.startedAt)}</span>
                <span className="font-semibold text-slate-600">{pct}% elapsed</span>
                <span>{fmtDate(p.maturityDate)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function PlanDetailsSection({ p }: { p: Portfolio }) {
    const snap = p.planSnapshot;
    return (
        <Section title="Plan Details">
            <IRow icon={<TrendingUp size={13} />} label="Plan Type" value={CATEGORY_LABEL[snap.category] ?? snap.category} />
            <IRow icon={<BarChart3 size={13} />} label="Expected ROI"
                value={`${snap.roiMin}%${snap.roiMax && snap.roiMax !== snap.roiMin ? ` – ${snap.roiMax}%` : ""} p.a.`} />
            <IRow icon={<Clock size={13} />} label="Payout Type"
                value={{ monthly: "Monthly", quarterly: "Quarterly", maturity: "At Maturity" }[snap.payoutType] ?? snap.payoutType} />
            <IRow icon={<CalendarDays size={13} />} label="Start Date" value={fmtDate(p.startedAt)} />
            <IRow icon={<CalendarDays size={13} />} label="Maturity Date" value={fmtDate(p.maturityDate)} />
            {p.lockInEndDate && <IRow icon={<LockKeyhole size={13} />} label="Lock-in Ends" value={fmtDate(p.lockInEndDate)} />}
            {snap.exitPenaltyPercent ? <IRow icon={<AlertTriangle size={13} />} label="Exit Penalty" value={`${snap.exitPenaltyPercent}%`} valueClass="text-red-600" /> : null}
        </Section>
    );
}

function PaymentDetailsSection({ p }: { p: Portfolio }) {
    const paid = p.paidFromWallet;
    return (
        <Section title="Payment Details">
            <IRow icon={<Wallet size={13} />} label="Paid Currency" value={paid.currency} />
            <IRow icon={<Banknote size={13} />} label="Amount Paid" value={`${fmtCrypto(paid.amount)} ${paid.currency}`} />
            <IRow icon={<TrendingUp size={13} />} label="Rate Used" value={`1 USD = ${fmtCrypto(paid.rate)} ${paid.currency}`} />
            {paid.lockedAt && <IRow icon={<LockKeyhole size={13} />} label="Rate Locked At" value={fmtDate(paid.lockedAt)} />}
        </Section>
    );
}

function SipProgressSection({ p }: { p: Portfolio }) {
    const sip = p.sip;
    if (!sip) return null;
    const total = sip.totalInstallments ?? 0;
    const paid = sip.paidInstallments;
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
    return (
        <Section title="SIP Progress">
            <div className="flex items-end justify-between text-[12px] mb-2">
                <span className="text-slate-500">{paid} of {total} installments paid</span>
                <span className="font-bold text-primary">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                {sip.nextDueDate && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Next Due</p>
                        <p className="mt-1 text-[12px] font-bold text-slate-800">{fmtDate(sip.nextDueDate)}</p>
                    </div>
                )}
                {sip.lastPaidDate && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Last Paid</p>
                        <p className="mt-1 text-[12px] font-bold text-slate-800">{fmtDate(sip.lastPaidDate)}</p>
                    </div>
                )}
                {sip.monthlyAmountUsd != null && (
                    <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Monthly Amount</p>
                        <p className="mt-1 text-[12px] font-bold text-slate-800">{fmtFull(sip.monthlyAmountUsd)}</p>
                    </div>
                )}
                {(sip.missedInstallments ?? 0) > 0 && (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-rose-600">Missed</p>
                        <p className="mt-1 text-[12px] font-bold text-rose-700">{sip.missedInstallments}</p>
                    </div>
                )}
            </div>
            {(sip.missedInstallments ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-[12px] text-rose-700">
                    <AlertCircle size={14} className="shrink-0" />
                    {sip.missedInstallments} missed installment{sip.missedInstallments > 1 ? "s" : ""}
                </div>
            )}
        </Section>
    );
}

function ClosedSummarySection({ p }: { p: Portfolio }) {
    const cs = p.closedSummary;
    if (p.status !== "closed" || !cs) return null;
    const isEarlyExit = cs.reason === "early_exit";
    return (
        <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
            <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isEarlyExit ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"}`}>
                <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isEarlyExit ? "bg-rose-100" : "bg-emerald-100"}`}>
                        {isEarlyExit ? <X size={14} className="text-rose-600" /> : <CheckCircle2 size={14} className="text-emerald-600" />}
                    </div>
                    <div>
                        <p className="text-[12px] font-bold text-slate-800">Plan Closed</p>
                        {cs.note && <p className="text-[11px] text-slate-500">{cs.note}</p>}
                    </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${isEarlyExit ? "border-rose-200 bg-rose-100 text-rose-700" : "border-emerald-200 bg-emerald-100 text-emerald-700"}`}>
                    {cs.reason === "early_exit" ? "Early Exit" : cs.reason === "maturity" ? "Maturity" : "Admin Closed"}
                </span>
            </div>
            <div className="px-5 py-4">
                <p className="mb-3 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Amount Breakdown</p>
                <table className="w-full text-[12px]">
                    <tbody className="divide-y divide-slate-50">
                        <tr><td className="py-2 text-slate-500">Principal</td><td className="py-2 text-right font-semibold text-slate-800">{fmtFull(cs.principal ?? 0)}</td></tr>
                        <tr><td className="py-2 text-slate-500">Earnings Accrued</td><td className="py-2 text-right font-semibold text-emerald-600">+{fmtFull(cs.earnedUsd ?? 0)}</td></tr>
                        {(cs.penaltyPct ?? 0) > 0 && (
                            <tr><td className="py-2 text-slate-500">Early Exit Penalty <span className="text-rose-500">({cs.penaltyPct}%)</span></td><td className="py-2 text-right font-semibold text-rose-500">−{fmtFull(cs.penaltyUsd ?? 0)}</td></tr>
                        )}
                        {(cs.chargesBreakdown ?? []).map((ch, i) => (
                            <tr key={i}><td className="py-2 text-slate-500">{ch.particular} <span className="text-rose-400">({ch.chargePercent}%)</span></td><td className="py-2 text-right font-semibold text-rose-400">−{fmtFull(ch.chargeUsd)}</td></tr>
                        ))}
                        <tr className="border-t border-slate-200"><td className="pt-3 pb-1 font-bold text-slate-800">Net Received</td><td className="pt-3 pb-1 text-right text-[14px] font-bold text-primary">{fmtFull(cs.netRefundUsd ?? 0)}</td></tr>
                    </tbody>
                </table>
            </div>
            {cs.payoutCurrency && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                    <p className="mb-3 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Fund Transfer</p>
                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-[12px]">
                        <div><p className="text-slate-400">Currency</p><p className="font-bold text-slate-800 mt-0.5">{cs.payoutCurrency}</p></div>
                        <div><p className="text-slate-400">Amount Transferred</p><p className="font-bold text-slate-800 mt-0.5">{fmtCrypto(cs.convertedAmount ?? 0)} {cs.payoutCurrency}</p></div>
                        <div><p className="text-slate-400">Rate Used</p><p className="font-bold text-slate-800 mt-0.5">1 USD = {fmtCrypto(cs.rate ?? 0)} {cs.payoutCurrency}</p></div>
                        {p.closedAt && <div><p className="text-slate-400">Closed On</p><p className="font-bold text-slate-800 mt-0.5">{fmtDate(p.closedAt)}</p></div>}
                    </div>
                </div>
            )}
        </div>
    );
}

function DailyEarningsSection({ p }: { p: Portfolio }) {
    const [showAll, setShowAll] = useState(false);
    const DAILY_PAGE = 30;

    if (p.investmentMode === "sip" || !p.startedAt || !p.maturityDate) return null;
    const snap = p.planSnapshot;
    const dailyRate = (p.amountUsd * (snap.roiMin ?? 0)) / 100 / 365;
    const maxProfit = p.summary.totalExpectedProfitUsd;
    const start = new Date(p.startedAt);
    const maturity = new Date(p.maturityDate);
    const today = new Date();
    const isActiveToday = today < maturity;
    const effectiveEnd = isActiveToday ? today : maturity;
    const elapsedDays = Math.max(0, Math.floor((effectiveEnd.getTime() - start.getTime()) / 86400000));
    const totalEarned = Math.min(dailyRate * elapsedDays, maxProfit);
    const displayCount = showAll ? elapsedDays : Math.min(DAILY_PAGE, elapsedDays);
    const rows = Array.from({ length: displayCount }, (_, i) => {
        const day = elapsedDays - i;
        return { date: new Date(start.getTime() + day * 86400000), day, cumulative: Math.min(dailyRate * day, maxProfit) };
    });

    return (
        <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-50">
                <div>
                    <h4 className="text-[13px] font-bold text-slate-800">Daily Earnings</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        {elapsedDays === 0
                            ? "Started today — first earning accrues tomorrow"
                            : `Accruing since ${start.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} · ${elapsedDays} day${elapsedDays !== 1 ? "s" : ""} elapsed`}
                    </p>
                    {isActiveToday && elapsedDays > 0 && (
                        <div className="mt-1.5 flex items-start gap-1.5">
                            <Info size={12} className="shrink-0 text-primary mt-0.5" />
                            <p className="text-[10.5px] text-slate-400">
                                Interest accrues every 24 h from <span className="font-semibold text-slate-700">{start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>. Next at{" "}
                                <span className="font-semibold text-slate-700">{new Date(start.getTime() + (elapsedDays + 1) * 86400000).toLocaleString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}</span>.
                            </p>
                        </div>
                    )}
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Earned So Far</p>
                    <p className="text-[16px] font-bold text-emerald-600">{fmtFull(totalEarned)}</p>
                </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                {[["Daily Rate", fmtFull(dailyRate)], ["Days Active", String(elapsedDays)], ["Remaining", fmtFull(Math.max(0, maxProfit - totalEarned))]].map(([l, v]) => (
                    <div key={l} className="px-5 py-3.5 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{l}</p>
                        <p className="mt-1 text-[12px] font-bold text-slate-800">{v}</p>
                    </div>
                ))}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                    <thead><tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 text-left">Date</th>
                        <th className="px-5 py-3 text-center">Day</th>
                        <th className="px-5 py-3 text-right">Daily Earning</th>
                        <th className="px-5 py-3 text-right">Total Earned</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                        {rows.length === 0 ? (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-[11px] text-slate-400">First earning of {fmtFull(dailyRate)} accrues after 24 hours.</td></tr>
                        ) : rows.map(row => {
                            const isLatest = row.day === elapsedDays && isActiveToday;
                            return (
                                <tr key={row.day} className={isLatest ? "bg-emerald-50/60" : "hover:bg-slate-50"}>
                                    <td className="px-5 py-3">
                                        <span className={`font-medium ${isLatest ? "text-emerald-700" : "text-slate-800"}`}>{row.date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                                        {isLatest && <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700">Today</span>}
                                    </td>
                                    <td className="px-5 py-3 text-center font-mono text-[11px] text-slate-400">#{row.day}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-primary">{fmtFull(dailyRate)}</td>
                                    <td className={`px-5 py-3 text-right font-bold ${isLatest ? "text-emerald-600" : "text-slate-800"}`}>{fmtFull(row.cumulative)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {elapsedDays > DAILY_PAGE && (
                <div className="border-t border-slate-100 px-5 py-3 text-center">
                    <button onClick={() => setShowAll(v => !v)} className="text-[12px] font-semibold text-primary hover:underline">
                        {showAll ? "Show recent days only" : `Show all ${elapsedDays.toLocaleString()} days`}
                    </button>
                </div>
            )}
        </div>
    );
}

function ProfitScheduleSection({ p }: { p: Portfolio }) {
    if (!p.startedAt) return null;
    const rows = buildPayoutSchedule(p);
    if (!rows.length) return null;
    const snap = p.planSnapshot;
    const isSip = p.investmentMode === "sip";
    const isMaturity = snap.payoutType === "maturity";
    const periodicHeader = isSip ? (isMaturity ? "Lot Profit" : "Period Income") : snap.payoutType === "quarterly" ? "Quarterly" : isMaturity ? "Accrued" : "Monthly";
    const dateHeader = isSip && isMaturity ? "Matures On" : "Payout Date";
    const payoutLabel = { monthly: "Monthly Payouts", quarterly: "Quarterly Payouts", maturity: "At Maturity" }[snap.payoutType] ?? "Payouts";
    const totalProfit = p.summary.totalExpectedProfitUsd;
    return (
        <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-50">
                <div>
                    <h4 className="text-[13px] font-bold text-slate-800">Profit Schedule</h4>
                    <p className="mt-0.5 text-[11px] text-slate-500">{isSip ? "SIP" : "Lump Sum"} · {payoutLabel} · {snap.roiMin}% p.a.</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total Profit</p>
                    <p className="text-[14px] font-bold text-emerald-600">{fmtFull(totalProfit)}</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                    <thead><tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 text-left w-[35%]">Period</th>
                        <th className="px-5 py-3 text-right">{dateHeader}</th>
                        <th className="px-5 py-3 text-right">{periodicHeader}</th>
                        <th className="px-5 py-3 text-right">Cumulative</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                        {rows.map((row, i) => (
                            <tr key={i} className={row.isMaturity ? "bg-emerald-50/60" : "hover:bg-slate-50"}>
                                <td className="px-5 py-3">
                                    <span className={`font-medium ${row.isMaturity ? "text-emerald-700" : "text-slate-800"}`}>{row.period}</span>
                                    {row.isMaturity && <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700">Maturity</span>}
                                </td>
                                <td className="px-5 py-3 text-right text-slate-500">{row.date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                                <td className={`px-5 py-3 text-right font-semibold ${row.isMaturity ? "text-emerald-600" : "text-primary"}`}>{fmtFull(row.periodicAmount)}</td>
                                <td className="px-5 py-3 text-right font-bold text-slate-800">{fmtFull(row.cumulative)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                            <td colSpan={2} className="px-5 py-3.5 text-[12px] font-bold text-slate-800">Total Expected Profit</td>
                            <td colSpan={2} className="px-5 py-3.5 text-right text-[13px] font-bold text-emerald-600">{fmtFull(totalProfit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

function LotsTableSection({ lots, loading }: { lots?: PortfolioLot[]; loading: boolean }) {
    if (loading) return (
        <div className="rounded-xl border border-slate-100 bg-white p-5">
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse mb-4" />
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-50 rounded animate-pulse" />)}</div>
        </div>
    );
    if (!lots || !lots.length) return null;
    return (
        <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
                <h4 className="text-[13px] font-bold text-slate-800">Investment Lots</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{lots.length} lot{lots.length !== 1 ? "s" : ""} total</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                    <thead><tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 text-left">Lot #</th>
                        <th className="px-5 py-3 text-right">Invested</th>
                        <th className="px-5 py-3 text-right">Paid (Crypto)</th>
                        <th className="px-5 py-3 text-right">Est. Profit</th>
                        <th className="px-5 py-3 text-right">Maturity</th>
                        <th className="px-5 py-3 text-center">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                        {lots.map(lot => (
                            <tr key={lot._id} className="hover:bg-slate-50">
                                <td className="px-5 py-3.5 font-mono text-slate-500">#{lot.lotNo}</td>
                                <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{fmtFull(lot.amountUsd)}</td>
                                <td className="px-5 py-3.5 text-right text-slate-600">{fmtCrypto(lot.paidAmount)} {lot.paidCurrency}</td>
                                <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">{fmtFull(lot.expectedProfitUsd)}</td>
                                <td className="px-5 py-3.5 text-right text-slate-500">{fmtDate(lot.maturityDate)}</td>
                                <td className="px-5 py-3.5 text-center">
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${LOT_STATUS_CLS[lot.status] ?? "bg-slate-100 text-slate-500"}`}>{lot.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusChecksSection({ p }: { p: Portfolio }) {
    const isSip = p.investmentMode === "sip";
    const snap = p.planSnapshot;
    const checks = [
        { ok: p.status === "active", label: "Portfolio is active" },
        { ok: p.summary.activeLots > 0 || p.summary.maturedLots > 0, label: `${p.summary.totalLots} lot${p.summary.totalLots !== 1 ? "s" : ""} recorded` },
        { ok: !isSip || (p.sip?.missedInstallments ?? 0) === 0, label: "No missed installments" },
        snap.payoutType === "maturity"
            ? { ok: p.status === "matured" || p.status === "closed", label: p.status === "matured" || p.status === "closed" ? `${fmtFull(p.summary.totalExpectedProfitUsd)} profit at maturity — claimed/closed` : `${fmtFull(p.summary.totalExpectedProfitUsd)} earns at maturity` }
            : { ok: p.summary.totalPaidProfitUsd > 0, label: `${fmtFull(p.summary.totalPaidProfitUsd)} profit paid out` },
    ];
    return (
        <Section title="Status Checks">
            <div className="space-y-2.5">
                {checks.map(({ ok, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                        {ok ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" /> : <X size={15} className="text-slate-300 shrink-0" />}
                        <p className={`text-[12px] ${ok ? "text-slate-800" : "text-slate-400"}`}>{label}</p>
                    </div>
                ))}
            </div>
        </Section>
    );
}

// ─── Expanded detail wrapper ────────────────────────────────────────────────────

function ExpandedDetail({
    listData, detail, loadingDetail, isAdmin, isSuperAdmin,
    updatingStatus, onStatusChange, onDeleteOne,
}: {
    listData: Portfolio;
    detail: Portfolio | null;
    loadingDetail: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    updatingStatus: boolean;
    onStatusChange: (id: string, status: string) => void;
    onDeleteOne: (p: Portfolio) => void;
}) {
    const p = detail ?? listData;
    const snap = p.planSnapshot;
    const CatIcon = CATEGORY_ICON[snap.category] ?? BarChart3;
    const isSip = p.investmentMode === "sip";

    return (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5 space-y-4">
            {/* Admin controls */}
            {(isAdmin || isSuperAdmin) && (
                <div className="flex items-center gap-3 flex-wrap">
                    {isAdmin && (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                            <Select
                                size="sm"
                                disabled={updatingStatus}
                                value={p.status}
                                onChange={(v) => onStatusChange(p._id, v)}
                                options={["active","paused","matured","closed","cancelled"].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                            />
                        </div>
                    )}
                    {isSuperAdmin && (
                        <button
                            onClick={() => onDeleteOne(listData)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded-lg transition-all shadow-sm"
                        >
                            <Trash2 size={11} /> Delete Portfolio
                        </button>
                    )}
                </div>
            )}

            {/* Hero stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Invested", value: fmtFull(p.summary.totalInvestedUsd) },
                    { label: "Expected Profit", value: fmtFull(p.summary.totalExpectedProfitUsd), sub: `ROI ${snap.roiMin}%${snap.roiMax && snap.roiMax !== snap.roiMin ? ` – ${snap.roiMax}%` : ""}` },
                    { label: "Maturity Value", value: fmtFull(p.summary.expectedMaturityValueUsd) },
                    { label: "Duration", value: `${p.durationMonths} mo`, sub: `Matures ${fmtDate(p.maturityDate)}` },
                ].map(card => (
                    <div key={card.label} className="rounded-xl bg-white border border-slate-100 shadow-sm px-4 py-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
                        <p className="mt-1 text-[15px] font-bold text-slate-800 leading-tight">{card.value}</p>
                        {card.sub && <p className="text-[10.5px] text-slate-400 mt-0.5">{card.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="rounded-xl bg-white border border-slate-100 px-4 py-3.5">
                <div className="flex items-center gap-2 mb-2">
                    <CatIcon size={14} className="text-slate-400" />
                    <span className="text-[12px] font-semibold text-slate-700">{snap.name}</span>
                    <span className="font-mono text-[10px] text-slate-400 ml-1">{p.portfolioId}</span>
                </div>
                <ProgressBar p={p} />
            </div>

            {/* Closed summary */}
            <ClosedSummarySection p={p} />

            {/* Plan + Payment details side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PlanDetailsSection p={p} />
                <PaymentDetailsSection p={p} />
            </div>

            {/* SIP progress */}
            {isSip && p.sip && <SipProgressSection p={p} />}

            {/* Portfolio summary */}
            <Section title="Portfolio Summary">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <MiniStat label="Total Invested" value={fmtFull(p.summary.totalInvestedUsd)} />
                    <MiniStat label="Expected Profit" value={fmtFull(p.summary.totalExpectedProfitUsd)} green />
                    <MiniStat label="Maturity Value" value={fmtFull(p.summary.expectedMaturityValueUsd)} />
                    <MiniStat label="Profit Paid" value={fmtFull(p.summary.totalPaidProfitUsd)} />
                    <MiniStat label="Current Value" value={fmtFull(p.summary.currentValueUsd)} />
                    <MiniStat label="Active Lots" value={`${p.summary.activeLots} / ${p.summary.totalLots}`} />
                </div>
            </Section>

            {/* Daily earnings (lumpsum only) */}
            {!isSip && <DailyEarningsSection p={p} />}

            {/* Profit schedule */}
            <ProfitScheduleSection p={p} />

            {/* Lots table */}
            <LotsTableSection lots={p.lots} loading={loadingDetail} />

            {/* Status checks */}
            <StatusChecksSection p={p} />
        </div>
    );
}

// ─── Portfolio list row ────────────────────────────────────────────────────────

function PortfolioRow({
    p, isExpanded, isAdmin, isSuperAdmin,
    updatingStatus, detail, loadingDetail,
    onToggle, onStatusChange, onDeleteOne,
}: {
    p: Portfolio;
    isExpanded: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    updatingStatus: string | null;
    detail: Portfolio | null;
    loadingDetail: boolean;
    onToggle: (id: string) => void;
    onStatusChange: (id: string, status: string) => void;
    onDeleteOne: (p: Portfolio) => void;
}) {
    const snap = p.planSnapshot;
    const CatIcon = CATEGORY_ICON[snap.category] ?? BarChart3;
    const SIcon = STATUS_ICON[p.status] ?? CheckCircle2;
    return (
        <div className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${isExpanded ? "border-primary/30 shadow-md" : "border-slate-100 hover:border-slate-200"}`}>
            {/* Row header — click to expand */}
            <button
                onClick={() => onToggle(p._id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
                {/* Chevron */}
                <span className="shrink-0 text-slate-400 transition-transform">
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>

                {/* Status dot + category icon */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[p.status] ?? "bg-slate-400"}`} />
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <CatIcon size={14} className="text-slate-500" />
                    </div>
                </div>

                {/* Plan name + ID */}
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{snap.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-[10px] text-slate-400">{p.portfolioId}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase`}>{p.investmentMode}</span>
                        {p.planSnapshot.riskLevel && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 capitalize">{p.planSnapshot.riskLevel.replace("_", " ")} risk</span>
                        )}
                    </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-[13px] font-bold text-slate-800">{fmtFull(p.amountUsd)}</p>
                    <p className="text-[10px] text-slate-400">{p.durationMonths} mo</p>
                </div>

                {/* Status badge */}
                <span className={`shrink-0 flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-lg border ${STATUS_BADGE[p.status] ?? ""}`}>
                    <SIcon size={10} />
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>

                {/* Maturity date */}
                <div className="shrink-0 hidden md:block text-right min-w-[90px]">
                    <p className="text-[10px] text-slate-400">Matures</p>
                    <p className="text-[11px] font-semibold text-slate-600">{fmtDate(p.maturityDate)}</p>
                </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
                <ExpandedDetail
                    listData={p}
                    detail={detail}
                    loadingDetail={loadingDetail}
                    isAdmin={isAdmin}
                    isSuperAdmin={isSuperAdmin}
                    updatingStatus={updatingStatus === p._id}
                    onStatusChange={onStatusChange}
                    onDeleteOne={onDeleteOne}
                />
            )}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props { clientId: string; userModel?: "Client" | "Agent"; }

const VALID_STATUSES = ["all", "active", "paused", "matured", "closed", "cancelled"];

export default function ClientPortfolioTab({ clientId }: Props) {
    const currentUser = useAppSelector((s) => s.auth.user);
    const isSuperAdmin = currentUser?.role?.some((r) => r.roleCode === "superadmin") ?? false;
    const isAdmin = currentUser?.role?.some((r) => ["admin", "superadmin"].includes(r.roleCode)) ?? false;

    const router = useRouter();
    const searchParams = useSearchParams();
    const rawStatus = searchParams.get("status") ?? "all";
    const filterStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : "all";

    const setFilterStatus = (s: string) => {
        const next = new URLSearchParams(searchParams.toString());
        if (s === "all") next.delete("status"); else next.set("status", s);
        router.replace(`?${next.toString()}`, { scroll: false });
    };

    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedDetail, setExpandedDetail] = useState<Portfolio | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);
    const [deleting, setDeleting] = useState(false);

    const fetchPortfolios = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: "1", limit: "100", search: "", clientId });
            if (filterStatus !== "all") params.set("status", filterStatus);
            const res = await appClient.get(`/api/portfolio/admin/list?${params.toString()}`);
            setPortfolios(res.data?.portfolios ?? []);
        } catch {
            toastError("Failed to load portfolios.");
        } finally {
            setLoading(false);
            setFetched(true);
        }
    }, [clientId, filterStatus]);

    useEffect(() => { fetchPortfolios(); }, [fetchPortfolios]);

    const handleToggle = useCallback(async (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setExpandedDetail(null);
            return;
        }
        setExpandedId(id);
        setExpandedDetail(null);
        setLoadingDetail(true);
        try {
            const res = await appClient.get(`/api/portfolio/admin/detail/${id}`);
            setExpandedDetail(res.data?.data ?? null);
        } catch {
            // non-critical: list data still shows, just no lots table
        } finally {
            setLoadingDetail(false);
        }
    }, [expandedId]);

    const handleStatusChange = async (portfolioId: string, newStatus: string) => {
        setUpdatingStatus(portfolioId);
        try {
            await appClient.patch(`/api/portfolio/admin/${portfolioId}/status`, { status: newStatus });
            toastSuccess(`Portfolio updated to ${newStatus}.`);
            setPortfolios(prev => prev.map(p => p._id === portfolioId ? { ...p, status: newStatus as Portfolio["status"] } : p));
            if (expandedDetail?._id === portfolioId) setExpandedDetail(d => d ? { ...d, status: newStatus as Portfolio["status"] } : d);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Status update failed.");
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleDeleteOne = (p: Portfolio) => {
        setConfirmModal({
            open: true,
            title: "Delete Portfolio",
            description: `Permanently delete portfolio "${p.portfolioId}" (${p.planSnapshot?.name})? This cannot be undone.`,
            confirmLabel: "Delete",
            variant: "danger",
            onConfirm: () => doDeleteOne(p._id),
        });
    };

    const doDeleteOne = async (id: string) => {
        setConfirmModal(CLOSED_CONFIRM);
        setDeleting(true);
        try {
            await appClient.delete(`/api/portfolio/admin/${id}`);
            toastSuccess("Portfolio deleted.");
            setPortfolios(prev => prev.filter(p => p._id !== id));
            if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); }
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Failed to delete portfolio.");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteAll = () => {
        setConfirmModal({
            open: true,
            title: "Delete All Portfolios",
            description: `Permanently delete ALL ${portfolios.length} portfolio record(s) for this client? This cannot be undone.`,
            confirmLabel: "Delete All",
            variant: "danger",
            onConfirm: doDeleteAll,
        });
    };

    const doDeleteAll = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setDeleting(true);
        try {
            await appClient.delete(`/api/portfolio/admin/client/${clientId}`);
            toastSuccess("All portfolios deleted.");
            setPortfolios([]);
            setExpandedId(null);
            setExpandedDetail(null);
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Delete failed.");
        } finally {
            setDeleting(false);
        }
    };

    const totalInvested = portfolios.reduce((s, p) => s + (p.summary?.totalInvestedUsd ?? 0), 0);
    const totalCurrentValue = portfolios.reduce((s, p) => s + (p.summary?.currentValueUsd ?? 0), 0);
    const activeCount = portfolios.filter(p => p.status === "active").length;
    const totalExpected = portfolios.reduce((s, p) => s + (p.summary?.expectedMaturityValueUsd ?? 0), 0);

    return (
        <div className="flex flex-col gap-4">
            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Portfolios", value: String(portfolios.length), accent: "bg-violet-500" },
                    { label: "Active", value: String(activeCount), accent: "bg-emerald-500" },
                    { label: "Total Invested", value: fmtFull(totalInvested), accent: "bg-primary" },
                    { label: "Current Value", value: fmtFull(totalCurrentValue), accent: "bg-blue-500" },
                ].map(c => (
                    <div key={c.label} className="relative bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden p-4">
                        <div className={`absolute top-0 inset-x-0 h-[3px] ${c.accent}`} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{c.label}</p>
                        <p className="text-[15px] font-black text-slate-800 leading-tight truncate">{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Expected maturity banner */}
            {portfolios.length > 0 && (
                <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-navy/70">Expected Total Maturity Value</span>
                    <span className="text-[15px] font-black text-navy">{fmtFull(totalExpected)}</span>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-semibold">
                    {["all", "active", "paused", "matured", "closed", "cancelled"].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-2.5 py-1.5 capitalize transition-colors ${filterStatus === s ? "bg-navy text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {isSuperAdmin && portfolios.length > 0 && (
                        <button onClick={handleDeleteAll} disabled={deleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm">
                            <Trash2 size={12} /> Delete All
                        </button>
                    )}
                    <button onClick={fetchPortfolios} disabled={loading}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50">
                        <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>

            {/* Portfolio list */}
            {loading && !fetched ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white border border-slate-100 rounded-xl animate-pulse" />)}
                </div>
            ) : portfolios.length === 0 ? (
                <div className="py-16 text-center bg-white border border-slate-100 rounded-2xl">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <TrendingUp size={24} className="text-slate-400" />
                        </div>
                        <p className="text-[13px] font-medium text-slate-600">No portfolios found</p>
                        <p className="text-[11px] text-slate-400">
                            {filterStatus === "all" ? "This client has no investment portfolios yet." : `No ${filterStatus} portfolios.`}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {portfolios.map(p => (
                        <PortfolioRow
                            key={p._id}
                            p={p}
                            isExpanded={expandedId === p._id}
                            isAdmin={isAdmin}
                            isSuperAdmin={isSuperAdmin}
                            updatingStatus={updatingStatus}
                            detail={expandedId === p._id ? expandedDetail : null}
                            loadingDetail={expandedId === p._id ? loadingDetail : false}
                            onToggle={handleToggle}
                            onStatusChange={handleStatusChange}
                            onDeleteOne={handleDeleteOne}
                        />
                    ))}
                </div>
            )}

            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(CLOSED_CONFIRM)}
            />
        </div>
    );
}
