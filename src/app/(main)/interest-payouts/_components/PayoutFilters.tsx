"use client";

import { RefreshCw, Search, SortAsc, SortDesc, X } from "lucide-react";
import Select from "@/components/common/Select";

interface Props {
    // search + dates
    searchInput: string;
    startDate: string;
    endDate: string;
    // filters
    statusFilter: string;
    modeFilter: string;
    categoryFilter: string;
    sortBy: string;
    sortOrder: string;
    loading?: boolean;
    // handlers
    onSearchChange: (v: string) => void;
    onStartDateChange: (v: string) => void;
    onEndDateChange: (v: string) => void;
    onStatusChange: (v: string) => void;
    onModeChange: (v: string) => void;
    onCategoryChange: (v: string) => void;
    onSortByChange: (v: string) => void;
    onSortOrderToggle: () => void;
    onRefresh: () => void;
    onClearFilters: () => void;
}

const STATUS_OPTS = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "matured", label: "Matured" },
    { value: "closed", label: "Closed" },
    { value: "cancelled", label: "Cancelled" },
];

const MODE_OPTS = [
    { value: "all", label: "All Modes" },
    { value: "sip", label: "SIP" },
    { value: "lumpsum", label: "Lump Sum" },
];

const CATEGORY_OPTS = [
    { value: "all", label: "All Categories" },
    { value: "monthly", label: "Monthly SIP" },
    { value: "lumpsum", label: "Lump Sum" },
    { value: "crypto", label: "Digital Assets" },
];

const SORT_OPTS = [
    { value: "createdAt", label: "Date Created" },
    { value: "amountUsd", label: "Amount (USD)" },
    { value: "summary.totalPaidProfitUsd", label: "Paid Profit" },
    { value: "summary.totalExpectedProfitUsd", label: "Expected Profit" },
    { value: "maturityDate", label: "Maturity Date" },
];


export default function PayoutFilters({
    searchInput, startDate, endDate,
    statusFilter, modeFilter, categoryFilter,
    sortBy, sortOrder, loading,
    onSearchChange, onStartDateChange, onEndDateChange,
    onStatusChange, onModeChange, onCategoryChange,
    onSortByChange, onSortOrderToggle,
    onRefresh, onClearFilters,
}: Props) {
    const hasActiveFilters = statusFilter !== "all" || modeFilter !== "all" || categoryFilter !== "all" || startDate || endDate || searchInput;

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
            {/* Row 1 — search + clear */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Search portfolio ID or plan name…"
                        className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12.5px] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
                    />
                    {searchInput && (
                        <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => onStartDateChange(e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] text-slate-700 focus:border-blue-400 focus:outline-none"
                    />
                    <span className="text-slate-400 text-xs">–</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => onEndDateChange(e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] text-slate-700 focus:border-blue-400 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="h-9 px-3 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-500 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                            <X size={12} /> Clear
                        </button>
                    )}
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Row 2 — dropdowns + sort */}
            <div className="flex items-center gap-2 flex-wrap">
                <Select value={statusFilter}   onChange={onStatusChange}   options={STATUS_OPTS}   />
                <Select value={modeFilter}     onChange={onModeChange}     options={MODE_OPTS}     />
                <Select value={categoryFilter} onChange={onCategoryChange} options={CATEGORY_OPTS} />

                <div className="ml-auto flex items-center gap-2">
                    <Select value={sortBy} onChange={onSortByChange} options={SORT_OPTS} />
                    <button
                        onClick={onSortOrderToggle}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                        title={sortOrder === "desc" ? "Descending" : "Ascending"}
                    >
                        {sortOrder === "desc" ? <SortDesc size={14} /> : <SortAsc size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
