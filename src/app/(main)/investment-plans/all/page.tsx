"use client";

import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import Pagination from "@/components/pagination/pagination";
import appClient from "@/lib/appClient";
import { InvestmentPlanInterface } from "@/interface/investmentPlan";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
    CalendarDays,
    Check,
    Clock,
    Eye,
    Pencil,
    RefreshCw,
    Search,
    Shield,
    Star,
    Trash2,
    TrendingUp,
    Wallet,
} from "lucide-react";
import ViewDrawer from "../_components/ViewDrawer";
import { RISK_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG, PAYOUT_LABEL, fmt, fmtROI, fmtDuration } from "../_components/planConfig";
import Select from "@/components/common/Select";

const perPageOptions = [6, 12, 24];


// ========================= SKELETON & EMPTY =========================

const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-slate-200" />
        <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
            <div className="h-3 bg-slate-100 rounded-lg w-full" />
            <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
            <div className="grid grid-cols-2 gap-2 pt-1">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
            </div>
            <div className="h-9 bg-slate-100 rounded-xl mt-2" />
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <TrendingUp className="h-7 w-7 text-navy/30" />
        </div>
        <div className="text-center">
            <p className="font-extrabold text-navy text-sm">No plans found</p>
            <p className="text-xs text-foreground/50 mt-1">Try adjusting your filters</p>
        </div>
    </div>
);

// ========================= PLAN CARD =========================

interface PlanCardProps {
    plan: InvestmentPlanInterface;
    index: number;
    isSelected: boolean;
    isAnySelected: boolean;
    isDeleting: boolean;
    onSelect: (id: string) => void;
    onView: (plan: InvestmentPlanInterface) => void;
    onEdit: (plan: InvestmentPlanInterface) => void;
    onDelete: (id: string) => void;
}

