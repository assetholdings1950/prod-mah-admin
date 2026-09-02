"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowDown, ArrowUp, ArrowUpDown, Calendar, ChevronDown, ChevronLeft, ChevronRight,
    Receipt, RefreshCw, Search, Trash2,
} from "lucide-react";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { useAppSelector } from "@/store/hooks/hooks";
import ConfirmModal from "@/app/(main)/finance/deposits/_components/ConfirmModal";
import type { TransactionInterface } from "@/interface/transaction";
import TransactionDetailModal from "@/app/(main)/finance/transactions/_components/TransactionDetailModal";
import {
    TYPE_CONFIG, STATUS_CONFIG, CURRENCY_CONFIG, getCurrencyConfig,
    formatCurrencyAmount, formatDate, formatTime,
} from "@/app/(main)/finance/transactions/_components/types";

/* ─── local types ─── */
type TxType = "deposit" | "withdrawal" | "investment" | "earning";
type TxStatus = "completed" | "pending" | "failed";

interface Props {
    clientId: string;
    userModel?: "Client" | "Agent";
}

const TYPE_TABS: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "deposit", label: "Deposits" },
    { value: "withdrawal", label: "Withdrawals" },
    { value: "investment", label: "Investments" },
    { value: "earning", label: "Earnings" },
];

const STATUS_OPTIONS: { value: string; label: string; dot: string }[] = [
    { value: "all", label: "All Status", dot: "bg-slate-300" },
    { value: "completed", label: "Completed", dot: "bg-emerald-400" },
    { value: "pending", label: "Pending", dot: "bg-amber-400" },
    { value: "failed", label: "Failed", dot: "bg-red-400" },
];

