"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";

// ========================= TYPES =========================

interface AgentsToolbarProps {
    searchInput: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    kycFilter: string;
    onKycChange: (value: string) => void;
    levelFilter: string;
    onLevelChange: (value: string) => void;
    countryFilter: string;
    onCountryChange: (value: string) => void;
    currencyFilter: string;
    onCurrencyChange: (value: string) => void;
    hasFilters: boolean;
    onClearFilters: () => void;
    onRefresh: () => void;
    loading: boolean;
}

interface DropdownOption {
    label: string;
    value: string;
    dot?: string;
}

interface FilterDropdownProps {
    value: string;
    onChange: (v: string) => void;
    options: DropdownOption[];
    placeholder: string;
}

// ========================= CUSTOM DROPDOWN =========================

const FilterDropdown = ({ value, onChange, options, placeholder }: FilterDropdownProps) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isActive = value !== "all";
    const activeOpt = options.find((o) => o.value === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={[
                    "group flex items-center gap-1.5 text-xs h-9 px-3 rounded-lg border transition-all duration-150 outline-none select-none whitespace-nowrap",
                    isActive
                        ? "bg-navy/[0.06] border-navy/25 text-navy font-medium shadow-sm shadow-navy/5"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700",
                    open ? "ring-2 ring-navy/10 border-navy/30" : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                {isActive && activeOpt?.dot && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeOpt.dot}`} />
                )}
                <span>{isActive ? activeOpt?.label : placeholder}</span>
                {isActive && !activeOpt?.dot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-navy/70 shrink-0" />
                )}
                <ChevronDown
                    size={11}
                    className={[
                        "shrink-0 transition-transform duration-200",
                        isActive ? "text-navy/50" : "text-slate-400 group-hover:text-slate-500",
                        open ? "rotate-180" : "",
                    ].join(" ")}
                />
            </button>

            {/* Panel */}
            <div
                className={[
                    "absolute top-full left-0 mt-1.5 z-50 min-w-[172px] py-1.5 overflow-hidden",
                    "bg-white rounded-xl border border-slate-100/80 shadow-xl shadow-slate-900/[0.08]",
                    "transition-all duration-150 origin-top-left",
                    open
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
                ].join(" ")}
            >
                {/* Header label */}
                <p className="px-3.5 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {placeholder}
                </p>

                {/* All option */}
                <button
                    type="button"
                    onClick={() => {
                        onChange("all");
                        setOpen(false);
                    }}
                    className={[
                        "w-full flex items-center justify-between gap-3 px-3.5 py-2 text-xs transition-colors",
                        value === "all"
                            ? "bg-navy/[0.05] text-navy font-semibold"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                    ].join(" ")}
                >
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                        All
                    </span>
                    {value === "all" && <Check size={11} className="text-navy shrink-0" />}
                </button>

                <div className="my-1 h-px bg-slate-100 mx-2.5" />

                {options.map((opt) => (
                    <button
                        type="button"
                        key={opt.value}
                        onClick={() => {
                            onChange(opt.value);
                            setOpen(false);
                        }}
                        className={[
                            "w-full flex items-center justify-between gap-3 px-3.5 py-2 text-xs transition-colors",
                            value === opt.value
                                ? "bg-navy/[0.05] text-navy font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
                        ].join(" ")}
                    >
                        <span className="flex items-center gap-2">
                            {opt.dot && (
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dot}`} />
                            )}
                            {opt.label}
                        </span>
                        {value === opt.value && (
                            <Check size={11} className="text-navy shrink-0" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ========================= FILTER CONFIGS =========================

const STATUS_OPTIONS: DropdownOption[] = [
    { label: "Active", value: "active", dot: "bg-emerald-400" },
    { label: "Pending", value: "pending", dot: "bg-amber-400" },
    { label: "Inactive", value: "inactive", dot: "bg-slate-300" },
    { label: "Suspended", value: "suspended", dot: "bg-orange-400" },
    { label: "Blocked", value: "blocked", dot: "bg-red-400" },
    { label: "Closed", value: "closed", dot: "bg-slate-400" },
];

const KYC_OPTIONS: DropdownOption[] = [
    { label: "Approved", value: "approved", dot: "bg-emerald-400" },
    { label: "Pending", value: "pending", dot: "bg-amber-400" },
    { label: "Under Review", value: "under_review", dot: "bg-blue-400" },
    { label: "Rejected", value: "rejected", dot: "bg-red-400" },
];

const LEVEL_OPTIONS: DropdownOption[] = [
    { label: "Basic", value: "basic", dot: "bg-orange-300" },
    { label: "Silver", value: "silver", dot: "bg-slate-300" },
    { label: "Gold", value: "gold", dot: "bg-amber-400" },
    { label: "Diamond", value: "diamond", dot: "bg-indigo-400" },
];

const COUNTRY_OPTIONS: DropdownOption[] = [
    { label: "Singapore", value: "Singapore" },
    { label: "Malaysia", value: "Malaysia" },
    { label: "United States", value: "United States" },
    { label: "United Kingdom", value: "United Kingdom" },
];

const CURRENCY_OPTIONS: DropdownOption[] = [
    { label: "USD", value: "USD" },
    { label: "SGD", value: "SGD" },
    { label: "EUR", value: "EUR" },
    { label: "GBP", value: "GBP" },
];

// ========================= TOOLBAR =========================

const AgentsToolbar: React.FC<AgentsToolbarProps> = ({
    searchInput,
    onSearchChange,
    statusFilter,
    onStatusChange,
    kycFilter,
    onKycChange,
    levelFilter,
    onLevelChange,
    countryFilter,
    onCountryChange,
    currencyFilter,
    onCurrencyChange,
    hasFilters,
    onClearFilters,
    onRefresh,
    loading,
}) => {
    const activeCount = [statusFilter, kycFilter, levelFilter, countryFilter, currencyFilter].filter(
        (v) => v && v !== "all"
    ).length;

    return (
        <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 border-b border-slate-100">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[280px]">
                <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                    type="text"
                    placeholder="Search by name, email, ID…"
                    value={searchInput}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-8 h-9 outline-none focus:ring-2 focus:ring-navy/10 focus:border-navy/30 focus:bg-white transition-all placeholder:text-slate-400 text-slate-700"
                />
                {searchInput && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 shrink-0" />

            {/* Filter group */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <SlidersHorizontal size={11} />
                    <span>Filters</span>
                    {activeCount > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-navy text-white text-[9px] font-bold leading-none">
                            {activeCount}
                        </span>
                    )}
                </div>

                <FilterDropdown
                    value={statusFilter}
                    onChange={onStatusChange}
                    placeholder="Status"
                    options={STATUS_OPTIONS}
                />
                <FilterDropdown
                    value={kycFilter}
                    onChange={onKycChange}
                    placeholder="KYC"
                    options={KYC_OPTIONS}
                />
                <FilterDropdown
                    value={levelFilter}
                    onChange={onLevelChange}
                    placeholder="Level"
                    options={LEVEL_OPTIONS}
                />
                <FilterDropdown
                    value={countryFilter}
                    onChange={onCountryChange}
                    placeholder="Country"
                    options={COUNTRY_OPTIONS}
                />
                <FilterDropdown
                    value={currencyFilter}
                    onChange={onCurrencyChange}
                    placeholder="Currency"
                    options={CURRENCY_OPTIONS}
                />
            </div>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">
                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={11} />
                        <span>Clear {activeCount > 0 ? `(${activeCount})` : "all"}</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={onRefresh}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-navy bg-white hover:bg-navy/[0.04] border border-slate-200 hover:border-navy/20 rounded-lg px-3 h-9 transition-all"
                >
                    <RefreshCw
                        size={12}
                        className={`transition-transform ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                </button>
            </div>
        </div>
    );
};

export default AgentsToolbar;
