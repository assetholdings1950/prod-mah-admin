"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    Bell,
    CalendarDays,
    Check,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    FileCheck2,
    Filter,
    Inbox,
    Loader2,
    RefreshCw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    UserRound,
    UsersRound,
    WalletCards,
    Settings,
    X,
} from "lucide-react";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

type ActorModel = "Client" | "Agent" | "System";
type Category = "auth" | "profile" | "kyc" | "finance" | "portfolio" | "account" | "system";
type Priority = "low" | "medium" | "high" | "critical";

interface NotificationItem {
    _id: string;
    actorId?: string | null;
    actorModel: ActorModel;
    action: string;
    category: Category;
    title: string;
    message: string;
    priority: Priority;
    actionRequired: boolean;
    isRead: boolean;
    createdAt: string;
    actor?: {
        firstName?: string;
        lastName?: string;
        fullName?: string;
        email?: string;
        clientId?: string;
        agentId?: string;
    } | null;
    entity?: {
        model?: string | null;
        id?: string | null;
        reference?: string | null;
        label?: string | null;
        url?: string | null;
        state?: string | null;
    };
    metadata?: Record<string, unknown> | null;
    performedBy?: { id?: string | null; role?: string | null; name?: string | null } | null;
    footprints?: Array<{ label: string; description?: string | null; at: string; metadata?: Record<string, unknown> | null }>;
    source?: { method?: string | null; path?: string | null; ip?: string | null; userAgent?: string | null };
}

interface Summary {
    unread: number;
    actionRequired: number;
    clientActivity: number;
    agentActivity: number;
    systemActivity: number;
}

interface ListResponse {
    status: boolean;
    notifications: NotificationItem[];
    summary: Summary;
    total: number;
    page: number;
    totalPages: number;
}

const EMPTY_SUMMARY: Summary = { unread: 0, actionRequired: 0, clientActivity: 0, agentActivity: 0, systemActivity: 0 };

const categoryStyle: Record<Category, { label: string; className: string; icon: React.ReactNode }> = {
    auth: { label: "Authentication", className: "bg-slate-100 text-slate-600 border-slate-200", icon: <ShieldCheck size={11} /> },
    profile: { label: "Profile", className: "bg-blue-50 text-blue-700 border-blue-200", icon: <UserRound size={11} /> },
    kyc: { label: "KYC", className: "bg-amber-50 text-amber-700 border-amber-200", icon: <FileCheck2 size={11} /> },
    finance: { label: "Finance", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <WalletCards size={11} /> },
    portfolio: { label: "Portfolio", className: "bg-violet-50 text-violet-700 border-violet-200", icon: <CircleDollarSign size={11} /> },
    account: { label: "Account Form", className: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: <FileCheck2 size={11} /> },
    system: { label: "System", className: "bg-slate-100 text-slate-600 border-slate-200", icon: <Bell size={11} /> },
};

const priorityStyle: Record<Priority, string> = {
    low: "bg-blue-400",
    medium: "bg-amber-400",
    high: "bg-rose-500",
    critical: "bg-red-700",
};

function actorName(item: NotificationItem) {
    if (item.actorModel === "System") return item.performedBy?.name || "System";
    return item.actor?.fullName || [item.actor?.firstName, item.actor?.lastName].filter(Boolean).join(" ") || item.actor?.email || item.actorModel;
}

