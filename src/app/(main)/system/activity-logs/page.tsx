"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    History,
    LayoutGrid,
    Lock,
    Loader2,
    ShieldCheck,
    TrendingUp,
    User,
    Wallet,
    Bell,
    FileCheck2,
} from "lucide-react";
import appClient from "@/lib/appClient";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import UserSearchDropdown, { UserOption } from "@/components/common/UserSearchDropdown";
import Select from "@/components/common/Select";

interface ActivityLog {
    _id: string;
    action: string;
    category: "auth" | "profile" | "kyc" | "finance" | "portfolio" | "account" | "system";
    userModel?: "Client" | "Agent" | "System";
    description: string;
    metadata?: Record<string, unknown> | null;
    performedBy?: { id?: string; role?: string; name?: string } | null;
    createdAt: string;
    user?: { firstName?: string; lastName?: string; email?: string; clientId?: string; agentId?: string } | null;
}

interface ApiResponse {
    status: boolean;
    logs: ActivityLog[];
    total: number;
    page: number;
    totalPages: number;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    auth:      { bg: "bg-slate-100",  text: "text-slate-600",  icon: <User size={11} /> },
    profile:   { bg: "bg-blue-50",    text: "text-blue-600",   icon: <User size={11} /> },
    kyc:       { bg: "bg-yellow-50",  text: "text-yellow-700", icon: <ShieldCheck size={11} /> },
    finance:   { bg: "bg-green-50",   text: "text-green-700",  icon: <Wallet size={11} /> },
    portfolio: { bg: "bg-purple-50",  text: "text-purple-700", icon: <TrendingUp size={11} /> },
    account:   { bg: "bg-cyan-50",    text: "text-cyan-700",   icon: <FileCheck2 size={11} /> },
    system:    { bg: "bg-violet-50",  text: "text-violet-700", icon: <Bell size={11} /> },
};

