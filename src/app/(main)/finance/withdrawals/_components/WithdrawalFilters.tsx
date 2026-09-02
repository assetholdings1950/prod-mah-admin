"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Filter, RefreshCw } from "lucide-react";

interface Props {
    statusFilter: string;
    userModelFilter: string;
    searchInput: string;
    loading: boolean;
    onStatusChange: (v: string) => void;
    onUserModelChange: (v: string) => void;
    onSearchChange: (v: string) => void;
    onRefresh: () => void;
}

const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
];

const USER_MODEL_OPTIONS = [
    { key: "all", label: "All Users" },
    { key: "Client", label: "Client" },
    { key: "Agent", label: "Agent" },
    { key: "User", label: "Admin User" },
];

export default function WithdrawalFilters({
    statusFilter, userModelFilter, searchInput, loading,
    onStatusChange, onUserModelChange, onSearchChange, onRefresh,
}: Props) {
    const [showDrop, setShowDrop] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const activeUserModel = USER_MODEL_OPTIONS.find((o) => o.key === userModelFilter) ?? USER_MODEL_OPTIONS[0];

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onStatusChange(tab.key)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            statusFilter === tab.key
                                ? "bg-white text-slate-800 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="relative" ref={dropRef}>
                <button
                    onClick={() => setShowDrop((v) => !v)}
                    className="flex items-center gap-2 h-9 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-slate-300 transition-all"
                >
                    <Filter size={13} className="text-slate-400" />
                    {activeUserModel.label}
                    <ChevronDown size={12} className="text-slate-400" />
                </button>
                <AnimatePresence>
                    {showDrop && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-full mt-1.5 left-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[160px] overflow-hidden"
                        >
                            {USER_MODEL_OPTIONS.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => { onUserModelChange(opt.key); setShowDrop(false); }}
                                    className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                                        userModelFilter === opt.key
                                            ? "bg-slate-50 text-slate-800"
                                            : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    value={searchInput}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search name, email, ID..."
                    className="w-full h-9 pl-9 pr-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all"
                />
            </div>

            <button
                onClick={onRefresh}
                disabled={loading}
                title="Refresh"
                className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all disabled:opacity-50 ml-auto"
            >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
    );
}
