"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Banknote,
    Bitcoin,
    Check,
    Clock,
    CreditCard,
    Loader2,
    Pencil,
    RefreshCw,
    Search,
    Trash2,
    AlertTriangle,
    Zap,
    Building2,
} from "lucide-react";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import Pagination from "@/components/pagination/pagination";
import appClient from "@/lib/appClient";
import { PaymentMethodInterface } from "@/interface/paymentMethod";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import Select from "@/components/common/Select";

// ========================= TYPE CONFIG =========================

const TYPE_CONFIG = {
    fiat: {
        label: "Fiat",
        Icon: Banknote,
        AltIcon: Building2,
        gradientFrom: "#0d2d6e",
        gradientMid: "#0a4a8a",
        gradientTo: "#0e7490",
        borderColor: "#38bdf8",
        badgeClass: "bg-sky-500/20 text-sky-200 border-sky-400/30",
        glowColor: "rgba(56,189,248,0.25)",
        accentClass: "from-sky-400 to-cyan-500",
        dotPattern: "rgba(255,255,255,0.07)",
    },
    crypto: {
        label: "Crypto",
        Icon: Bitcoin,
        AltIcon: Zap,
        gradientFrom: "#1e0848",
        gradientMid: "#3b1272",
        gradientTo: "#6d28d9",
        borderColor: "#a78bfa",
        badgeClass: "bg-violet-500/20 text-violet-200 border-violet-400/30",
        glowColor: "rgba(167,139,250,0.25)",
        accentClass: "from-violet-400 to-fuchsia-500",
        dotPattern: "rgba(255,255,255,0.06)",
    },
};

const perPageOptions = [12, 24, 48];

// ========================= STATUS TOGGLE =========================

const StatusToggle = ({
    id,
    status,
    onToggled,
}: {
    id: string;
    status: "active" | "inactive";
    onToggled: (id: string, newStatus: "active" | "inactive") => void;
}) => {
    const [loading, setLoading] = useState(false);
    const isActive = status === "active";

    const handle = async () => {
        setLoading(true);
        try {
            const res = await appClient.patch(`/api/payment-methods/toggle-status?id=${id}`);
            if (res.data?.status || res.status === 200) {
                onToggled(id, isActive ? "inactive" : "active");
                toastSuccess(`Payment method ${isActive ? "deactivated" : "activated"}.`);
            } else {
                toastError(res.data?.message ?? "Failed to toggle status.");
            }
        } catch {
            toastError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handle}
            disabled={loading}
            className="flex items-center gap-1.5 disabled:opacity-60"
        >
            {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            ) : (
                <div
                    className={`relative rounded-full transition-all duration-300 shadow-inner ${isActive ? "bg-emerald-500 shadow-emerald-500/30" : "bg-slate-300"}`}
                    style={{ width: 30, height: 17 }}
                >
                    <span className={`absolute top-[1.5px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-300 ${isActive ? "translate-x-[13px]" : "translate-x-0"}`} />
                </div>
            )}
            <span className={`text-[10px] font-bold tracking-wide ${isActive ? "text-emerald-500" : "text-slate-400"}`}>
                {isActive ? "LIVE" : "OFF"}
            </span>
        </button>
    );
};


// ========================= SKELETON =========================

const CardSkeleton = () => (
    <div className="animate-pulse rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
        <div className="aspect-square bg-slate-200" />
        <div className="bg-white p-3.5 flex flex-col gap-2.5">
            <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
            <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
            <div className="flex gap-2 pt-1">
                <div className="h-5 w-12 bg-slate-100 rounded-lg" />
                <div className="h-5 w-16 bg-slate-100 rounded-lg" />
            </div>
        </div>
    </div>
);

// ========================= DELETE CONFIRM =========================

const DeleteConfirm = ({
    onConfirm,
    onCancel,
    loading,
}: {
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -6 }}
        transition={{ duration: 0.14, type: "spring", stiffness: 400 }}
        className="absolute right-0 top-10 z-30 w-52 bg-white border border-red-100 rounded-2xl shadow-2xl shadow-red-500/15 p-3.5"
    >
        <div className="flex items-start gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-800">Delete method?</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">This cannot be undone.</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
                Cancel
            </button>
            <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-1"
            >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Delete
            </button>
        </div>
    </motion.div>
);

