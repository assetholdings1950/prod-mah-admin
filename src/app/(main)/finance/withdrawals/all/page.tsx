"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Trash2 } from "lucide-react";
import appClient from "@/lib/appClient";
import { useAppSelector } from "@/store/hooks/hooks";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import type { WithdrawalRequestInterface } from "@/interface/withdrawal";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import Pagination from "@/components/pagination/pagination";

import WithdrawalStatCards from "../_components/WithdrawalStatCards";
import type { WithdrawalSummary } from "../_components/WithdrawalStatCards";
import WithdrawalFilters from "../_components/WithdrawalFilters";
import WithdrawalTableRow from "../_components/WithdrawalTableRow";
import WithdrawalBulkBar from "../_components/WithdrawalBulkBar";
import ConfirmModal from "../../deposits/_components/ConfirmModal";
import RejectModal from "../../deposits/_components/RejectModal";
import { getUserName } from "../_components/types";

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

const EMPTY_SUMMARY: WithdrawalSummary = {
    pendingCount: 0, approvedCount: 0, rejectedCount: 0,
    totalAgentRequests: 0, totalClientRequests: 0, approvedVolumeByCurrency: {},
};

export default function WithdrawalsAllPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = useAppSelector((s) => s.auth.user);
    const isSuperAdmin = currentUser?.role?.some((r) => r.roleCode === "superadmin") ?? false;

    const [withdrawals, setWithdrawals] = useState<WithdrawalRequestInterface[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "pending");
    const [userModelFilter, setUserModelFilter] = useState(searchParams.get("userModel") ?? "all");

    const [summary, setSummary] = useState<WithdrawalSummary>(EMPTY_SUMMARY);
    const [summaryLoading, setSummaryLoading] = useState(false);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());
    const [bulkActioning, setBulkActioning] = useState(false);

    const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);
    const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string | null; bulk: boolean }>({
        open: false, id: null, bulk: false,
    });

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    useEffect(() => {
        const p = new URLSearchParams();
        if (statusFilter !== "all") p.set("status", statusFilter);
        if (userModelFilter !== "all") p.set("userModel", userModelFilter);
        const qs = p.toString();
        router.replace(`/finance/withdrawals/all${qs ? `?${qs}` : ""}`, { scroll: false } as Parameters<typeof router.replace>[1]);
    }, [statusFilter, userModelFilter]);

    const fetchWithdrawals = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (userModelFilter !== "all") params.set("userModel", userModelFilter);
            const res = await appClient.get(`/api/withdraws/list?${params}`);
            const d = res.data?.data ?? res.data;
            const docs = d?.docs ?? d?.data ?? (Array.isArray(d) ? d : []);
            setWithdrawals(docs);
            setTotalDocs(d?.totalDocs ?? docs.length);
            setTotalPages(d?.totalPages ?? 1);
        } catch {
            toastError("Failed to load withdrawal requests.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, userModelFilter]);

    useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const res = await appClient.get("/api/withdraws/summary");
            setSummary(res.data?.summary ?? EMPTY_SUMMARY);
        } catch {
            // non-critical
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    /* ── selection ── */
    const handleSelect = (id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? new Set(withdrawals.map((w) => w._id!)) : new Set());
    };

    const allSelected = withdrawals.length > 0 && selectedIds.size === withdrawals.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    /* ── single approve ── */
    const handleApprove = (id: string) => {
        const wd = withdrawals.find((w) => w._id === id);
        const name = wd ? getUserName(wd.userId) : "this request";
        setConfirmModal({
            open: true,
            title: "Approve Withdrawal",
            description: `Approve the withdrawal request from ${name}? This will deduct the amount from their wallet balance.`,
            confirmLabel: "Approve",
            variant: "success",
            onConfirm: () => doApprove(id),
        });
    };

    const doApprove = async (id: string) => {
        setConfirmModal(CLOSED_CONFIRM);
        setActioningIds((prev) => new Set(prev).add(id));
        try {
            const res = await appClient.patch(`/api/withdraws/approve?id=${id}`);
            if (res.data?.status || res.status === 200) {
                toastSuccess("Withdrawal approved.");
                fetchWithdrawals();
                fetchSummary();
            } else {
                toastError(res.data?.message ?? "Approval failed.");
            }
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Approval failed.");
        } finally {
            setActioningIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }
    };

    /* ── single reject ── */
    const handleReject = (id: string) => {
        setRejectModal({ open: true, id, bulk: false });
    };

    const doReject = async (note: string) => {
        const id = rejectModal.id!;
        setRejectModal({ open: false, id: null, bulk: false });
        setActioningIds((prev) => new Set(prev).add(id));
        try {
            const res = await appClient.patch(`/api/withdraws/reject?id=${id}`, { adminNote: note });
            if (res.data?.status || res.status === 200) {
                toastSuccess("Withdrawal rejected.");
                fetchWithdrawals();
                fetchSummary();
            } else {
                toastError(res.data?.message ?? "Rejection failed.");
            }
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Rejection failed.");
        } finally {
            setActioningIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }
    };

    /* ── bulk approve ── */
    const handleBulkApprove = () => {
        setConfirmModal({
            open: true,
            title: "Bulk Approve",
            description: `Approve all ${selectedIds.size} selected withdrawal(s)? Requests with insufficient balance will be skipped.`,
            confirmLabel: "Approve All",
            variant: "success",
            onConfirm: doBulkApprove,
        });
    };

    const doBulkApprove = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setBulkActioning(true);
        try {
            const res = await appClient.patch("/api/withdraws/bulk-approve", { ids: Array.from(selectedIds) });
            const count = res.data?.results?.approved?.length ?? 0;
            toastSuccess(`${count} withdrawal(s) approved.`);
            setSelectedIds(new Set());
            fetchWithdrawals();
            fetchSummary();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Bulk approve failed.");
        } finally {
            setBulkActioning(false);
        }
    };

    /* ── bulk reject ── */
    const handleBulkReject = () => {
        setRejectModal({ open: true, id: null, bulk: true });
    };

    const doBulkReject = async (note: string) => {
        setRejectModal({ open: false, id: null, bulk: false });
        setBulkActioning(true);
        try {
            const res = await appClient.patch("/api/withdraws/bulk-reject", { ids: Array.from(selectedIds), adminNote: note });
            const count = res.data?.results?.rejected?.length ?? 0;
            toastSuccess(`${count} withdrawal(s) rejected.`);
            setSelectedIds(new Set());
            fetchWithdrawals();
            fetchSummary();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Bulk reject failed.");
        } finally {
            setBulkActioning(false);
        }
    };

    /* ── delete all (super-admin only) ── */
    const handleDeleteAll = () => {
        setConfirmModal({
            open: true,
            title: "Delete All Withdrawals",
            description: "Permanently delete ALL withdrawal records? This cannot be undone.",
            confirmLabel: "Delete All",
            variant: "danger",
            onConfirm: doDeleteAll,
        });
    };

    const doDeleteAll = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setBulkActioning(true);
        try {
            const res = await appClient.delete("/api/withdraws/delete-all");
            const count = res.data?.deletedCount ?? "All";
            toastSuccess(`${count} withdrawal record(s) deleted.`);
            setSelectedIds(new Set());
            fetchWithdrawals();
            fetchSummary();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Delete all failed.");
        } finally {
            setBulkActioning(false);
        }
    };

    /* ── bulk delete ── */
    const handleBulkDelete = () => {
        setConfirmModal({
            open: true,
            title: "Delete Records",
            description: `Permanently delete ${selectedIds.size} withdrawal record(s)? This cannot be undone.`,
            confirmLabel: "Delete",
            variant: "danger",
            onConfirm: doBulkDelete,
        });
    };

    const doBulkDelete = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setBulkActioning(true);
        try {
            const res = await appClient.delete("/api/withdraws/delete", { data: { ids: Array.from(selectedIds) } });
            const count = res.data?.deletedCount ?? selectedIds.size;
            toastSuccess(`${count} record(s) deleted.`);
            setSelectedIds(new Set());
            fetchWithdrawals();
            fetchSummary();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Delete failed.");
        } finally {
            setBulkActioning(false);
        }
    };

    const handleRejectConfirm = (note: string) => {
        if (rejectModal.bulk) doBulkReject(note);
        else doReject(note);
    };

    return (
        <div className="flex flex-col gap-6 min-h-full pb-20">
            <div className="flex items-center justify-between">
                <WorksSpaceHeader heading="Withdrawal Requests" subHeading="Finance" isButtonVisible={false} />
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

            <WithdrawalStatCards summary={summary} loading={summaryLoading} />

            <WithdrawalFilters
                statusFilter={statusFilter}
                userModelFilter={userModelFilter}
                searchInput={searchInput}
                loading={loading}
                onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
                onUserModelChange={(v) => { setUserModelFilter(v); setPage(1); }}
                onSearchChange={setSearchInput}
                onRefresh={fetchWithdrawals}
            />

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="w-3.5 h-3.5 rounded border-slate-300 accent-slate-800 cursor-pointer"
                                    />
                                </th>
                                {["Requester", "Amount", "Method", "Date", "Status", "Decision / Actions"].map((h) => (
                                    <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        {[10, 160, 90, 130, 80, 80, 160].map((w, j) => (
                                            <td key={j} className="px-4 py-3.5">
                                                <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: w }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : withdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                <CreditCard size={24} className="text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">No withdrawal requests found</p>
                                            <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                withdrawals.map((wd, idx) => (
                                    <WithdrawalTableRow
                                        key={wd._id ?? idx}
                                        withdrawal={wd}
                                        isSelected={selectedIds.has(wd._id!)}
                                        isActioning={actioningIds.has(wd._id!) || bulkActioning}
                                        onSelect={handleSelect}
                                        onApprove={handleApprove}
                                        onReject={handleReject}
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
                        perPageOptions={[10, 15, 25, 50]}
                        onPageChange={setPage}
                        onLimitChange={(l) => { setLimit(l); setPage(1); }}
                    />
                )}
            </div>

            <WithdrawalBulkBar
                selectedCount={selectedIds.size}
                isActioning={bulkActioning}
                onBulkApprove={handleBulkApprove}
                onBulkReject={handleBulkReject}
                onBulkDelete={handleBulkDelete}
                onClearSelection={() => setSelectedIds(new Set())}
            />

            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(CLOSED_CONFIRM)}
            />

            <RejectModal
                open={rejectModal.open}
                title={rejectModal.bulk ? `Reject ${selectedIds.size} Withdrawal(s)` : "Reject Withdrawal"}
                subtitle={rejectModal.bulk ? "A single note will be applied to all selected requests" : "Provide a reason for the requester"}
                onConfirm={handleRejectConfirm}
                onCancel={() => setRejectModal({ open: false, id: null, bulk: false })}
            />
        </div>
    );
}
