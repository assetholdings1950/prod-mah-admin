"use client";

import { useCallback, useEffect, useState } from "react";
import Select from "@/components/common/Select";
import appClient from "@/lib/appClient";
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Landmark,
    LayoutGrid,
    Lock,
    Loader2,
    Pencil,
    ShieldCheck,
    ShieldX,
    TrendingUp,
    Trash2,
    UserRound,
    Wallet,
    XCircle,
} from "lucide-react";

interface ActivityLog {
    _id: string;
    action: string;
    category: "auth" | "profile" | "kyc" | "finance" | "portfolio";
    description: string;
    metadata?: Record<string, unknown> | null;
    performedBy?: { id?: string; role?: string; name?: string } | null;
    createdAt: string;
}

interface ApiResponse {
    status: boolean;
    logs: ActivityLog[];
    total: number;
    page: number;
    totalPages: number;
}

// ── Per-action icon + colour ──────────────────────────────────────────────────
function nodeStyle(action: string): { icon: React.ReactNode; bg: string; fg: string; ring: string } {
    if (action.includes("approved") || action === "deposit.created" || action === "withdrawal.created" || action === "portfolio.created")
        return { icon: <CheckCircle2 size={15} />, bg: "bg-emerald-50", fg: "text-emerald-600", ring: "ring-emerald-100" };
    if (action.includes("rejected") || action.includes("deleted"))
        return { icon: action.includes("kyc") ? <ShieldX size={15} /> : <XCircle size={15} />, bg: "bg-red-50", fg: "text-red-500", ring: "ring-red-100" };
    if (action.includes("kyc"))
        return { icon: <ShieldCheck size={15} />, bg: "bg-yellow-50", fg: "text-yellow-600", ring: "ring-yellow-100" };
    if (action.includes("bank"))
        return { icon: action.includes("deleted") ? <Trash2 size={14} /> : <Landmark size={15} />, bg: "bg-sky-50", fg: "text-sky-600", ring: "ring-sky-100" };
    if (action.includes("wallet"))
        return { icon: action.includes("deleted") ? <Trash2 size={14} /> : <Wallet size={15} />, bg: "bg-indigo-50", fg: "text-indigo-600", ring: "ring-indigo-100" };
    if (action.includes("portfolio"))
        return { icon: <TrendingUp size={15} />, bg: "bg-purple-50", fg: "text-purple-600", ring: "ring-purple-100" };
    if (action.includes("profile") || action.includes("updated"))
        return { icon: <Pencil size={14} />, bg: "bg-blue-50", fg: "text-blue-600", ring: "ring-blue-100" };
    if (action.includes("deposit") || action.includes("withdrawal"))
        return { icon: <Wallet size={15} />, bg: "bg-emerald-50", fg: "text-emerald-600", ring: "ring-emerald-100" };
    return { icon: <UserRound size={15} />, bg: "bg-slate-100", fg: "text-slate-500", ring: "ring-slate-100" };
}

const CATEGORY_PILL: Record<string, string> = {
    finance: "bg-emerald-50  text-emerald-700 border-emerald-200",
    kyc: "bg-yellow-50   text-yellow-700  border-yellow-200",
    profile: "bg-blue-50     text-blue-700    border-blue-200",
    portfolio: "bg-purple-50   text-purple-700  border-purple-200",
    auth: "bg-slate-100   text-slate-600   border-slate-200",
};

