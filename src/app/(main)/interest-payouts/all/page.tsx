"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Coins, BarChart3, TrendingUp, Trash2 } from "lucide-react";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { useAppSelector } from "@/store/hooks/hooks";
import ConfirmModal from "../../finance/deposits/_components/ConfirmModal";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import Pagination from "@/components/pagination/pagination";

import type { PortfolioInterface, PortfolioPayoutAdminSummary } from "@/interface/portfolio";
import type { TransactionInterface } from "@/interface/transaction";
import TransactionTableRow from "../../finance/transactions/_components/TransactionTableRow";
import TransactionDetailModal from "../../finance/transactions/_components/TransactionDetailModal";

import PayoutStatCards from "../_components/PayoutStatCards";
import PayoutFilters from "../_components/PayoutFilters";
import PortfolioTableRow from "../_components/PortfolioTableRow";
import PortfolioDetailModal from "../_components/PortfolioDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "history" | "tracker";

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

const EMPTY_PAYOUT_SUMMARY: PortfolioPayoutAdminSummary = {
    totalPortfolios: 0, activeCount: 0, maturedCount: 0,
    totalInvestedUsd: 0, totalExpectedProfitUsd: 0, totalPaidProfitUsd: 0,
    pendingProfitUsd: 0, totalCurrentValueUsd: 0,
    sipCount: 0, lumpsumCount: 0, monthlyPayoutCount: 0, maturityPayoutCount: 0,
    thisMonthPayoutCount: 0, thisMonthPaidUsd: 0,
};

