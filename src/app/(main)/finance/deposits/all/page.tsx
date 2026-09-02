"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, Trash2 } from "lucide-react";
import appClient from "@/lib/appClient";
import { useAppSelector } from "@/store/hooks/hooks";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import type { DepositRequestInterface } from "@/interface/deposit";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import Pagination from "@/components/pagination/pagination";

import DepositStatCards from "../_components/DepositStatCards";
import type { DepositSummary } from "../_components/DepositStatCards";
import DepositFilters from "../_components/DepositFilters";
import DepositTableRow from "../_components/DepositTableRow";
import DepositBulkBar from "../_components/DepositBulkBar";
import ConfirmModal from "../_components/ConfirmModal";
import RejectModal from "../_components/RejectModal";
import { getUserName } from "../_components/types";

/* ─── modal state shapes ─── */
type ConfirmState = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "danger" | "warning" | "success";
    onConfirm: () => void;
};

const CLOSED_CONFIRM: ConfirmState = {
    open: false, title: "", description: "", confirmLabel: "", variant: "danger", onConfirm: () => { },
};

const EMPTY_SUMMARY = { pendingCount: 0, approvedCount: 0, rejectedCount: 0, totalAgentRequests: 0, totalClientRequests: 0, approvedVolumeByCurrency: {} };

