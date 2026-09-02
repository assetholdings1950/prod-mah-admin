"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Receipt, Trash2 } from "lucide-react";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { useAppSelector } from "@/store/hooks/hooks";
import ConfirmModal from "../../deposits/_components/ConfirmModal";
import type { TransactionInterface, TransactionSummary, TransactionType, TransactionStatus } from "@/interface/transaction";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import Pagination from "@/components/pagination/pagination";

import TransactionStatCards from "../_components/TransactionStatCards";
import TransactionFilters from "../_components/TransactionFilters";
import TransactionTableRow from "../_components/TransactionTableRow";
import TransactionDetailModal from "../_components/TransactionDetailModal";

const EMPTY_SUMMARY: TransactionSummary = {
    totalCount: 0, completedCount: 0, pendingCount: 0, failedCount: 0,
    depositCount: 0, withdrawalCount: 0, investmentCount: 0, earningCount: 0,
    completedVolume: 0, volumeByCurrency: {},
};

type ConfirmState = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "danger" | "warning" | "success";
    onConfirm: () => void;
};

const CLOSED_CONFIRM: ConfirmState = {
    open: false, title: "", description: "", confirmLabel: "", variant: "danger", onConfirm: () => {},
};

export default function TransactionsAllPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = useAppSelector((s) => s.auth.user);
    const isSuperAdmin = currentUser?.role?.some((r) => r.roleCode === "superadmin") ?? false;

    const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);
    const [bulkActioning, setBulkActioning] = useState(false);

    /* ── list state ── */
    const [transactions, setTransactions] = useState<TransactionInterface[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    /* ── modal state ── */
    const [selectedTx, setSelectedTx] = useState<TransactionInterface | null>(null);

    /* ── summary state ── */
    const [summary, setSummary] = useState<TransactionSummary>(EMPTY_SUMMARY);
    const [summaryLoading, setSummaryLoading] = useState(false);

    /* ── filter state ── */
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<TransactionType | "all">(
        (searchParams.get("type") as TransactionType) ?? "all"
    );
    const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">(
        (searchParams.get("status") as TransactionStatus) ?? "all"
    );
    const [userModelFilter, setUserModelFilter] = useState(searchParams.get("userModel") ?? "all");
    const [startDate, setStartDate] = useState(searchParams.get("startDate") ?? "");
    const [endDate, setEndDate] = useState(searchParams.get("endDate") ?? "");
    const [sortBy, setSortBy] = useState(searchParams.get("sortBy") ?? "createdAt");
    const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") ?? "desc");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ── search debounce ── */
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    /* ── URL sync ── */
    useEffect(() => {
        const p = new URLSearchParams();
        if (typeFilter !== "all") p.set("type", typeFilter);
        if (statusFilter !== "all") p.set("status", statusFilter);
        if (userModelFilter !== "all") p.set("userModel", userModelFilter);
        if (startDate) p.set("startDate", startDate);
        if (endDate) p.set("endDate", endDate);
        if (sortBy !== "createdAt") p.set("sortBy", sortBy);
        if (sortOrder !== "desc") p.set("sortOrder", sortOrder);
        const qs = p.toString();
        router.replace(`/finance/transactions/all${qs ? `?${qs}` : ""}`, { scroll: false } as Parameters<typeof router.replace>[1]);
    }, [typeFilter, statusFilter, userModelFilter, startDate, endDate, sortBy, sortOrder]);

    /* ── fetch list ── */
    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), search, sortBy, sortOrder });
            if (typeFilter !== "all") params.set("type", typeFilter);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (userModelFilter !== "all") params.set("userModel", userModelFilter);
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
    }, [page, limit, search, typeFilter, statusFilter, userModelFilter, startDate, endDate, sortBy, sortOrder]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    /* ── fetch summary ── */
    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const res = await appClient.get("/api/transactions/summary");
            setSummary(res.data?.summary ?? EMPTY_SUMMARY);
        } catch {
            // non-critical
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    /* ── delete all (super-admin only) ── */
    const handleDeleteAll = () => {
        setConfirmModal({
            open: true,
            title: "Delete All Transactions",
            description: "Permanently delete ALL transaction records? This cannot be undone.",
            confirmLabel: "Delete All",
            variant: "danger",
            onConfirm: doDeleteAll,
        });
    };

    const doDeleteAll = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setBulkActioning(true);
        try {
            const res = await appClient.delete("/api/transactions/delete-all");
            const count = res.data?.deletedCount ?? "All";
            toastSuccess(`${count} transaction record(s) deleted.`);
            fetchTransactions();
            fetchSummary();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Delete all failed.");
        } finally {
            setBulkActioning(false);
        }
    };

    const handleSortOrderToggle = () => {
        setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
        setPage(1);
    };

    const handleSortByChange = (v: string) => {
        setSortBy(v);
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-6 min-h-full pb-20">
            <div className="flex items-center justify-between">
                <WorksSpaceHeader heading="Transactions" subHeading="Finance" isButtonVisible={false} />
                {isSuperAdmin && (
                    <button
                        onClick={handleDeleteAll}
                        disabled={bulkActioning}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm"
                    >
                        <Trash2 size={15} />
                        Delete All
                    </button>
                )}
            </div>

            <TransactionStatCards summary={summary} loading={summaryLoading} />

            <TransactionFilters
                typeFilter={typeFilter}
                statusFilter={statusFilter}
                userModelFilter={userModelFilter}
                searchInput={searchInput}
                startDate={startDate}
                endDate={endDate}
                sortBy={sortBy}
                sortOrder={sortOrder}
                loading={loading}
                onTypeChange={(v) => { setTypeFilter(v); setPage(1); }}
                onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
                onUserModelChange={(v) => { setUserModelFilter(v); setPage(1); }}
                onSearchChange={setSearchInput}
                onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
                onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
                onSortByChange={handleSortByChange}
                onSortOrderToggle={handleSortOrderToggle}
                onRefresh={fetchTransactions}
            />

            {/* table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="overflow-auto max-h-[calc(100vh-360px)]">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-100 bg-slate-50">
                                {["User", "Type", "Amount", "Description", "Date", "Status", "Created By"].map((h) => (
                                    <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        {[160, 90, 80, 180, 90, 80, 100].map((w, j) => (
                                            <td key={j} className="px-4 py-3.5">
                                                <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: w }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                <Receipt size={24} className="text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">No transactions found</p>
                                            <p className="text-xs text-slate-400">Try adjusting your filters or date range.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx, idx) => (
                                    <TransactionTableRow
                                        key={tx._id ?? idx}
                                        transaction={tx}
                                        onClick={setSelectedTx}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && totalPages > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        limit={limit}
                        totalDocs={totalDocs}
                        perPageOptions={[10, 25, 50, 100]}
                        onPageChange={setPage}
                        onLimitChange={(l) => { setLimit(l); setPage(1); }}
                    />
                )}
            </div>
            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(CLOSED_CONFIRM)}
            />

            {/* detail modal */}
            <TransactionDetailModal
                transaction={selectedTx}
                onClose={() => setSelectedTx(null)}
            />
        </div>
    );
}