const TX_HEADERS = ["Client", "Amount", "Currency", "Description", "Date", "Status", "Created By"];
const PF_HEADERS = ["Client", "Portfolio ID", "Plan", "Invested", "Expected Profit", "Paid / Progress", "Pending", "Maturity", "Status"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InterestPayoutsAllPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = useAppSelector((s) => s.auth.user);
    const isSuperAdmin = currentUser?.role?.some((r) => r.roleCode === "superadmin") ?? false;

    const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);
    const [deleting, setDeleting] = useState(false);

    const [activeTab, setActiveTab] = useState<ActiveTab>(
        (searchParams.get("tab") as ActiveTab) ?? "history"
    );

    // ── Shared summary ────────────────────────────────────────────────────────
    const [payoutSummary, setPayoutSummary] = useState<PortfolioPayoutAdminSummary>(EMPTY_PAYOUT_SUMMARY);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // ── Tab 1: Earning transactions ───────────────────────────────────────────
    const [transactions, setTransactions]   = useState<TransactionInterface[]>([]);
    const [txPage, setTxPage]               = useState(1);
    const [txLimit, setTxLimit]             = useState(25);
    const [txTotalDocs, setTxTotalDocs]     = useState(0);
    const [txTotalPages, setTxTotalPages]   = useState(0);
    const [txLoading, setTxLoading]         = useState(false);
    const [selectedTx, setSelectedTx]       = useState<TransactionInterface | null>(null);

    // ── Tab 2: Portfolio tracker ──────────────────────────────────────────────
    const [portfolios, setPortfolios]       = useState<PortfolioInterface[]>([]);
    const [pfPage, setPfPage]               = useState(1);
    const [pfLimit, setPfLimit]             = useState(20);
    const [pfTotalDocs, setPfTotalDocs]     = useState(0);
    const [pfTotalPages, setPfTotalPages]   = useState(0);
    const [pfLoading, setPfLoading]         = useState(false);
    const [selectedPf, setSelectedPf]       = useState<PortfolioInterface | null>(null);

    // ── Shared filters ────────────────────────────────────────────────────────
    const [searchInput, setSearchInput]   = useState(searchParams.get("search") ?? "");
    const [search, setSearch]             = useState(searchParams.get("search") ?? "");
    const [startDate, setStartDate]       = useState(searchParams.get("startDate") ?? "");
    const [endDate, setEndDate]           = useState(searchParams.get("endDate") ?? "");
    const [sortBy, setSortBy]             = useState(searchParams.get("sortBy") ?? "createdAt");
    const [sortOrder, setSortOrder]       = useState(searchParams.get("sortOrder") ?? "desc");

    // ── Portfolio-specific filters ────────────────────────────────────────────
    const [statusFilter, setStatusFilter]     = useState(searchParams.get("status") ?? "all");
    const [modeFilter, setModeFilter]         = useState(searchParams.get("mode") ?? "all");
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") ?? "all");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Debounce search ───────────────────────────────────────────────────────
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setSearch(searchInput); setTxPage(1); setPfPage(1); }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    // ── URL sync ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const p = new URLSearchParams();
        if (activeTab !== "history") p.set("tab", activeTab);
        if (search) p.set("search", search);
        if (startDate) p.set("startDate", startDate);
        if (endDate) p.set("endDate", endDate);
        if (sortBy !== "createdAt") p.set("sortBy", sortBy);
        if (sortOrder !== "desc") p.set("sortOrder", sortOrder);
        if (statusFilter !== "all") p.set("status", statusFilter);
        if (modeFilter !== "all") p.set("mode", modeFilter);
        if (categoryFilter !== "all") p.set("category", categoryFilter);
        const qs = p.toString();
        router.replace(`/interest-payouts/all${qs ? `?${qs}` : ""}`, { scroll: false } as Parameters<typeof router.replace>[1]);
    }, [activeTab, search, startDate, endDate, sortBy, sortOrder, statusFilter, modeFilter, categoryFilter]);

    // ── Fetch payout summary ──────────────────────────────────────────────────
    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const res = await appClient.get("/api/portfolio/admin/payout-summary");
            setPayoutSummary(res.data?.summary ?? EMPTY_PAYOUT_SUMMARY);
        } catch { /* non-critical */ } finally {
            setSummaryLoading(false);
        }
    }, []);

    useEffect(() => { void fetchSummary(); }, [fetchSummary]);

    // ── Fetch earning transactions (Tab 1) ────────────────────────────────────
    const fetchTransactions = useCallback(async () => {
        setTxLoading(true);
        try {
            const p = new URLSearchParams({ page: String(txPage), limit: String(txLimit), search, type: "earning", sortBy: "createdAt", sortOrder });
            if (startDate) p.set("startDate", startDate);
            if (endDate) p.set("endDate", endDate);
            const res = await appClient.get(`/api/transactions/list?${p.toString()}`);
            const d = res.data?.transactions ?? res.data?.data ?? res.data;
            const docs = d?.docs ?? d?.data ?? (Array.isArray(d) ? d : []);
            setTransactions(docs);
            setTxTotalDocs(d?.totalDocs ?? docs.length);
            setTxTotalPages(d?.totalPages ?? 1);
        } catch { /* silent */ } finally {
            setTxLoading(false);
        }
    }, [txPage, txLimit, search, startDate, endDate, sortOrder]);

    useEffect(() => {
        if (activeTab === "history") void fetchTransactions();
    }, [activeTab, fetchTransactions]);

    // ── Fetch portfolios (Tab 2) ──────────────────────────────────────────────
    const fetchPortfolios = useCallback(async () => {
        setPfLoading(true);
        try {
            const p = new URLSearchParams({ page: String(pfPage), limit: String(pfLimit), search, sortBy, sortOrder });
            if (statusFilter !== "all") p.set("status", statusFilter);
            if (modeFilter !== "all") p.set("investmentMode", modeFilter);
            if (categoryFilter !== "all") p.set("category", categoryFilter);
            if (startDate) p.set("startDate", startDate);
            if (endDate) p.set("endDate", endDate);
            const res = await appClient.get(`/api/portfolio/admin/list?${p.toString()}`);
            const d = res.data;
            setPortfolios(d?.portfolios ?? []);
            setPfTotalDocs(d?.pagination?.total ?? 0);
            setPfTotalPages(d?.pagination?.totalPages ?? 1);
        } catch { /* silent */ } finally {
            setPfLoading(false);
        }
    }, [pfPage, pfLimit, search, statusFilter, modeFilter, categoryFilter, startDate, endDate, sortBy, sortOrder]);

    useEffect(() => {
        if (activeTab === "tracker") void fetchPortfolios();
    }, [activeTab, fetchPortfolios]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleDeleteAllPortfolios = () => {
        setConfirmModal({
            open: true,
            title: "Delete All Portfolios",
            description: "Permanently delete ALL portfolio records? This cannot be undone.",
            confirmLabel: "Delete All",
            variant: "danger",
            onConfirm: doDeleteAllPortfolios,
        });
    };

    const doDeleteAllPortfolios = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setDeleting(true);
        try {
            const res = await appClient.delete("/api/portfolio/admin/delete-all");
            const count = res.data?.deletedCount ?? "All";
            toastSuccess(`${count} portfolio record(s) deleted.`);
            fetchPortfolios();
            fetchSummary();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Delete all failed.");
        } finally {
            setDeleting(false);
        }
    };

    function handleClearFilters() {
        setSearchInput(""); setSearch("");
        setStartDate(""); setEndDate("");
        setStatusFilter("all"); setModeFilter("all"); setCategoryFilter("all");
        setSortBy("createdAt"); setSortOrder("desc");
        setTxPage(1); setPfPage(1);
    }

    function handleTabChange(tab: ActiveTab) {
        setActiveTab(tab);
        setTxPage(1); setPfPage(1);
    }

    const currentLoading = activeTab === "history" ? txLoading : pfLoading;

    return (
        <div className="flex flex-col gap-6 min-h-full pb-20">
            <WorksSpaceHeader heading="Interest Payouts" subHeading="Earnings" isButtonVisible={false} />

            {/* Summary stat cards */}
            <PayoutStatCards summary={payoutSummary} loading={summaryLoading} />

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-100 shadow-sm p-1.5 w-fit">
                {([
                    { key: "history", label: "Payout History",    Icon: Coins,     desc: "All earning transactions" },
                    { key: "tracker", label: "Portfolio Tracker", Icon: BarChart3, desc: "Interest accrual per portfolio" },
                ] as const).map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        onClick={() => handleTabChange(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                            activeTab === key
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <PayoutFilters
                searchInput={searchInput}
                startDate={startDate}
                endDate={endDate}
                statusFilter={statusFilter}
                modeFilter={modeFilter}
                categoryFilter={categoryFilter}
                sortBy={sortBy}
                sortOrder={sortOrder}
                loading={currentLoading}
                onSearchChange={v => { setSearchInput(v); }}
                onStartDateChange={v => { setStartDate(v); setTxPage(1); setPfPage(1); }}
                onEndDateChange={v => { setEndDate(v); setTxPage(1); setPfPage(1); }}
                onStatusChange={v => { setStatusFilter(v); setPfPage(1); }}
                onModeChange={v => { setModeFilter(v); setPfPage(1); }}
                onCategoryChange={v => { setCategoryFilter(v); setPfPage(1); }}
                onSortByChange={v => { setSortBy(v); setPfPage(1); }}
                onSortOrderToggle={() => { setSortOrder(o => o === "desc" ? "asc" : "desc"); }}
                onRefresh={() => activeTab === "history" ? fetchTransactions() : fetchPortfolios()}
                onClearFilters={handleClearFilters}
            />

            {/* ── Tab 1: Payout history (earning transactions) ── */}
            {activeTab === "history" && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Coins size={15} className="text-amber-500" />
                            <h3 className="text-[13px] font-bold text-slate-700">Earning Transactions</h3>
                        </div>
                        {!txLoading && (
                            <p className="text-[12px] text-slate-400">{txTotalDocs.toLocaleString()} records</p>
                        )}
                    </div>
                    <div className="overflow-auto max-h-[calc(100vh-440px)]">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {TX_HEADERS.map(h => (
                                        <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {txLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-50">
                                            {[160, 80, 60, 200, 90, 80, 100].map((w, j) => (
                                                <td key={j} className="px-4 py-3.5">
                                                    <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: w }} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={TX_HEADERS.length} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                                                    <Coins size={24} className="text-amber-400" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-700">No interest payouts found</p>
                                                <p className="text-xs text-slate-400">Payouts will appear here once clients claim their interest.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx, i) => (
                                        <TransactionTableRow key={tx._id ?? i} transaction={tx} onClick={setSelectedTx} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!txLoading && txTotalPages > 0 && (
                        <Pagination
                            page={txPage} totalPages={txTotalPages}
                            limit={txLimit} totalDocs={txTotalDocs}
                            perPageOptions={[10, 25, 50, 100]}
                            onPageChange={setTxPage}
                            onLimitChange={l => { setTxLimit(l); setTxPage(1); }}
                        />
                    )}
                </div>
            )}

            {/* ── Tab 2: Portfolio tracker ── */}
            {activeTab === "tracker" && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={15} className="text-blue-500" />
                            <h3 className="text-[13px] font-bold text-slate-700">Interest Accrual Tracker</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {!pfLoading && (
                                <p className="text-[12px] text-slate-400">{pfTotalDocs.toLocaleString()} portfolios</p>
                            )}
                            {isSuperAdmin && (
                                <button
                                    onClick={handleDeleteAllPortfolios}
                                    disabled={deleting}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm"
                                >
                                    <Trash2 size={13} />
                                    Delete All
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="overflow-auto max-h-[calc(100vh-440px)]">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {PF_HEADERS.map(h => (
                                        <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pfLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-50">
                                            {[160, 120, 140, 90, 90, 130, 80, 90, 80].map((w, j) => (
                                                <td key={j} className="px-4 py-3.5">
                                                    <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: w }} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : portfolios.length === 0 ? (
                                    <tr>
                                        <td colSpan={PF_HEADERS.length} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                                                    <BarChart3 size={24} className="text-blue-400" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-700">No portfolios found</p>
                                                <p className="text-xs text-slate-400">Try adjusting your filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    portfolios.map((pf, i) => (
                                        <PortfolioTableRow key={pf._id ?? i} portfolio={pf} onClick={setSelectedPf} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!pfLoading && pfTotalPages > 0 && (
                        <Pagination
                            page={pfPage} totalPages={pfTotalPages}
                            limit={pfLimit} totalDocs={pfTotalDocs}
                            perPageOptions={[10, 20, 50, 100]}
                            onPageChange={setPfPage}
                            onLimitChange={l => { setPfLimit(l); setPfPage(1); }}
                        />
                    )}
                </div>
            )}

            {/* Modals */}
            <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
            <PortfolioDetailModal   portfolio={selectedPf}   onClose={() => setSelectedPf(null)} />
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
