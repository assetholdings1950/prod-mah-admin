"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUpRight,
    CalendarDays,
    Clock,
    FileText,
    Hash,
    Info,
    Link2,
    Loader2,
    Pencil,
    Shield,
    Star,
    Trash2,
    TrendingUp,
    Wallet,
    X,
    Infinity,
} from "lucide-react";
import { InvestmentPlanInterface } from "@/interface/investmentPlan";
import {
    RISK_CONFIG,
    STATUS_CONFIG,
    CATEGORY_CONFIG,
    PAYOUT_LABEL,
    fmt,
    fmtROI,
    fmtDuration,
} from "./planConfig";

// ========================= TYPES =========================

type Tab = "details" | "description" | "terms";

interface ViewDrawerProps {
    plan: InvestmentPlanInterface;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}

// ========================= INNER COMPONENTS =========================

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 mb-3">{children}</p>
);

const MetricCard = ({
    icon,
    label,
    value,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    accent: string;
}) => (
    <div className="flex flex-col gap-2.5 bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
        <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400 leading-none mb-1">{label}</p>
            <p className="text-sm font-extrabold text-navy leading-tight">{value}</p>
        </div>
    </div>
);

const RichContent = ({ html, size = "sm" }: { html: string; size?: "xs" | "sm" }) => (
    <div
        className={`${size === "xs" ? "text-xs" : "text-sm"} text-slate-600 leading-relaxed rich-text-preview`}
        dangerouslySetInnerHTML={{ __html: html }}
    />
);

// ========================= VIEW DRAWER =========================