export default function DepositsAllPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = useAppSelector((s) => s.auth.user);
    const isSuperAdmin = currentUser?.role?.some((r) => r.roleCode === "superadmin") ?? false;

    /* ── list state ── */
    const [deposits, setDeposits] = useState<DepositRequestInterface[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    /* ── filter state ── */
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "pending");
    const [userModelFilter, setUserModelFilter] = useState(searchParams.get("userModel") ?? "all");

    /* ── summary state ── */
    const [summary, setSummary] = useState<DepositSummary>(EMPTY_SUMMARY);
    const [summaryLoading, setSummaryLoading] = useState(false);

    /* ── selection state ── */
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());
    const [bulkActioning, setBulkActioning] = useState(false);

    /* ── modal state ── */
    const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);
    const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string | null; bulk: boolean }>({ open: false, id: null, bulk: false });

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
        if (statusFilter !== "all") p.set("status", statusFilter);
        if (userModelFilter !== "all") p.set("userModel", userModelFilter);
        const qs = p.toString();
        router.replace(`/finance/deposits/all${qs ? `?${qs}` : ""}`, { scroll: false } as Parameters<typeof router.replace>[1]);
    }, [statusFilter, userModelFilter]);

    /* ── fetch ── */
    const fetchDeposits = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (userModelFilter !== "all") params.set("userModel", userModelFilter);
            const res = await appClient.get(`/api/deposits/list?${params}`);
            const d = res.data?.deposits ?? res.data?.data ?? res.data;
            const docs = d?.docs ?? d?.data ?? (Array.isArray(d) ? d : []);
            setDeposits(docs);
            setTotalDocs(d?.totalDocs ?? docs.length);
            setTotalPages(d?.totalPages ?? 1);
        } catch {
            toastError("Failed to load deposits.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, userModelFilter]);

    useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

    /* ── fetch summary ── */
    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const res = await appClient.get("/api/deposits/summary");
            console.log({ res })
            setSummary(res.data?.summary ?? EMPTY_SUMMARY);
        } catch {
            // non-critical — leave previous values
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);

    /* ── selection helpers ── */
    const handleSelect = (id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? new Set(deposits.map((d) => d._id!)) : new Set());
    };

    const allSelected = deposits.length > 0 && selectedIds.size === deposits.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    /* ── single approve (with confirm) ── */
    const handleApprove = (id: string) => {
        const dep = deposits.find((d) => d._id === id);
        const name = dep ? getUserName(dep.userId) : "this deposit";
        setConfirmModal({
            open: true,
            title: "Approve Deposit",
            description: `Approve the deposit from ${name}? This will credit their wallet balance.`,
            confirmLabel: "Approve",
            variant: "success",
            onConfirm: () => doApprove(id),
        });
    };

    const doApprove = async (id: string) => {
        setConfirmModal(CLOSED_CONFIRM);
        setActioningIds((prev) => new Set(prev).add(id));
        try {
            const res = await appClient.patch(`/api/deposits/approve?id=${id}`);
            if (res.data?.status || res.status === 200) {
                toastSuccess("Deposit approved.");
                fetchDeposits();
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

    /* ── single reject (with note modal) ── */
    const handleReject = (id: string) => {
        setRejectModal({ open: true, id, bulk: false });
    };

    const doReject = async (note: string) => {
        const id = rejectModal.id!;
        setRejectModal({ open: false, id: null, bulk: false });
        setActioningIds((prev) => new Set(prev).add(id));
        try {
            const res = await appClient.patch(`/api/deposits/reject?id=${id}`, { adminNote: note });
            if (res.data?.status || res.status === 200) {
                toastSuccess("Deposit rejected.");
                fetchDeposits();
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

    /* ── bulk approve (with confirm) ── */
    const handleBulkApprove = () => {
        setConfirmModal({
            open: true,
            title: "Bulk Approve",
            description: `Approve all ${selectedIds.size} selected deposit(s)? Only pending deposits will be processed.`,
            confirmLabel: "Approve All",
            variant: "success",
            onConfirm: doBulkApprove,
        });
    };

    const doBulkApprove = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setBulkActioning(true);
        try {
            const res = await appClient.patch("/api/deposits/bulk-approve", { ids: Array.from(selectedIds) });
            const results = res.data?.results;
            const count = results?.approved?.length ?? 0;
            toastSuccess(`${count} deposit(s) approved.`);
            setSelectedIds(new Set());
            fetchDeposits();
            fetchSummary();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Bulk approve failed.");
        } finally {
            setBulkActioning(false);
        }
    };

    /* ── bulk reject (with note modal) ── */
    const handleBulkReject = () => {
        setRejectModal({ open: true, id: null, bulk: true });
    };

    const doBulkReject = async (note: string) => {
        setRejectModal({ open: false, id: null, bulk: false });
        setBulkActioning(true);
        try {
            const res = await appClient.patch("/api/deposits/bulk-reject", { ids: Array.from(selectedIds), adminNote: note });
            const results = res.data?.results;
            const count = results?.rejected?.length ?? 0;
            toastSuccess(`${count} deposit(s) rejected.`);
            setSelectedIds(new Set());
            fetchDeposits();
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
            title: "Delete All Deposits",
            description: "Permanently delete ALL deposit records? This cannot be undone.",
            confirmLabel: "Delete All",
            variant: "danger",
            onConfirm: doDeleteAll,
        });
    };

    const doDeleteAll = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setBulkActioning(true);
        try {
            const res = await appClient.delete("/api/deposits/delete-all");
            const count = res.data?.deletedCount ?? "All";
            toastSuccess(`${count} deposit record(s) deleted.`);
            setSelectedIds(new Set());
            fetchDeposits();
            fetchSummary();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Delete all failed.");
        } finally {
            setBulkActioning(false);
        }
    };

    /* ── bulk delete (with confirm) ── */
    const handleBulkDelete = () => {
        setConfirmModal({
            open: true,
            title: "Delete Records",
            description: `Permanently delete ${selectedIds.size} deposit record(s)? This cannot be undone.`,
            confirmLabel: "Delete",
            variant: "danger",
            onConfirm: doBulkDelete,
        });
    };

    const doBulkDelete = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setBulkActioning(true);
        try {
            const res = await appClient.delete("/api/deposits/delete", { data: { ids: Array.from(selectedIds) } });
            const count = res.data?.deletedCount ?? selectedIds.size;
            toastSuccess(`${count} record(s) deleted.`);
            setSelectedIds(new Set());
            fetchDeposits();
            fetchSummary();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Delete failed.");
        } finally {
            setBulkActioning(false);
        }
    };

    /* ── reject modal dispatcher ── */
    const handleRejectConfirm = (note: string) => {
        if (rejectModal.bulk) {
            doBulkReject(note);
        } else {
            doReject(note);
        }
    };

    return (
        <div className="flex flex-col gap-6 min-h-full pb-20">
            <div className="flex items-center justify-between">
                <WorksSpaceHeader heading="Deposit Requests" subHeading="Finance" isButtonVisible={false} />
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

            <DepositStatCards summary={summary} loading={summaryLoading} />

            <DepositFilters
                statusFilter={statusFilter}
                userModelFilter={userModelFilter}
                searchInput={searchInput}
                loading={loading}
                onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
                onUserModelChange={(v) => { setUserModelFilter(v); setPage(1); }}
                onSearchChange={setSearchInput}
                onRefresh={fetchDeposits}
            />

            {/* table */}
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
                                {["Depositor", "Amount", "Method", "Date", "Status", "Decision / Actions"].map((h) => (
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
                            ) : deposits.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                <Wallet size={24} className="text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">No deposits found</p>
                                            <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                deposits.map((dep, idx) => (
                                    <DepositTableRow
                                        key={dep._id ?? idx}
                                        deposit={dep}
                                        isSelected={selectedIds.has(dep._id!)}
                                        isActioning={actioningIds.has(dep._id!) || bulkActioning}
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

            {/* bulk bar */}
            <DepositBulkBar
                selectedCount={selectedIds.size}
                isActioning={bulkActioning}
                onBulkApprove={handleBulkApprove}
                onBulkReject={handleBulkReject}
                onBulkDelete={handleBulkDelete}
                onClearSelection={() => setSelectedIds(new Set())}
            />

            {/* confirm modal */}
            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(CLOSED_CONFIRM)}
            />

            {/* reject modal (single + bulk) */}
            <RejectModal
                open={rejectModal.open}
                title={rejectModal.bulk ? `Reject ${selectedIds.size} Deposit(s)` : "Reject Deposit"}
                subtitle={rejectModal.bulk ? "A single note will be applied to all selected deposits" : "Provide a reason for the depositor"}
                onConfirm={handleRejectConfirm}
                onCancel={() => setRejectModal({ open: false, id: null, bulk: false })}
            />
        </div>
    );
}