/* ─── tiny dropdown ─── */
function StatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const active = STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button
                onClick={() => setOpen((p) => !p)}
                className="flex items-center gap-1.5 h-9 px-3 text-[12px] font-medium bg-slate-50 border border-slate-200 rounded-lg hover:bg-white transition-colors"
            >
                <span className={`w-2 h-2 rounded-full shrink-0 ${active.dot}`} />
                {active.label}
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px]">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-slate-50 transition-colors ${value === opt.value ? "text-slate-800" : "text-slate-500"}`}
                        >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                            {opt.label}
                            {value === opt.value && <span className="ml-auto text-[10px] text-slate-400">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── table row ─── */
function TxRow({ tx, onClick }: { tx: TransactionInterface; onClick: (tx: TransactionInterface) => void }) {
    const tc = TYPE_CONFIG[tx.type];
    const sc = STATUS_CONFIG[tx.status];
    const cc = getCurrencyConfig(tx.currency);
    const TypeIcon = tc.icon;
    const CurrencyIcon = CURRENCY_CONFIG[tx.currency]?.icon;
    const isInflow = tx.type === "deposit" || tx.type === "earning";

    return (
        <tr
            onClick={() => onClick(tx)}
            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
            {/* type */}
            <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tc.chip}`}>
                    <TypeIcon size={10} />
                    {tc.label}
                </span>
            </td>

            {/* amount */}
            <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${cc.iconBg}`}>
                        {CurrencyIcon
                            ? <CurrencyIcon size={11} className={cc.iconColor} />
                            : <span className={`text-[10px] font-black leading-none ${cc.iconColor}`}>{cc.symbol}</span>
                        }
                    </div>
                    <div>
                        <p className={`text-[13px] font-bold leading-tight ${isInflow ? "text-emerald-600" : "text-rose-600"}`}>
                            {isInflow ? "+" : "−"}{formatCurrencyAmount(tx.amount, tx.currency)}
                        </p>
                        <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded border ${cc.chip}`}>
                            {cc.label}
                        </span>
                    </div>
                </div>
            </td>

            {/* description */}
            <td className="px-4 py-3 max-w-[200px]">
                <p className="text-[12px] text-slate-600 truncate">{tx.description || "—"}</p>
                {tx.referenceId && (
                    <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                        #{String(tx.referenceId).slice(-8)}
                    </p>
                )}
            </td>

            {/* date */}
            <td className="px-4 py-3 whitespace-nowrap">
                <p className="text-[12px] text-slate-600">{formatDate(tx.createdAt)}</p>
                <p className="text-[11px] text-slate-400">{formatTime(tx.createdAt)}</p>
            </td>

            {/* status */}
            <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${sc.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                </span>
            </td>
        </tr>
    );
}

type ConfirmState = {
    open: boolean; title: string; description: string;
    confirmLabel: string; variant: "danger" | "warning" | "success"; onConfirm: () => void;
};
const CLOSED_CONFIRM: ConfirmState = {
    open: false, title: "", description: "", confirmLabel: "", variant: "danger", onConfirm: () => {},
};

/* ─── main component ─── */
export default function TransactionHistoryTab({ clientId, userModel = "Client" }: Props) {
    const currentUser = useAppSelector((s) => s.auth.user);
    const isSuperAdmin = currentUser?.role?.some((r) => r.roleCode === "superadmin") ?? false;
    const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);
    const [deleting, setDeleting] = useState(false);

    const [transactions, setTransactions] = useState<TransactionInterface[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalDocs, setTotalDocs] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedTx, setSelectedTx] = useState<TransactionInterface | null>(null);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<TxType | "all">("all");
    const [statusFilter, setStatusFilter] = useState<TxStatus | "all">("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page), limit: String(limit),
                search, sortBy, sortOrder,
                userId: clientId, userModel,
            });
            if (typeFilter !== "all") params.set("type", typeFilter);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            const res = await appClient.get(`/api/transactions/list?${params}`);
            const d = res.data?.transactions ?? res.data?.data ?? res.data;
            const docs = d?.docs ?? d?.data ?? (Array.isArray(d) ? d : []);
            setTransactions(docs);
            setTotalDocs(d?.totalDocs ?? docs.length);
            setTotalPages(d?.totalPages ?? 1);
        } catch {
            toastError("Failed to load transactions.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, typeFilter, statusFilter, startDate, endDate, sortBy, sortOrder, clientId, userModel]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const handleDeleteAll = () => {
        setConfirmModal({
            open: true,
            title: "Delete All Transactions",
            description: "Permanently delete ALL transaction history for this client? This cannot be undone.",
            confirmLabel: "Delete All",
            variant: "danger",
            onConfirm: doDeleteAll,
        });
    };

    const doDeleteAll = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setDeleting(true);
        try {
            const res = await appClient.delete(
                `/api/transactions/delete-by-user?userId=${clientId}&userModel=${userModel}`
            );
            toastSuccess(`${res.data?.deletedCount ?? "All"} transaction(s) deleted.`);
            fetchTransactions();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Delete failed.");
        } finally {
            setDeleting(false);
        }
    };

    const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;
    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder((p) => p === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* filters */}
            <div className="flex flex-col gap-3">
                {/* type tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                    {TYPE_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => { setTypeFilter(tab.value as TxType | "all"); setPage(1); }}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                                typeFilter === tab.value
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* row 2: search + status + date + sort */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search description…"
                            className="w-full h-9 pl-8 pr-3 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                        />
                    </div>

                    <StatusDropdown value={statusFilter} onChange={(v) => { setStatusFilter(v as TxStatus | "all"); setPage(1); }} />

                    {/* date range */}
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400 shrink-0" />
                        <input
                            type="date" value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="h-9 px-2.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-400">to</span>
                        <input
                            type="date" value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="h-9 px-2.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 cursor-pointer"
                        />
                    </div>

                    {/* sort */}
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1 h-9">
                        {[{ value: "createdAt", label: "Date" }, { value: "amount", label: "Amount" }].map((f) => (
                            <button
                                key={f.value}
                                onClick={() => toggleSort(f.value)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    sortBy === f.value
                                        ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {f.label}
                                {sortBy === f.value && <SortIcon size={10} />}
                                {sortBy !== f.value && <ArrowUpDown size={10} className="opacity-30" />}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={fetchTransactions}
                        disabled={loading}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    </button>

                    {isSuperAdmin && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={deleting || loading}
                            className="flex items-center gap-1.5 h-9 px-3 bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold rounded-lg transition-all disabled:opacity-50"
                        >
                            <Trash2 size={12} />
                            Delete All
                        </button>
                    )}
                </div>
            </div>

            {/* table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            {["Type", "Amount", "Description", "Date", "Status"].map((h) => (
                                <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    {[80, 100, 180, 90, 80].map((w, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: w }} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                            : transactions.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                                    <Receipt size={20} className="text-slate-400" />
                                                </div>
                                                <p className="text-[13px] font-medium text-slate-600">No transactions found</p>
                                                <p className="text-[11px] text-slate-400">Try adjusting your filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )
                                : transactions.map((tx, i) => (
                                    <TxRow key={tx._id ?? i} tx={tx} onClick={setSelectedTx} />
                                ))
                        }
                    </tbody>
                </table>

                {/* pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-[11px] text-slate-500">{totalDocs.toLocaleString()} transactions</p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:border-slate-200 border border-transparent disabled:opacity-40 transition-all"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <span className="text-[12px] text-slate-600 font-medium px-1">{page} / {totalPages}</span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white hover:border-slate-200 border border-transparent disabled:opacity-40 transition-all"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
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