// ========================= PREMIUM CARD =========================

const PaymentMethodCard = ({
    method,
    index,
    isSelected,
    isAnySelected,
    isDeleting,
    onSelect,
    onEdit,
    onDelete,
    onStatusToggled,
}: {
    method: PaymentMethodInterface;
    index: number;
    isSelected: boolean;
    isAnySelected: boolean;
    isDeleting: boolean;
    onSelect: (id: string) => void;
    onEdit: (m: PaymentMethodInterface) => void;
    onDelete: (id: string) => void;
    onStatusToggled: (id: string, newStatus: "active" | "inactive") => void;
}) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [imgError, setImgError] = useState(false);
    const conf = TYPE_CONFIG[method.type];
    const TypeIcon = conf.Icon;
    const hasImage = !!method.qrCodeUrl && !imgError;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, delay: index * 0.045, ease: [0.22, 1, 0.36, 1] }}
            className={[
                "group relative rounded-2xl overflow-visible transition-all duration-300",
                isDeleting ? "opacity-30 pointer-events-none" : "",
            ].join(" ")}
        >
            {/* Glow ring when selected */}
            {isSelected && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -inset-[3px] rounded-[18px] z-0"
                    style={{ background: `linear-gradient(135deg, ${conf.borderColor}60, ${conf.borderColor}20)` }}
                />
            )}

            {/* Card shell */}
            <div className={[
                "relative z-10 rounded-2xl overflow-hidden bg-white shadow-md transition-all duration-300 group-hover:shadow-xl",
                isSelected ? "ring-2 ring-offset-1" : "",
            ].join(" ")}
                style={isSelected ? { outlineColor: conf.borderColor } : {}}
            >
                {/* ── Square image / placeholder ── */}
                <div className="relative aspect-square overflow-hidden">

                    {hasImage ? (
                        /* Real image */
                        <>
                            <img
                                src={method.qrCodeUrl}
                                alt={method.name}
                                onError={() => setImgError(true)}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                            {/* Subtle shimmer on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
                        </>
                    ) : (
                        /* Premium gradient placeholder */
                        <>
                            <div
                                className="w-full h-full"
                                style={{
                                    background: `linear-gradient(145deg, ${conf.gradientFrom} 0%, ${conf.gradientMid} 55%, ${conf.gradientTo} 100%)`,
                                }}
                            />
                            {/* Dot grid overlay */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: `radial-gradient(circle, ${conf.dotPattern} 1.5px, transparent 1.5px)`,
                                    backgroundSize: "22px 22px",
                                }}
                            />
                            {/* Glow orb */}
                            <div
                                className="absolute inset-0 opacity-60"
                                style={{
                                    background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${conf.glowColor}, transparent)`,
                                }}
                            />
                            {/* Currency watermark */}
                            <div className="absolute bottom-3 right-3 text-white/[0.07] font-black text-[56px] leading-none select-none pointer-events-none">
                                {method.currency}
                            </div>
                            {/* Center icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                                    style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)" }}
                                >
                                    <TypeIcon className="h-7 w-7 text-white drop-shadow-md" />
                                </div>
                            </div>
                            {/* Bottom gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        </>
                    )}

                    {/* ── Top-left: type badge ── */}
                    <div className="absolute top-3 left-3">
                        <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${conf.badgeClass}`}
                            style={{ backdropFilter: "blur(8px)" }}
                        >
                            <TypeIcon className="h-2.5 w-2.5" />
                            {conf.label}
                        </span>
                    </div>

                    {/* ── Top-right: sort order + checkbox ── */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {typeof method.sortOrder === "number" && (
                            <span
                                className="w-6 h-6 rounded-lg text-[10px] font-black text-white/70 flex items-center justify-center"
                                style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
                            >
                                {method.sortOrder}
                            </span>
                        )}
                        <div
                            className={[
                                "transition-all duration-200 cursor-pointer",
                                isAnySelected ? "opacity-100 scale-100" : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100",
                            ].join(" ")}
                            onClick={() => method._id && onSelect(method._id)}
                        >
                            <div
                                className={[
                                    "w-[22px] h-[22px] rounded-lg border-2 flex items-center justify-center shadow-md transition-all",
                                    isSelected ? "bg-navy border-navy" : "bg-white/90 border-white/80 hover:border-navy/50",
                                ].join(" ")}
                            >
                                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom overlay: name + slug ── */}
                    <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3.5 pt-8">
                        <p className="text-white font-black text-[15px] leading-tight drop-shadow-md truncate">
                            {method.name}
                        </p>
                        <p className="text-white/50 font-mono text-[10px] mt-0.5 truncate">
                            /{method.slug}
                        </p>
                    </div>

                    {/* ── Colored left accent strip ── */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-[3px]"
                        style={{ background: `linear-gradient(180deg, ${conf.borderColor}, transparent)` }}
                    />
                </div>

                {/* ── Metadata strip ── */}
                <div className="px-3.5 py-2.5 flex items-center gap-2 border-b border-slate-100/80 bg-slate-50/60">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-navy/8 text-navy text-[11px] font-black tracking-wide">
                        {method.currency}
                    </span>
                    <span className="text-slate-200 text-xs">·</span>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold truncate flex-1">
                        {method.network.toUpperCase()}
                    </span>
                    {method.processingTime && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 flex-shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            {method.processingTime}
                        </span>
                    )}
                </div>

                {/* ── Card footer ── */}
                <div className="px-3.5 py-2.5 flex items-center justify-between bg-white">
                    {method._id && (
                        <StatusToggle
                            id={method._id}
                            status={method.status}
                            onToggled={onStatusToggled}
                        />
                    )}

                    {/* Action buttons — slide up + fade on hover */}
                    <div className="flex items-center gap-1 relative">
                        <button
                            onClick={() => onEdit(method)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-navy hover:bg-navy/6 border border-transparent hover:border-navy/12 transition-all duration-200 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                            style={{ transitionDelay: "30ms" }}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100/70 transition-all duration-200 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                                style={{ transitionDelay: "60ms" }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <AnimatePresence>
                                {confirmDelete && (
                                    <DeleteConfirm
                                        loading={isDeleting}
                                        onConfirm={() => {
                                            if (method._id) onDelete(method._id);
                                            setConfirmDelete(false);
                                        }}
                                        onCancel={() => setConfirmDelete(false)}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ========================= EMPTY STATE =========================

const EmptyState = () => (
    <div className="col-span-full flex flex-col items-center justify-center py-24 gap-5">
        <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)" }}
        >
            <CreditCard className="h-7 w-7 text-navy/25" />
        </div>
        <div className="text-center">
            <p className="font-black text-navy text-sm tracking-tight">No payment methods found</p>
            <p className="text-xs text-foreground/40 mt-1.5">Adjust your filters or add a new method.</p>
        </div>
    </div>
);

// ========================= MAIN PAGE =========================

const PaymentMethodsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [methods, setMethods] = useState<PaymentMethodInterface[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(12);
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "all");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

    const fetchMethods = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
            if (typeFilter !== "all") params.set("type", typeFilter);
            if (statusFilter !== "all") params.set("status", statusFilter);
            const res = await appClient.get(`/api/payment-methods/list?${params}`);
            if (res.data?.status) {
                const d = res.data?.paymentMethods ?? res.data?.data;
                setMethods(d?.docs ?? []);
                setTotalDocs(d?.totalDocs ?? 0);
                setTotalPages(d?.totalPages ?? 0);
            }
        } catch {
            toastError("Failed to load payment methods.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, typeFilter, statusFilter]);

    useEffect(() => { fetchMethods(); }, [fetchMethods]);

    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Sync filters → URL (mirrors the investment-plans pattern)
    useEffect(() => {
        const params = new URLSearchParams();
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        const qs = params.toString();
        router.replace(`/finance/payment-methods/all${qs ? `?${qs}` : ""}`, { scroll: false } as Parameters<typeof router.replace>[1]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [typeFilter, statusFilter]);

    const handleDelete = async (ids: string[]) => {
        setDeletingIds(new Set(ids));
        try {
            const res = await appClient.delete("/api/payment-methods/delete", { data: { ids } });
            if (res.data?.status || res.status === 200) {
                toastSuccess(`${ids.length > 1 ? `${ids.length} methods` : "Method"} deleted.`);
                setSelectedIds((prev) => {
                    const next = new Set(prev);
                    ids.forEach((id) => next.delete(id));
                    return next;
                });
                fetchMethods();
            } else {
                toastError(res.data?.message ?? "Delete failed.");
            }
        } catch {
            toastError("Something went wrong.");
        } finally {
            setDeletingIds(new Set());
        }
    };

    const handleStatusToggled = (id: string, newStatus: "active" | "inactive") => {
        setMethods((prev) => prev.map((m) => (m._id === id ? { ...m, status: newStatus } : m)));
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const hasFilters = typeFilter !== "all" || statusFilter !== "all" || !!searchInput;

    return (
        <div className="w-full flex flex-col gap-5 p-1 text-foreground">
            <WorksSpaceHeader
                isButtonVisible
                subHeading="Finance"
                heading="Payment Methods"
                buttonText="Add Payment Method"
                handleOpenCreate={() => router.push("/finance/payment-methods/create")}
            />

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/35 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search methods…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                    />
                </div>

                <Select
                    size="sm"
                    value={typeFilter}
                    onChange={(v) => { setTypeFilter(v); setPage(1); }}
                    options={[
                        { value: "all", label: "All Types" },
                        { value: "fiat", label: "Fiat" },
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
                        { value: "inactive", label: "Inactive" },
                    ]}
                />

                {hasFilters && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setSearchInput(""); setPage(1); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground/60 hover:text-foreground border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Clear
                    </motion.button>
                )}

                <button
                    onClick={fetchMethods}
                    disabled={loading}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-navy border border-slate-200 hover:border-navy/30 hover:bg-navy/5 transition-all disabled:opacity-40"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>

                <span className="text-xs font-bold text-foreground/35 ml-auto tabular-nums">
                    {totalDocs} method{totalDocs !== 1 ? "s" : ""}
                </span>
            </div>

            {/* ── Card Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {loading ? (
                    [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
                ) : methods.length === 0 ? (
                    <EmptyState />
                ) : (
                    <AnimatePresence mode="popLayout">
                        {methods.map((method, i) => (
                            <PaymentMethodCard
                                key={method._id}
                                method={method}
                                index={i}
                                isSelected={!!(method._id && selectedIds.has(method._id))}
                                isAnySelected={selectedIds.size > 0}
                                isDeleting={!!(method._id && deletingIds.has(method._id))}
                                onSelect={toggleSelect}
                                onEdit={(m) => router.push(`/finance/payment-methods/${m._id}/edit`)}
                                onDelete={(id) => handleDelete([id])}
                                onStatusToggled={handleStatusToggled}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Pagination ── */}
            {!loading && methods.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        limit={limit}
                        totalDocs={totalDocs}
                        perPageOptions={perPageOptions}
                        onPageChange={setPage}
                        onLimitChange={(l) => { setLimit(l); setPage(1); }}
                    />
                </div>
            )}

            {/* ── Bulk Delete Floating Bar ── */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 28, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 28, scale: 0.95 }}
                        transition={{ type: "spring", damping: 22, stiffness: 280 }}
                        className="fixed bottom-7 inset-x-0 flex justify-center z-30 pointer-events-none"
                    >
                        <div className="pointer-events-auto bg-navy text-white rounded-2xl shadow-2xl shadow-navy/50 border border-white/10 px-5 py-3 flex items-center gap-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                                </div>
                                <span className="text-sm font-black tabular-nums">{selectedIds.size}</span>
                                <span className="text-sm text-white/60 font-medium">
                                    method{selectedIds.size !== 1 ? "s" : ""} selected
                                </span>
                            </div>

                            <div className="w-px h-5 bg-white/15" />

                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-xs font-semibold text-white/50 hover:text-white transition-colors"
                            >
                                Clear
                            </button>

                            <AnimatePresence mode="wait" initial={false}>
                                {confirmBulkDelete ? (
                                    <motion.div
                                        key="confirm"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="text-xs text-white/70 font-medium">Confirm delete?</span>
                                        <button
                                            onClick={() => setConfirmBulkDelete(false)}
                                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
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
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        onClick={() => setConfirmBulkDelete(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/35 text-red-200 hover:text-white border border-red-400/25 text-xs font-bold transition-all"
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

export default PaymentMethodsPage;