function initials(item: NotificationItem) {
    return actorName(item).split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function dayGroup(value: string) {
    const date = new Date(value);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const days = Math.round((today.getTime() - target.getTime()) / 86_400_000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return target.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function valueText(value: unknown) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export default function NotificationsPage() {
    const router = useRouter();
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mutating, setMutating] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selected, setSelected] = useState<NotificationItem | null>(null);
    const [search, setSearch] = useState("");
    const [actorModel, setActorModel] = useState<"all" | ActorModel>("all");
    const [category, setCategory] = useState<"all" | Category>("all");
    const [readState, setReadState] = useState<"all" | "unread" | "read">("all");
    const [priority, setPriority] = useState<"all" | Priority>("all");
    const [range, setRange] = useState<"7" | "30" | "all">("7");
    const [actionOnly, setActionOnly] = useState(false);

    const buildParams = useCallback(() => {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (search.trim()) params.set("search", search.trim());
        if (actorModel !== "all") params.set("actorModel", actorModel);
        if (category !== "all") params.set("category", category);
        if (readState !== "all") params.set("readState", readState);
        if (priority !== "all") params.set("priority", priority);
        if (actionOnly) params.set("actionRequired", "true");
        if (range !== "all") {
            const start = new Date();
            start.setDate(start.getDate() - Number(range));
            params.set("startDate", start.toISOString());
        }
        return params;
    }, [page, search, actorModel, category, readState, priority, range, actionOnly]);

    const fetchNotifications = useCallback(async (quiet = false) => {
        if (quiet) setRefreshing(true); else setLoading(true);
        try {
            const response = await appClient.get<ListResponse>(`/api/notifications?${buildParams().toString()}`);
            setItems(response.data.notifications ?? []);
            setSummary(response.data.summary ?? EMPTY_SUMMARY);
            setTotal(response.data.total ?? 0);
            setTotalPages(response.data.totalPages ?? 1);
            setSelectedIds(new Set());
            window.dispatchEvent(new CustomEvent("notification-count-changed", { detail: response.data.summary?.unread ?? 0 }));
        } catch {
            setItems([]);
            toastError("Failed to load notifications.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [buildParams]);

    useEffect(() => {
        const timer = window.setTimeout(() => void fetchNotifications(), 250);
        return () => window.clearTimeout(timer);
    }, [fetchNotifications]);

    const updateReadState = useCallback(async ({ ids = [], all = false, read = true }: { ids?: string[]; all?: boolean; read?: boolean }) => {
        setMutating(true);
        try {
            const response = await appClient.patch<{ summary: Summary }>("/api/notifications", { ids, all, read });
            const nextSummary = response.data.summary ?? summary;
            setSummary(nextSummary);
            if (all) {
                setItems((current) => current.map((item) => ({ ...item, isRead: read })));
            } else {
                const changed = new Set(ids);
                setItems((current) => current.map((item) => changed.has(item._id) ? { ...item, isRead: read } : item));
                setSelected((current) => current && changed.has(current._id) ? { ...current, isRead: read } : current);
            }
            setSelectedIds(new Set());
            window.dispatchEvent(new CustomEvent("notification-count-changed", { detail: nextSummary.unread }));
            toastSuccess(all ? "All notifications marked as read." : `${ids.length} notification${ids.length === 1 ? "" : "s"} updated.`);
        } catch {
            toastError("Failed to update notification state.");
        } finally {
            setMutating(false);
        }
    }, [summary]);

    const openNotification = useCallback((item: NotificationItem) => {
        setSelected(item);
        if (!item.isRead) void updateReadState({ ids: [item._id] });
    }, [updateReadState]);

    const activeFilterCount = [search.trim(), actorModel !== "all", category !== "all", readState !== "all", priority !== "all", range !== "7", actionOnly].filter(Boolean).length;

    const grouped = useMemo(() => {
        const result: Array<{ label: string; items: NotificationItem[] }> = [];
        for (const item of items) {
            const label = dayGroup(item.createdAt);
            const last = result[result.length - 1];
            if (!last || last.label !== label) result.push({ label, items: [item] });
            else last.items.push(item);
        }
        return result;
    }, [items]);

    const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item._id));
    const resetFilters = () => {
        setSearch("");
        setActorModel("all");
        setCategory("all");
        setReadState("all");
        setPriority("all");
        setRange("7");
        setActionOnly(false);
        setPage(1);
    };

    const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item._id)));
    const toggleOne = (id: string) => setSelectedIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const relatedUrl = (item: NotificationItem) => {
        if (item.entity?.url) return item.entity.url;
        const entityId = item.entity?.id;
        const action = item.action.toLowerCase();
        if (entityId && action.includes("withdraw")) return `/finance/withdrawals/${entityId}`;
        if (entityId && action.includes("deposit")) return `/finance/deposits/${entityId}`;
        if (item.actorModel === "Agent" && item.actorId) return `/agents/${item.actorId}`;
        if (item.actorModel === "Client" && item.actorId) return `/clients/${item.actorId}`;
        return null;
    };

    return (
        <div className="flex min-h-full w-full flex-col gap-4 p-1 text-slate-800">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400"><Bell size={13} className="text-navy" /> Operations</div>
                    <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy">Notifications</h1>
                    <p className="mt-0.5 text-xs text-slate-500">Client and agent activity, requests, and system events</p>
                </div>
                <div className="flex gap-2 sm:ml-auto">
                    <button onClick={() => void fetchNotifications(true)} disabled={refreshing} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50" aria-label="Refresh notifications">
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    </button>
                    <button onClick={() => void updateReadState({ all: true })} disabled={mutating || summary.unread === 0} className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-40">
                        <CheckCheck size={16} /> Mark all as read
                    </button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                    { label: "Unread", value: summary.unread, icon: <Inbox size={18} />, accent: "border-l-emerald-500", iconStyle: "bg-emerald-50 text-emerald-700" },
                    { label: "Action required", value: summary.actionRequired, icon: <AlertCircle size={18} />, accent: "border-l-amber-500", iconStyle: "bg-amber-50 text-amber-700" },
                    { label: "Client activity", value: summary.clientActivity, icon: <UsersRound size={18} />, accent: "border-l-blue-500", iconStyle: "bg-blue-50 text-blue-700" },
                    { label: "Agent activity", value: summary.agentActivity, icon: <UserRound size={18} />, accent: "border-l-cyan-500", iconStyle: "bg-cyan-50 text-cyan-700" },
                    { label: "System activity", value: summary.systemActivity, icon: <Settings size={18} />, accent: "border-l-violet-500", iconStyle: "bg-violet-50 text-violet-700" },
                ].map((card) => (
                    <div key={card.label} className={`flex items-center gap-3 rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${card.accent}`}>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconStyle}`}>{card.icon}</div>
                        <div><p className="text-xs font-medium text-slate-500">{card.label}</p><p className="text-xl font-extrabold text-navy">{card.value.toLocaleString()}</p></div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2.5">
                    <label className="relative min-w-[240px] flex-1 xl:max-w-sm">
                        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search actor, request ID or activity…" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-navy/30 focus:ring-2 focus:ring-navy/5" />
                    </label>
                    <div className="flex h-10 rounded-lg border border-slate-200 bg-slate-50 p-1">
                        {(["all", "Client", "Agent", "System"] as const).map((actor) => (
                            <button key={actor} onClick={() => { setActorModel(actor); setPage(1); }} className={`rounded-md px-3 text-[11px] font-semibold transition ${actorModel === actor ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{actor === "all" ? "All" : `${actor}s`}</button>
                        ))}
                    </div>
                    <select value={category} onChange={(event) => { setCategory(event.target.value as typeof category); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none">
                        <option value="all">All activity</option>
                        <option value="finance">Finance</option><option value="kyc">KYC</option><option value="account">Account forms</option><option value="portfolio">Portfolio</option><option value="profile">Profile</option><option value="auth">Authentication</option><option value="system">System</option>
                    </select>
                    <select value={readState} onChange={(event) => { setReadState(event.target.value as typeof readState); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none">
                        <option value="all">Any status</option><option value="unread">Unread</option><option value="read">Read</option>
                    </select>
                    <select value={priority} onChange={(event) => { setPriority(event.target.value as typeof priority); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none">
                        <option value="all">Any priority</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                    <label className="relative flex items-center">
                        <CalendarDays size={14} className="pointer-events-none absolute left-3 text-slate-400" />
                        <select value={range} onChange={(event) => { setRange(event.target.value as typeof range); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-600 outline-none"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select>
                    </label>
                    <button onClick={() => { setActionOnly((value) => !value); setPage(1); }} className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold ${actionOnly ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500"}`}><Filter size={13} /> Action required</button>
                    <button onClick={resetFilters} disabled={activeFilterCount === 0} className="h-10 px-2 text-[11px] font-semibold text-navy disabled:text-slate-300">Reset filters</button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400"><SlidersHorizontal size={12} /> Active filters: <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-navy px-1.5 font-bold text-white">{activeFilterCount}</span></div>
            </div>

            <div className={`grid min-h-[560px] gap-4 ${selected ? "xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.85fr)]" : "grid-cols-1"}`}>
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex min-h-12 flex-wrap items-center gap-3 border-b border-slate-200 px-3 py-2">
                        <label className="flex items-center gap-2 text-[11px] font-medium text-slate-500"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300 accent-navy" /> Select all</label>
                        <span className="h-4 w-px bg-slate-200" />
                        <button onClick={() => void updateReadState({ ids: [...selectedIds] })} disabled={selectedIds.size === 0 || mutating} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 disabled:opacity-40"><Check size={13} /> Mark selected read</button>
                        <p className="ml-auto text-[11px] text-slate-400">{total.toLocaleString()} notifications</p>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[430px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
                    ) : items.length === 0 ? (
                        <div className="flex min-h-[430px] flex-col items-center justify-center gap-2 text-center"><Inbox size={34} className="text-slate-300" /><p className="text-sm font-semibold text-slate-600">No notifications found</p><p className="text-xs text-slate-400">Try changing or resetting the filters.</p></div>
                    ) : (
                        grouped.map((group) => (
                            <div key={group.label}>
                                <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600">{group.label}</div>
                                {group.items.map((item) => {
                                    const style = categoryStyle[item.category] ?? categoryStyle.system;
                                    return (
                                        <div key={item._id} onClick={() => openNotification(item)} className={`group grid cursor-pointer grid-cols-[20px_36px_minmax(0,1fr)] gap-2.5 border-b border-slate-100 px-3 py-3 transition hover:bg-slate-50 lg:grid-cols-[20px_36px_minmax(220px,1fr)_auto_110px_100px] ${!item.isRead ? "bg-emerald-50/45" : "bg-white"} ${selected?._id === item._id ? "ring-1 ring-inset ring-navy/20" : ""}`}>
                                            <input type="checkbox" checked={selectedIds.has(item._id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleOne(item._id)} className="mt-2 h-4 w-4 rounded border-slate-300 accent-navy" aria-label={`Select ${item.title}`} />
                                            <div className={`relative flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold ${item.actorModel === "Client" ? "bg-blue-100 text-blue-700" : item.actorModel === "Agent" ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>{initials(item)}{!item.isRead && <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-600 ring-2 ring-white" />}</div>
                                            <div className="min-w-0">
                                                <p className={`truncate text-xs text-slate-800 ${item.isRead ? "font-semibold" : "font-extrabold"}`}>{item.title}</p>
                                                <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{actorName(item)} · {item.message}</p>
                                            </div>
                                            <div className="col-start-3 flex flex-wrap items-center gap-1.5 lg:col-start-auto">
                                                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${item.actorModel === "Client" ? "border-blue-200 bg-blue-50 text-blue-700" : item.actorModel === "Agent" ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{item.actorModel}</span>
                                                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${style.className}`}>{style.icon}{style.label}</span>
                                            </div>
                                            <div className="col-start-3 text-[10px] text-slate-400 lg:col-start-auto"><p>{formatTime(item.createdAt)}</p><p className="mt-0.5 max-w-[100px] truncate font-mono">{item.entity?.reference || item.action}</p></div>
                                            <div className="col-start-3 flex items-center justify-between lg:col-start-auto lg:flex-col lg:items-end lg:justify-center">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] capitalize text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${priorityStyle[item.priority]}`} />{item.priority}</span>
                                                <span className="text-[10px] font-bold text-navy">{item.actionRequired ? "Review request" : "View details"}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}

                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                        <p className="text-[10px] text-slate-400">Page {page} of {totalPages}</p>
                        <div className="flex gap-1"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30"><ChevronLeft size={14} /></button><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30"><ChevronRight size={14} /></button></div>
                    </div>
                </section>

                {selected && (
                    <aside className="h-fit overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-2">
                        <div className="flex items-center border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-extrabold text-navy">Event details</h2><button onClick={() => setSelected(null)} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close details"><X size={16} /></button></div>
                        <div className="max-h-[calc(100vh-180px)] space-y-4 overflow-y-auto p-4">
                            <div className="flex flex-wrap gap-2"><span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${selected.isRead ? "border-slate-200 bg-slate-50 text-slate-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{selected.isRead ? "Read" : "Unread"}</span>{selected.actionRequired && <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Action required</span>}</div>
                            <div><h3 className="text-base font-extrabold text-slate-900">{selected.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{selected.message}</p></div>
                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-xs font-extrabold text-navy">{initials(selected)}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{actorName(selected)}</p><p className="truncate text-[10px] text-slate-400">{selected.actorModel === "System" ? `${selected.performedBy?.role || "system"} action` : selected.actor?.email || selected.actorModel}</p></div><div className="ml-auto text-right"><p className="text-[9px] uppercase tracking-wider text-slate-400">Event timestamp</p><p className="text-[10px] font-semibold text-slate-600">{formatDateTime(selected.createdAt)}</p></div></div>

                            {selected.performedBy && <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-500">Performed by</p><div className="grid gap-2 sm:grid-cols-2"><div><p className="text-[9px] text-slate-400">Identity</p><p className="mt-0.5 break-all text-[11px] font-bold text-slate-700">{selected.performedBy.name || "System"}</p></div><div><p className="text-[9px] text-slate-400">Role</p><p className="mt-0.5 text-[11px] font-bold capitalize text-slate-700">{selected.performedBy.role || "system"}</p></div></div></section>}

                            {(selected.entity?.reference || selected.entity?.label || selected.entity?.state) && <section><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Related request</p><div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">{[["Reference", selected.entity?.reference], ["Type", selected.entity?.label || selected.entity?.model], ["Current state", selected.entity?.state], ["Record ID", selected.entity?.id]].filter(([, value]) => value).map(([label, value]) => <div key={String(label)} className="bg-white p-3"><p className="text-[9px] uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 break-all text-[11px] font-bold text-slate-700">{value}</p></div>)}</div></section>}

                            <section><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Audit footprint</p><div className="relative ml-2 border-l border-emerald-200 pl-5">{(selected.footprints?.length ? selected.footprints : [{ label: "Activity recorded", description: selected.message, at: selected.createdAt }]).map((footprint, index) => <div key={`${footprint.label}-${index}`} className="relative pb-4 last:pb-0"><span className="absolute -left-[25px] top-1 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-emerald-50" /><div className="flex items-start justify-between gap-3"><p className="text-[11px] font-bold text-slate-700">{footprint.label}</p><p className="shrink-0 text-[9px] text-slate-400">{formatDateTime(footprint.at)}</p></div>{footprint.description && <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{footprint.description}</p>}</div>)}</div></section>

                            {(selected.source?.ip || selected.source?.path || selected.metadata) && <section className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Metadata</p><div className="space-y-1.5 text-[10px]">{selected.source?.ip && <div className="grid grid-cols-[90px_1fr] gap-2"><span className="text-slate-400">IP address</span><span className="break-all font-medium text-slate-600">{selected.source.ip}</span></div>}{selected.source?.userAgent && <div className="grid grid-cols-[90px_1fr] gap-2"><span className="text-slate-400">Device</span><span className="line-clamp-2 font-medium text-slate-600">{selected.source.userAgent}</span></div>}{selected.source?.path && <div className="grid grid-cols-[90px_1fr] gap-2"><span className="text-slate-400">Source API</span><span className="break-all font-mono text-slate-600">{selected.source.method} {selected.source.path}</span></div>}{Object.entries(selected.metadata ?? {}).slice(0, 6).map(([key, value]) => <div key={key} className="grid grid-cols-[90px_1fr] gap-2"><span className="truncate capitalize text-slate-400">{key.replace(/([A-Z])/g, " $1")}</span><span className="break-all font-medium text-slate-600">{valueText(value)}</span></div>)}</div></section>}

                            <div className="grid gap-2 sm:grid-cols-2">{relatedUrl(selected) && <button onClick={() => router.push(relatedUrl(selected)!)} className="rounded-xl bg-navy px-4 py-3 text-xs font-bold text-white">{selected.actionRequired ? "Review request" : "Open record"}</button>}<button onClick={() => void updateReadState({ ids: [selected._id], read: !selected.isRead })} disabled={mutating} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600">Mark as {selected.isRead ? "unread" : "read"}</button></div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