const PlanCard = ({ plan, index, isSelected, isAnySelected, isDeleting, onSelect, onView, onEdit, onDelete }: PlanCardProps) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const risk = RISK_CONFIG[plan.riskLevel];
    const status = STATUS_CONFIG[plan.status];
    const category = CATEGORY_CONFIG[plan.category];
    const { Icon: CategoryIcon } = category;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.28, delay: index * 0.04 }}
            className={[
                "bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:shadow-navy/8 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group flex flex-col relative",
                isSelected ? "border-navy ring-2 ring-navy/30 ring-offset-1" : "border-slate-100",
                isDeleting ? "opacity-50 pointer-events-none" : "",
            ].join(" ")}
        >
            {/* Checkbox */}
            <div
                className={[
                    "absolute top-3 left-3 z-20 transition-all duration-200",
                    isAnySelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                ].join(" ")}
                onClick={(e) => { e.stopPropagation(); plan._id && onSelect(plan._id); }}
            >
                <div className={[
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all shadow-sm",
                    isSelected ? "bg-navy border-navy" : "bg-white/90 border-white/80 backdrop-blur-sm hover:border-navy/60",
                ].join(" ")}>
                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
            </div>

            {/* Cover Photo */}
            <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={plan.photourl ?? "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"}
                    alt={plan.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                {/* Category badge — offset right to avoid checkbox overlap */}
                <div className="absolute top-3 left-10">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-sm bg-white/90 ${category.className}`}>
                        <CategoryIcon className="h-2.5 w-2.5" />
                        {category.label}
                    </span>
                </div>

                {/* Top-right: featured + status */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {plan.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-400/95 text-amber-950 backdrop-blur-sm border border-amber-300/60">
                            <Star className="h-2.5 w-2.5 fill-amber-950" />
                            Featured
                        </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold bg-white/90 backdrop-blur-sm border border-white/50 ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                    </span>
                </div>

                {/* Bottom: ROI + risk */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5 pt-8 flex items-end justify-between">
                    <div>
                        <p className="text-white/60 text-[9px] font-extrabold uppercase tracking-[0.15em] mb-0.5">Annual ROI</p>
                        <p className="text-white font-extrabold leading-none" style={{ fontSize: "clamp(1.4rem, 3vw, 1.75rem)" }}>
                            {fmtROI(plan)}
                            <span className="text-xs font-semibold ml-1 opacity-80">p.a.</span>
                        </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-white/92 backdrop-blur-sm ${risk.className}`}>
                        <Shield className="h-2.5 w-2.5" />
                        {risk.label}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="flex flex-col flex-1 p-4 gap-3.5">
                <div>
                    <h3 className="font-extrabold text-navy text-2xl leading-snug tracking-tight line-clamp-1">{plan.name}</h3>
                    {plan.shortDescription && (
                        <div
                            className="text-xs text-foreground/50 line-clamp-2 leading-relaxed rich-text-preview"
                            dangerouslySetInnerHTML={{ __html: plan.shortDescription }}
                        />


                    )}
                </div>

                {/* 4-metric grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted rounded-xl px-3 py-2.5">
                        <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-foreground/40">
                            <Clock className="h-2.5 w-2.5" />Duration
                        </p>
                        <p className="text-xs font-extrabold text-navy mt-0.5">{fmtDuration(plan.durationMinMonths, plan.durationMaxMonths)}</p>
                    </div>
                    <div className="bg-muted rounded-xl px-3 py-2.5">
                        <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-foreground/40">
                            <CalendarDays className="h-2.5 w-2.5" />Payout
                        </p>
                        <p className="text-xs font-extrabold text-navy mt-0.5">{PAYOUT_LABEL[plan.payoutType]}</p>
                    </div>
                    <div className="bg-muted rounded-xl px-3 py-2.5">
                        <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-foreground/40">
                            <Wallet className="h-2.5 w-2.5" />Min. Invest
                        </p>
                        <p className="text-xs font-extrabold text-navy mt-0.5">{fmt(plan.minAmount)}</p>
                    </div>
                    {plan.lockInMonths && plan.lockInMonths > 0 ? (
                        <div className="bg-muted rounded-xl px-3 py-2.5">
                            <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-foreground/40">
                                <Shield className="h-2.5 w-2.5" />Lock-in
                            </p>
                            <p className="text-xs font-extrabold text-navy mt-0.5">{plan.lockInMonths} Mo</p>
                        </div>
                    ) : (
                        <div className="bg-muted rounded-xl px-3 py-2.5">
                            <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-foreground/40">
                                <TrendingUp className="h-2.5 w-2.5" />Max. Invest
                            </p>
                            <p className="text-xs font-extrabold text-navy mt-0.5">{fmt(plan.maxAmount)}</p>
                        </div>
                    )}
                </div>

                {/* Investment range strip */}
                <div className="flex items-center justify-between bg-navy/4 rounded-xl px-3 py-2 border border-navy/8">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-foreground/40">Range</span>
                    <span className="text-[11px] font-extrabold text-navy tabular-nums">{fmt(plan.minAmount)} &ndash; {fmt(plan.maxAmount)}</span>
                </div>

                <div className="flex-1" />

                {/* Actions */}
                <AnimatePresence mode="wait" initial={false}>
                    {confirmDelete ? (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="pt-1 border-t border-red-100"
                        >
                            <p className="text-[11px] font-bold text-red-600 mb-2 text-center">Delete this plan?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => { plan._id && onDelete(plan._id); setConfirmDelete(false); }}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all inline-flex items-center justify-center gap-1"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="actions"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1.5 pt-1 border-t border-slate-100"
                        >
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => onEdit(plan)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-navy border border-navy/20 hover:bg-navy hover:text-white hover:border-navy transition-all duration-200"
                            >
                                <Pencil className="h-3 w-3" />
                                Edit
                            </button>
                            <button
                                onClick={() => onView(plan)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-navy text-white hover:bg-navy/90 transition-all duration-200 shadow-sm shadow-navy/20"
                            >
                                <Eye className="h-3 w-3" />
                                View
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// ========================= MAIN PAGE =========================

const InvestmentsPlansPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [plans, setPlans] = useState<InvestmentPlanInterface[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(12);
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") ?? "all");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
    const [riskFilter, setRiskFilter] = useState(searchParams.get("riskLevel") ?? "all");

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [drawerPlan, setDrawerPlan] = useState<InvestmentPlanInterface | null>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

    // Sync filters to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (riskFilter !== "all") params.set("riskLevel", riskFilter);
        const qs = params.toString();
        router.replace(`/investment-plans/all${qs ? `?${qs}` : ""}`, { scroll: false } as Parameters<typeof router.replace>[1]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryFilter, statusFilter, riskFilter]);

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const res = await appClient.get("/api/investment-plans/get", {
                params: {
                    page,
                    limit,
                    search,
                    category: categoryFilter !== "all" ? categoryFilter : undefined,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    riskLevel: riskFilter !== "all" ? riskFilter : undefined,
                },
            });
            if (res.data?.status) {
                const d = res.data?.data ?? res.data?.plans ?? res.data?.investmentPlans;
                setPlans(d?.docs ?? d ?? []);
                setTotalDocs(d?.totalDocs ?? 0);
                setTotalPages(d?.totalPages ?? 0);
            }
        } catch (err) {
            console.error("Error fetching investment plans:", err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, categoryFilter, statusFilter, riskFilter]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const handleDelete = async (ids: string[]) => {
        setDeletingIds(new Set(ids));
        try {
            const res = await appClient.delete("/api/investment-plans/delete", { data: { ids } });
            if (res.data?.status || res.status === 200) {
                toastSuccess(`${ids.length > 1 ? `${ids.length} plans` : "Plan"} deleted successfully.`);
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    ids.forEach((id) => next.delete(id));
                    return next;
                });
                if (drawerPlan?._id && ids.includes(drawerPlan._id)) setDrawerPlan(null);
                fetchPlans();
            } else {
                toastError(res.data?.message ?? "Delete failed.");
            }
        } catch {
            toastError("Something went wrong while deleting.");
        } finally {
            setDeletingIds(new Set());
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearFilters = () => {
        setCategoryFilter("all");
        setStatusFilter("all");
        setRiskFilter("all");
        setSearchInput("");
        setPage(1);
    };

    const hasFilters = categoryFilter !== "all" || statusFilter !== "all" || riskFilter !== "all" || !!searchInput;
    const allSelected = plans.length > 0 && plans.every((p) => p._id && selectedIds.has(p._id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(plans.map((p) => p._id!).filter(Boolean)));
        }
    };

    return (
        <div className="w-full h-full flex flex-col space-y-5 p-1 text-foreground">
            <WorksSpaceHeader
                isButtonVisible={true}
                subHeading="Manage All Investment Plans"
                heading="Investment Plans"
                buttonText="Create Investment Plan"
                handleOpenCreate={() => router.push("/investment-plans/create")}
            />

            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/35 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search plans…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                    />
                </div>

                <Select
                    size="sm"
                    value={categoryFilter}
                    onChange={(v) => { setCategoryFilter(v); setPage(1); }}
                    options={[
                        { value: "all", label: "All Categories" },
                        { value: "monthly", label: "Monthly SIP" },
                        { value: "lumpsum", label: "Lump Sum" },
                        { value: "crypto", label: "Crypto" },
                    ]}
                />

                <Select
                    size="sm"
                    value={statusFilter}
                    onChange={(v) => { setStatusFilter(v); setPage(1); }}
                    options={[
                        { value: "all", label: "All Status" },
                        { value: "active", label: "Active" },
                        { value: "draft", label: "Draft" },
                        { value: "inactive", label: "Inactive" },
                    ]}
                />

                <Select
                    size="sm"
                    value={riskFilter}
                    onChange={(v) => { setRiskFilter(v); setPage(1); }}
                    options={[
                        { value: "all", label: "All Risk Levels" },
                        { value: "low", label: "Low Risk" },
                        { value: "medium", label: "Medium Risk" },
                        { value: "high", label: "High Risk" },
                        { value: "very_high", label: "Very High Risk" },
                    ]}
                />

                {hasFilters && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground/60 hover:text-foreground border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Clear
                    </motion.button>
                )}

                <button
                    onClick={fetchPlans}
                    disabled={loading}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-navy border border-slate-200 hover:border-navy/30 hover:bg-navy/5 transition-all disabled:opacity-40"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>

                <span className="text-xs font-bold text-foreground/35 ml-auto tabular-nums">
                    {totalDocs} plan{totalDocs !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : plans.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    {/* Select-all row */}
                    <div className="flex items-center gap-3 px-1">
                        <button
                            onClick={toggleSelectAll}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy transition-colors"
                        >
                            <div className={["w-4 h-4 rounded border-2 flex items-center justify-center transition-all", allSelected ? "bg-navy border-navy" : "border-slate-300 bg-white"].join(" ")}>
                                {allSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                            </div>
                            {allSelected ? "Deselect all" : "Select all"}
                        </button>
                        {selectedIds.size > 0 && (
                            <span className="text-xs text-slate-400 font-medium">{selectedIds.size} selected</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-4">
                        <AnimatePresence mode="popLayout">
                            {plans.map((plan, i) => (
                                <PlanCard
                                    key={plan._id}
                                    plan={plan}
                                    index={i}
                                    isSelected={!!(plan._id && selectedIds.has(plan._id))}
                                    isAnySelected={selectedIds.size > 0}
                                    isDeleting={!!(plan._id && deletingIds.has(plan._id))}
                                    onSelect={toggleSelect}
                                    onView={setDrawerPlan}
                                    onEdit={(p) => router.push(`/investment-plans/${p._id}/edit`)}
                                    onDelete={(id) => handleDelete([id])}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            limit={limit}
                            totalDocs={totalDocs}
                            perPageOptions={perPageOptions}
                            onPageChange={setPage}
                            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
                        />
                    </div>
                </>
            )}

            {/* View Drawer */}
            <AnimatePresence>
                {drawerPlan && (
                    <ViewDrawer
                        plan={drawerPlan}
                        onClose={() => setDrawerPlan(null)}
                        onEdit={() => { router.push(`/investment-plans/${drawerPlan._id}/edit`); setDrawerPlan(null); }}
                        onDelete={() => drawerPlan._id && handleDelete([drawerPlan._id])}
                        isDeleting={!!(drawerPlan._id && deletingIds.has(drawerPlan._id))}
                    />
                )}
            </AnimatePresence>

            {/* Bulk Actions Floating Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ type: "spring", damping: 24, stiffness: 300 }}
                        className="fixed bottom-6 inset-x-0 flex justify-center z-30 pointer-events-none"
                    >
                        <div className="pointer-events-auto bg-navy text-white rounded-2xl shadow-2xl shadow-navy/40 border border-white/10 px-4 py-3 flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                                </div>
                                <span className="text-sm font-bold tabular-nums">{selectedIds.size}</span>
                                <span className="text-sm text-white/70">plan{selectedIds.size !== 1 ? "s" : ""} selected</span>
                            </div>

                            <div className="w-px h-5 bg-white/20" />

                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-xs font-semibold text-white/70 hover:text-white transition-colors"
                            >
                                Clear
                            </button>

                            <AnimatePresence mode="wait" initial={false}>
                                {confirmBulkDelete ? (
                                    <motion.div
                                        key="confirm"
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        transition={{ duration: 0.15 }}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="text-xs text-white/80 font-medium">Are you sure?</span>
                                        <button
                                            onClick={() => setConfirmBulkDelete(false)}
                                            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => { handleDelete(Array.from(selectedIds)); setConfirmBulkDelete(false); }}
                                            className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete {selectedIds.size}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="delete-btn"
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        transition={{ duration: 0.15 }}
                                        onClick={() => setConfirmBulkDelete(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 text-xs font-bold transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete selected
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InvestmentsPlansPage;