const ViewDrawer = ({ plan, onClose, onEdit, onDelete, isDeleting }: ViewDrawerProps) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("details");

    const risk = RISK_CONFIG[plan.riskLevel];
    const status = STATUS_CONFIG[plan.status];
    const category = CATEGORY_CONFIG[plan.category];
    const { Icon: CategoryIcon } = category;

    const hasDescription = !!(plan.shortDescription || plan.description);
    const hasTerms = !!plan.termsAndConditions;
    const hasLockIn = !!(plan.lockInMonths && plan.lockInMonths > 0);
    const hasExitPenalty = !!(plan.exitPenaltyPercent && plan.exitPenaltyPercent > 0);

    const tabs: { id: Tab; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
        { id: "details", label: "Details", icon: <Info className="h-3 w-3" /> },
        { id: "description", label: "Description", icon: <FileText className="h-3 w-3" />, disabled: !hasDescription },
        { id: "terms", label: "Terms", icon: <Shield className="h-3 w-3" />, disabled: !hasTerms },
    ];

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-40"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="fixed top-0 right-0 h-full w-[540px] max-w-[100vw] bg-[#f8f9fb] z-50 flex flex-col shadow-2xl shadow-black/30"
            >
                {/* ── Sticky Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${category.className}`}>
                            <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{category.label}</p>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${status.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                    {status.label}
                                </span>
                                {plan.featured && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">
                                        <Star className="h-2.5 w-2.5 fill-amber-600" />
                                        Featured
                                    </span>
                                )}
                            </div>
                            <h2 className="font-bold text-navy text-[15px] leading-tight truncate">{plan.name}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex-shrink-0 ml-2"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="flex-1 overflow-y-auto">

                    {/* Hero Image */}
                    <div className="relative bg-slate-900 overflow-hidden" style={{ aspectRatio: "16/7" }}>
                        {plan.photourl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={plan.photourl} alt={plan.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-navy/30 via-navy/10 to-slate-900 flex items-center justify-center">
                                <TrendingUp className="h-16 w-16 text-navy/15" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Risk badge top-right */}
                        <div className="absolute top-3 right-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border bg-white/95 backdrop-blur-sm shadow-sm ${risk.className}`}>
                                <Shield className="h-3 w-3" />
                                {risk.label}
                            </span>
                        </div>

                        {/* ROI showcase bottom-left */}
                        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-12 flex items-end justify-between">
                            <div>
                                <p className="text-white/55 text-[9px] font-extrabold uppercase tracking-[0.2em] mb-0.5">Annual Return</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-white font-extrabold leading-none" style={{ fontSize: "2.25rem" }}>
                                        {fmtROI(plan)}
                                    </p>
                                    <span className="text-white/60 text-sm font-semibold">p.a.</span>
                                </div>
                                <p className="text-white/40 text-[10px] mt-0.5 font-medium">
                                    {plan.roiType === "fixed" ? "Fixed rate" : "Variable range"}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <div className="text-right">
                                    <p className="text-white/50 text-[9px] font-extrabold uppercase tracking-widest">Payout</p>
                                    <p className="text-white text-sm font-extrabold">{PAYOUT_LABEL[plan.payoutType]}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/50 text-[9px] font-extrabold uppercase tracking-widest">Duration</p>
                                    <p className="text-white text-sm font-extrabold">{fmtDuration(plan.durationMinMonths, plan.durationMaxMonths)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tab Bar ── */}
                    <div className="flex items-center gap-1 px-5 pt-4 pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                                disabled={tab.disabled}
                                className={[
                                    "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all",
                                    activeTab === tab.id
                                        ? "bg-navy text-white shadow-sm shadow-navy/20"
                                        : tab.disabled
                                            ? "text-slate-300 cursor-not-allowed"
                                            : "text-slate-500 hover:text-navy hover:bg-slate-100",
                                ].join(" ")}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Tab Content ── */}
                    <AnimatePresence mode="wait" initial={false}>
                        {activeTab === "details" && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                                className="px-5 py-5 space-y-5"
                            >
                                {/* Key Metrics Grid */}
                                <div>
                                    <SectionLabel>Key Metrics</SectionLabel>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <MetricCard
                                            icon={<TrendingUp className="h-3.5 w-3.5" />}
                                            label="Annual ROI"
                                            value={fmtROI(plan)}
                                            accent="bg-emerald-100 text-emerald-600"
                                        />
                                        <MetricCard
                                            icon={<Clock className="h-3.5 w-3.5" />}
                                            label="Duration"
                                            value={fmtDuration(plan.durationMinMonths, plan.durationMaxMonths)}
                                            accent="bg-indigo-100 text-indigo-600"
                                        />
                                        <MetricCard
                                            icon={<CalendarDays className="h-3.5 w-3.5" />}
                                            label="Payout Frequency"
                                            value={PAYOUT_LABEL[plan.payoutType]}
                                            accent="bg-sky-100 text-sky-600"
                                        />
                                        <MetricCard
                                            icon={<Shield className="h-3.5 w-3.5" />}
                                            label="Risk Level"
                                            value={RISK_CONFIG[plan.riskLevel].label}
                                            accent={
                                                plan.riskLevel === "low" ? "bg-emerald-100 text-emerald-600" :
                                                plan.riskLevel === "medium" ? "bg-amber-100 text-amber-600" :
                                                plan.riskLevel === "high" ? "bg-orange-100 text-orange-600" :
                                                "bg-red-100 text-red-600"
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Investment Range */}
                                <div>
                                    <SectionLabel>Investment Range</SectionLabel>
                                    {plan.category === "crypto" ? (
                                        <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-2xl p-4">
                                            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                                                <Infinity className="h-4 w-4 text-violet-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-violet-800">Open-Ended</p>
                                                <p className="text-[11px] text-violet-500 mt-0.5">No min/max limit — invest any amount</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <div className="flex items-center gap-1">
                                                        <Wallet className="h-3 w-3 text-slate-400" />
                                                        <p className="text-[10px] text-slate-400 font-semibold">Minimum</p>
                                                    </div>
                                                    <p className="text-base font-extrabold text-navy tabular-nums">{fmt(plan.minAmount)}</p>
                                                </div>
                                                <div className="flex-1 mx-4 flex flex-col gap-1">
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full w-full bg-gradient-to-r from-navy/40 via-navy/70 to-navy rounded-full" />
                                                    </div>
                                                    <p className="text-[9px] text-center text-slate-400 font-semibold tracking-wide">USD</p>
                                                </div>
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <div className="flex items-center gap-1">
                                                        <Wallet className="h-3 w-3 text-slate-400" />
                                                        <p className="text-[10px] text-slate-400 font-semibold">Maximum</p>
                                                    </div>
                                                    <p className="text-base font-extrabold text-navy tabular-nums">{fmt(plan.maxAmount)}</p>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-slate-50 flex items-center justify-center">
                                                <p className="text-[11px] text-slate-400 font-semibold">
                                                    Range: <span className="text-navy font-extrabold">{fmt(plan.minAmount)} – {fmt(plan.maxAmount)}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Lock-in & Exit Protection */}
                                {(hasLockIn || hasExitPenalty) && (
                                    <div>
                                        <SectionLabel>Lock-in & Exit Protection</SectionLabel>
                                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                            <div className="flex items-center gap-2.5 mb-3">
                                                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                                    <Shield className="h-3.5 w-3.5 text-amber-600" />
                                                </div>
                                                <p className="text-xs font-extrabold text-amber-800">Capital Protection Rules</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {hasLockIn && (
                                                    <div className="bg-white/70 border border-amber-100 rounded-xl px-3.5 py-3">
                                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-amber-600/70 mb-1">Lock-in Period</p>
                                                        <p className="text-lg font-extrabold text-amber-800">{plan.lockInMonths} <span className="text-sm font-semibold">months</span></p>
                                                    </div>
                                                )}
                                                {hasExitPenalty && (
                                                    <div className="bg-white/70 border border-amber-100 rounded-xl px-3.5 py-3">
                                                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-amber-600/70 mb-1">Early Exit Penalty</p>
                                                        <p className="text-lg font-extrabold text-amber-800">{plan.exitPenaltyPercent}<span className="text-sm font-semibold">%</span></p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div>
                                    <SectionLabel>Plan Info</SectionLabel>
                                    <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-50 shadow-sm overflow-hidden">
                                        {plan.slug && (
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Link2 className="h-3 w-3 text-slate-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">URL Slug</p>
                                                    <p className="text-xs font-semibold text-slate-600 font-mono truncate">/plans/{plan.slug}</p>
                                                </div>
                                            </div>
                                        )}
                                        {plan.sortOrder !== undefined && (
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Hash className="h-3 w-3 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Sort Order</p>
                                                    <p className="text-xs font-semibold text-slate-600">Position #{plan.sortOrder}</p>
                                                </div>
                                            </div>
                                        )}
                                        {plan.createdAt && (
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <CalendarDays className="h-3 w-3 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Created</p>
                                                    <p className="text-xs font-semibold text-slate-600">
                                                        {new Date(plan.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {plan.updatedAt && (
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <CalendarDays className="h-3 w-3 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Last Updated</p>
                                                    <p className="text-xs font-semibold text-slate-600">
                                                        {new Date(plan.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "description" && (
                            <motion.div
                                key="description"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                                className="px-5 py-5 space-y-5"
                            >
                                {plan.shortDescription && (
                                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                        <SectionLabel>Overview</SectionLabel>
                                        <RichContent html={plan.shortDescription} />
                                    </div>
                                )}
                                {plan.description && (
                                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                        <SectionLabel>Full Description</SectionLabel>
                                        <RichContent html={plan.description} />
                                    </div>
                                )}
                                {!hasDescription && (
                                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-slate-300" />
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">No description added for this plan.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === "terms" && (
                            <motion.div
                                key="terms"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                                className="px-5 py-5"
                            >
                                {plan.termsAndConditions ? (
                                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                        <SectionLabel>Terms & Conditions</SectionLabel>
                                        <RichContent html={plan.termsAndConditions} size="xs" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                            <Shield className="h-5 w-5 text-slate-300" />
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">No terms and conditions defined.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Sticky Footer ── */}
                <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 bg-white">
                    <AnimatePresence mode="wait" initial={false}>
                        {confirmDelete ? (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-red-700">Delete this plan permanently?</p>
                                    <p className="text-[11px] text-red-400 mt-0.5">This action cannot be undone.</p>
                                </div>
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex-shrink-0"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { onDelete(); setConfirmDelete(false); }}
                                    disabled={isDeleting}
                                    className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-all flex-shrink-0 inline-flex items-center gap-1.5"
                                >
                                    {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    Delete
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="actions"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-2.5"
                            >
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 border border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-200 hover:text-red-600 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                <div className="flex-1" />
                                <button
                                    onClick={onEdit}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-navy text-white hover:bg-navy/90 transition-all shadow-sm shadow-navy/20"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit Plan
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
};

export default ViewDrawer;
