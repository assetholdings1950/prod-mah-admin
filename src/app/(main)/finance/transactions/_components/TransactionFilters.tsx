"use client";

import { Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Users, UserCog, Shield } from "lucide-react";
import type { TransactionType, TransactionStatus } from "@/interface/transaction";
import DropdownSelect from "./DropdownSelect";

const TYPE_TABS: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "deposit", label: "Deposits" },
    { value: "withdrawal", label: "Withdrawals" },
    { value: "investment", label: "Investments" },
    { value: "earning",  label: "Earnings" },
    { value: "penalty",  label: "Penalties" },
    { value: "charge",   label: "Charges" },
];

const STATUS_OPTIONS = [
    { value: "all",       label: "All Status" },
    { value: "completed", label: "Completed",  dotColor: "bg-emerald-400" },
    { value: "pending",   label: "Pending",    dotColor: "bg-amber-400" },
    { value: "failed",    label: "Failed",     dotColor: "bg-red-400" },
];

const USER_MODEL_OPTIONS = [
    { value: "all",    label: "All Users",  icon: Users,   iconClass: "text-slate-400" },
    { value: "Client", label: "Clients",    icon: Users,   iconClass: "text-blue-500" },
    { value: "Agent",  label: "Agents",     icon: UserCog, iconClass: "text-violet-500" },
    { value: "User",   label: "Admins",     icon: Shield,  iconClass: "text-teal-500" },
];

const SORT_FIELDS: { value: string; label: string }[] = [
    { value: "createdAt", label: "Date" },
    { value: "amount",    label: "Amount" },
];

interface Props {
    typeFilter: string;
    statusFilter: string;
    userModelFilter: string;
    searchInput: string;
    startDate: string;
    endDate: string;
    sortBy: string;
    sortOrder: string;
    loading: boolean;
    onTypeChange: (v: TransactionType | "all") => void;
    onStatusChange: (v: TransactionStatus | "all") => void;
    onUserModelChange: (v: string) => void;
    onSearchChange: (v: string) => void;
    onStartDateChange: (v: string) => void;
    onEndDateChange: (v: string) => void;
    onSortByChange: (v: string) => void;
    onSortOrderToggle: () => void;
    onRefresh: () => void;
}

export default function TransactionFilters({
    typeFilter, statusFilter, userModelFilter, searchInput,
    startDate, endDate, sortBy, sortOrder, loading,
    onTypeChange, onStatusChange, onUserModelChange, onSearchChange,
    onStartDateChange, onEndDateChange, onSortByChange, onSortOrderToggle, onRefresh,
}: Props) {
    const SortIcon = sortOrder === "asc" ? ArrowUp : sortOrder === "desc" ? ArrowDown : ArrowUpDown;

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-4">
            {/* Type tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {TYPE_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => onTypeChange(tab.value as TransactionType | "all")}
                        className={`shrink-0 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                            typeFilter === tab.value
                                ? "bg-slate-800 text-white shadow-sm"
                                : "text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Row 2: search + filters + sort */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search name, email, description…"
                        className="w-full h-9 pl-8 pr-3 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                    />
                </div>

                {/* Status — custom dropdown */}
                <DropdownSelect
                    value={statusFilter}
                    options={STATUS_OPTIONS}
                    onChange={(v) => onStatusChange(v as TransactionStatus | "all")}
                />

                {/* User model — custom dropdown */}
                <DropdownSelect
                    value={userModelFilter}
                    options={USER_MODEL_OPTIONS}
                    onChange={onUserModelChange}
                />

                {/* Date range */}
                <div className="flex items-center gap-1.5">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="h-9 px-2.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="h-9 px-2.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 cursor-pointer"
                    />
                </div>

                {/* Sort by */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1 h-9">
                    {SORT_FIELDS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => onSortByChange(f.value)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                sortBy === f.value
                                    ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                    <button
                        onClick={onSortOrderToggle}
                        title={sortOrder === "asc" ? "Ascending" : "Descending"}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all"
                    >
                        <SortIcon size={13} />
                    </button>
                </div>

                {/* Refresh */}
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh"
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
        </div>
    );
}