function fmt(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function ActivityLogsPage() {
    const router       = useRouter();
    const searchParams = useSearchParams();

    const userId    = searchParams.get("userId")    ?? "";
    const userModel = searchParams.get("userModel") ?? "";
    const category  = searchParams.get("category")  ?? "all";
    const pageParam = searchParams.get("page")       ?? "1";
    const page      = parseInt(pageParam, 10) || 1;

    const [logs, setLogs]               = useState<ActivityLog[]>([]);
    const [loading, setLoading]         = useState(true);
    const [total, setTotal]             = useState(0);
    const [totalPages, setTotalPages]   = useState(1);

    // Update multiple URL params at once
    const setParams = useCallback((updates: Record<string, string | null>, resetPage = false) => {
        const p = new URLSearchParams(searchParams.toString());
        for (const [k, v] of Object.entries(updates)) {
            if (v === null || v === "") p.delete(k);
            else p.set(k, v);
        }
        if (resetPage) p.set("page", "1");
        router.replace(`?${p.toString()}`, { scroll: false } as Parameters<typeof router.replace>[1]);
    }, [searchParams, router]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page: String(page), limit: "20" });
            if (userId)              p.set("userId", userId);
            if (userModel)           p.set("userModel", userModel);
            if (category !== "all")  p.set("category", category);
            const res = await appClient.get<ApiResponse>(`/api/activity-logs?${p.toString()}`);
            const d = res.data;
            setLogs(d.logs ?? []);
            setTotal(d.total ?? 0);
            setTotalPages(d.totalPages ?? 1);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [page, userId, userModel, category]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleClientSelect = useCallback((user: UserOption | null) => {
        if (user) setParams({ userId: user._id, userModel: "Client" }, true);
        else      setParams({ userId: null, userModel: null }, true);
    }, [setParams]);

    const handleAgentSelect = useCallback((user: UserOption | null) => {
        if (user) setParams({ userId: user._id, userModel: "Agent" }, true);
        else      setParams({ userId: null, userModel: null }, true);
    }, [setParams]);

    const handleCategoryChange = useCallback((val: string) => {
        setParams({ category: val }, true);
    }, [setParams]);

    return (
        <div className="w-full flex flex-col gap-5 p-1 text-foreground">
            <WorksSpaceHeader isButtonVisible={false} subHeading="System" heading="Activity Logs" />

            <div className="bg-white border border-slate-100 rounded-xl shadow-sm">
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-wrap">
                    <History size={16} className="text-slate-400 shrink-0" />
                    <p className="text-[13px] font-semibold text-slate-700 mr-auto">
                        All Events{" "}
                        <span className="text-[11px] font-normal text-slate-400">({total})</span>
                    </p>

                    {/* Client picker — selecting one clears agent */}
                    <UserSearchDropdown
                        userModel="Client"
                        selectedId={userModel === "Client" ? userId : null}
                        onSelect={handleClientSelect}
                        placeholder="Filter by client…"
                    />

                    {/* Agent picker — selecting one clears client */}
                    <UserSearchDropdown
                        userModel="Agent"
                        selectedId={userModel === "Agent" ? userId : null}
                        onSelect={handleAgentSelect}
                        placeholder="Filter by agent…"
                    />

                    {/* Category */}
                    <Select
                        size="sm"
                        value={category}
                        onChange={handleCategoryChange}
                        options={[
                            { value: "all",       label: "All Categories", icon: <LayoutGrid size={10} />,  color: "bg-slate-100   text-slate-500"   },
                            { value: "auth",      label: "Auth",           icon: <Lock size={10} />,        color: "bg-slate-100   text-slate-600"   },
                            { value: "profile",   label: "Profile",        icon: <User size={10} />,        color: "bg-blue-100    text-blue-600"    },
                            { value: "kyc",       label: "KYC",            icon: <ShieldCheck size={10} />, color: "bg-amber-100   text-amber-600"   },
                            { value: "finance",   label: "Finance",        icon: <Wallet size={10} />,      color: "bg-emerald-100 text-emerald-600" },
                            { value: "portfolio", label: "Portfolio",      icon: <TrendingUp size={10} />,  color: "bg-purple-100  text-purple-600"  },
                            { value: "account",   label: "Account",        icon: <FileCheck2 size={10} />,  color: "bg-cyan-100    text-cyan-600"    },
                            { value: "system",    label: "System",         icon: <Bell size={10} />,        color: "bg-violet-100  text-violet-600"  },
                        ]}
                    />
                </div>

                {/* Active filter chips */}
                {(userId || category !== "all") && (
                    <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-50 bg-slate-50/60 flex-wrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Filters:</span>
                        {userId && userModel && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                userModel === "Client" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-purple-50 text-purple-600 border-purple-200"
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${userModel === "Client" ? "bg-blue-400" : "bg-purple-400"}`} />
                                {userModel}
                                <button
                                    onClick={() => setParams({ userId: null, userModel: null }, true)}
                                    className="opacity-60 hover:opacity-100 ml-0.5"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {category !== "all" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-amber-50 text-amber-700 border-amber-200">
                                {category}
                                <button
                                    onClick={() => handleCategoryChange("all")}
                                    className="opacity-60 hover:opacity-100 ml-0.5"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        <button
                            onClick={() => setParams({ userId: null, userModel: null, category: null }, true)}
                            className="ml-auto text-[11px] text-slate-400 hover:text-slate-600 transition"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                        <AlertCircle size={28} className="text-slate-300" />
                        <p className="text-[13px]">No activity found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-36">Time</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-32">Actor</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-24">Category</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Description</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Details</th>
                                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-20 hidden md:table-cell">By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.map((log) => {
                                    const cat = CATEGORY_STYLES[log.category] ?? CATEGORY_STYLES.auth;
                                    const userName = log.userModel === "System"
                                        ? "System"
                                        : log.user
                                        ? `${log.user.firstName ?? ""} ${log.user.lastName ?? ""}`.trim() || log.user.email
                                        : null;
                                    return (
                                        <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                                                {fmt(log.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {userName ? (
                                                    <p className="font-medium text-slate-700 truncate max-w-[120px]">{userName}</p>
                                                ) : (
                                                    <span className="text-slate-300 italic text-[11px]">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cat.bg} ${cat.text}`}>
                                                    {cat.icon}
                                                    {log.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 font-medium">
                                                <div>{log.description}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.action}</div>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell font-mono text-[10px] text-slate-500 break-all">
                                                {log.metadata && Object.keys(log.metadata).length > 0
                                                    ? Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")
                                                    : <span className="text-slate-300 italic">—</span>}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-[11px]">
                                                <p className="max-w-[150px] truncate font-medium text-slate-600" title={log.performedBy?.name}>{log.performedBy?.name ?? "—"}</p>
                                                {log.performedBy?.role && <p className="mt-0.5 capitalize text-[9px] text-slate-400">{log.performedBy.role}</p>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                        <p className="text-[11px] text-slate-400">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={page <= 1}
                                onClick={() => setParams({ page: String(page - 1) })}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setParams({ page: String(page + 1) })}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