// ── Date helpers ──────────────────────────────────────────────────────────────
function relTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function dayLabel(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function groupByDay(logs: ActivityLog[]): { label: string; items: ActivityLog[] }[] {
    const map = new Map<string, ActivityLog[]>();
    for (const log of logs) {
        const key = new Date(log.createdAt).toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(log);
    }
    return Array.from(map.entries()).map(([, items]) => ({ label: dayLabel(items[0].createdAt), items }));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ActivityTab({ userId, userModel }: { userId: string; userModel: "Client" | "Agent" }) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [category, setCategory] = useState("all");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page: String(page), limit: "15", userId, userModel });
            if (category !== "all") p.set("category", category);
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
    }, [userId, userModel, page, category]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const groups = groupByDay(logs);

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[13px] font-semibold text-slate-700">
                    Activity Timeline
                    <span className="ml-2 text-[11px] font-normal text-slate-400">{total} events</span>
                </p>
                <Select
                    size="sm"
                    value={category}
                    onChange={(v) => { setCategory(v); setPage(1); }}
                    options={[
                        { value: "all", label: "All Categories", icon: <LayoutGrid size={10} />, color: "bg-slate-100  text-slate-500" },
                        { value: "auth", label: "Auth", icon: <Lock size={10} />, color: "bg-slate-100  text-slate-600" },
                        { value: "profile", label: "Profile", icon: <UserRound size={10} />, color: "bg-blue-100   text-blue-600" },
                        { value: "kyc", label: "KYC", icon: <ShieldCheck size={10} />, color: "bg-amber-100  text-amber-600" },
                        { value: "finance", label: "Finance", icon: <Wallet size={10} />, color: "bg-emerald-100 text-emerald-600" },
                        { value: "portfolio", label: "Portfolio", icon: <TrendingUp size={10} />, color: "bg-purple-100 text-purple-600" },
                    ]}
                />
            </div>

            {/* Timeline body */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                    <AlertCircle size={26} className="text-slate-300" />
                    <p className="text-[13px]">No activity yet.</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {groups.map((group) => (
                        <div key={group.label}>
                            {/* Date separator */}
                            <div className="flex items-center gap-3 py-3">
                                <div className="h-px flex-1 bg-slate-100" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0 px-1">
                                    {group.label}
                                </span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>

                            {/* Events in this day */}
                            <div className="relative pl-1">
                                {/* Continuous vertical rule */}
                                <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-100 pointer-events-none" />

                                <div className="flex flex-col gap-3">
                                    {group.items.map((log) => {
                                        const ns = nodeStyle(log.action);
                                        const hasMeta = log.metadata && Object.keys(log.metadata).some(k => log.metadata![k] != null && log.metadata![k] !== "");
                                        const byAdmin = log.performedBy?.role && log.performedBy.role !== userModel.toLowerCase();

                                        return (
                                            <div key={log._id} className="flex gap-3.5 items-start">
                                                {/* Node */}
                                                <div className={`relative z-10 mt-0.5 w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 ring-4 ${ns.bg} ${ns.fg} ${ns.ring}`}>
                                                    {ns.icon}
                                                </div>

                                                {/* Card */}
                                                <div className="flex-1 min-w-0 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow">
                                                    {/* Top row */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-[13px] font-semibold text-slate-800 leading-snug">
                                                            {log.description}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 font-mono shrink-0 mt-0.5 whitespace-nowrap">
                                                            {relTime(log.createdAt)}
                                                        </span>
                                                    </div>

                                                    {/* Category + action */}
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_PILL[log.category] ?? CATEGORY_PILL.auth}`}>
                                                            {log.category}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {log.action}
                                                        </span>
                                                    </div>

                                                    {/* Metadata chips */}
                                                    {hasMeta && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                            {Object.entries(log.metadata!).filter(([, v]) => v != null && v !== "").map(([k, v]) => (
                                                                <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-500">
                                                                    <span className="text-slate-400">{k}</span>
                                                                    <span className="text-slate-300 select-none">·</span>
                                                                    <span className="text-slate-600">{String(v)}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Performed by */}
                                                    {byAdmin && (
                                                        <p className="text-[10px] text-slate-400 mt-2">
                                                            Action by{" "}
                                                            <span className="font-semibold text-slate-500 capitalize">
                                                                {log.performedBy!.role}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400">Page {page} of {totalPages}</p>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
