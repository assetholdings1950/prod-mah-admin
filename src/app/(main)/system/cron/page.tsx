"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks/hooks";
import appClient from "@/lib/appClient";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";
import {
    RefreshCw,
    Play,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    ChevronLeft,
    ChevronRight,
    CalendarClock,
    Trash2,
    Sun,
    Moon,
    ShieldCheck,
    ArrowRight,
    History,
    Timer,
    Server,
    Mail,
    Coins,
    Gauge,
    LockKeyhole,
} from "lucide-react";
import Select from "@/components/common/Select";
import ConfirmModal from "@/app/(main)/finance/deposits/_components/ConfirmModal";

/* ─── types ─────────────────────────────────────────────────────────────────── */
type CronState = "idle" | "running" | "done" | "error";

interface CronEntry {
    name: string;
    label: string;
    schedule: string;
    description: string;
    state: CronState;
    lastRunAt: string | null;
    lastStatus: "success" | "error" | null;
    lastResult: Record<string, unknown> | null;
    lastError: string | null;
    lastDurationMs: number | null;
    runCount: number;
}

interface CronLog {
    _id: string;
    cronName: string;
    status: "success" | "error";
    result: Record<string, unknown> | null;
    error: string | null;
    startedAt: string;
    durationMs: number;
    triggeredBy: "schedule" | "manual";
}

/* ─── helpers ────────────────────────────────────────────────────────────────── */
function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function fmtDuration(ms: number | null) {
    if (ms === null || ms === undefined) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function resultSummary(result: Record<string, unknown> | null) {
    if (!result) return "—";

    const jobs = result.jobs;
    if (jobs && typeof jobs === "object" && !Array.isArray(jobs)) {
        return Object.entries(jobs as Record<string, { status?: string; result?: Record<string, unknown>; error?: string }>)
            .map(([name, job]) => {
                const details = job.result
                    ? Object.entries(job.result).map(([key, value]) => `${key}: ${String(value)}`).join(", ")
                    : job.error;
                return `${name}: ${job.status ?? "unknown"}${details ? ` (${details})` : ""}`;
            })
            .join(" · ");
    }

    return Object.entries(result)
        .map(([k, v]) => `${k}: ${typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)}`)
        .join(" · ");
}

function getNextExecution(now: Date) {
    const morning = new Date(now);
    morning.setUTCHours(9, 0, 0, 0);
    const evening = new Date(now);
    evening.setUTCHours(21, 0, 0, 0);

    if (now < morning) return { name: "Morning Master", time: "09:00", date: morning, accent: "amber" as const };
    if (now < evening) return { name: "Evening Master", time: "21:00", date: evening, accent: "indigo" as const };

    morning.setUTCDate(morning.getUTCDate() + 1);
    return { name: "Morning Master", time: "09:00", date: morning, accent: "amber" as const };
}

function countdownParts(target: Date, now: Date) {
    const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
    return {
        hours: String(Math.floor(totalSeconds / 3600)).padStart(2, "0"),
        minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0"),
        seconds: String(totalSeconds % 60).padStart(2, "0"),
    };
}

const VERCEL_SCHEDULES: Record<string, { label: string; utc: string; time: string; description: string; tasks: string[] }> = {
    master_morning: {
        label: "Daily around 09:00 UTC",
        utc: "0 9 * * * UTC",
        time: "09:00",
        description: "Morning master runs portfolio maturity, then SIP reminders, then SIP auto-payment. A persistent UTC-day execution key prevents duplicate scheduled runs.",
        tasks: ["Maturity", "SIP reminder", "Auto-payment"],
    },
    master_evening: {
        label: "Daily around 21:00 UTC",
        utc: "0 21 * * * UTC",
        time: "21:00",
        description: "Evening master runs portfolio maturity only. A persistent UTC-day execution key prevents duplicate scheduled runs.",
        tasks: ["Maturity"],
    },
};

/* ─── badges ─────────────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: "success" | "error" | null }) {
    if (!status) return <span className="text-[var(--color-text-muted)] text-xs">—</span>;
    if (status === "success")
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
                <CheckCircle2 size={11} /> success
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400">
            <XCircle size={11} /> error
        </span>
    );
}

function StateBadge({ state }: { state: CronState }) {
    const base = "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border";
    if (state === "running")
        return <span className={`${base} border-blue-500/30 bg-blue-500/10 text-blue-400`}><Loader2 size={10} className="animate-spin" /> running</span>;
    if (state === "idle")
        return <span className={`${base} border-[var(--color-border)] text-[var(--color-text-muted)]`}><Clock size={10} /> idle</span>;
    if (state === "done")
        return <span className={`${base} border-green-500/30 bg-green-500/10 text-green-400`}><CheckCircle2 size={10} /> done</span>;
    return <span className={`${base} border-red-500/30 bg-red-500/10 text-red-400`}><XCircle size={10} /> error</span>;
}

function TriggerBadge({ by }: { by: "schedule" | "manual" }) {
    if (by === "manual")
        return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-amber-500 bg-amber-500/10 text-amber-500 font-medium"><Play size={8} /> manual</span>;
    return <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)]"><CalendarClock size={8} /> scheduled</span>;
}

/* ─── master schedule card ───────────────────────────────────────────────────── */
function MasterCronCard({
    entry,
    onTrigger,
    triggering,
    isSuperadmin,
}: {
    entry: CronEntry;
    onTrigger: (name: string) => void;
    triggering: string | null;
    isSuperadmin: boolean;
}) {
    const isRunning = entry.state === "running" || triggering === entry.name;
    const vercelSchedule = VERCEL_SCHEDULES[entry.name];
    const isMorning = entry.name === "master_morning";
    const Icon = isMorning ? Sun : Moon;
    const accent = isMorning
        ? {
            border: "border-amber-400/25",
            icon: "bg-amber-400/15 text-amber-500 ring-amber-400/20",
            time: "text-amber-500",
            button: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
            edge: "border-l-amber-500",
        }
        : {
            border: "border-indigo-400/25",
            icon: "bg-indigo-500/15 text-indigo-400 ring-indigo-400/20",
            time: "text-indigo-400",
            button: "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20",
            edge: "border-l-indigo-500",
        };

    return (
        <article className={`rounded-xl border border-l-4 ${accent.border} ${accent.edge} bg-white p-4 shadow-sm`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 ${accent.icon}`}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-extrabold text-[var(--color-text-primary)]">{entry.label}</h3>
                            <StateBadge state={entry.state} />
                        </div>
                        <code className="mt-0.5 block font-mono text-[10px] text-[var(--color-text-muted)]">{entry.name}</code>
                    </div>
                </div>
                {isSuperadmin && (
                    <button
                        onClick={() => onTrigger(entry.name)}
                        disabled={isRunning}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${accent.button}`}
                    >
                        {isRunning
                            ? <><Loader2 size={12} className="animate-spin" /> Running</>
                            : <><Play size={11} fill="currentColor" /> Run now</>}
                    </button>
                )}
            </div>

            <div className="mt-4 grid grid-cols-3 border-y border-[var(--color-border)] py-3">
                <div className="border-r border-[var(--color-border)] pr-3">
                    <span className="block text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">Last run</span>
                    <span className="mt-1 block truncate text-[10px] font-semibold text-[var(--color-text-primary)]" title={fmtDate(entry.lastRunAt)}>{fmtDate(entry.lastRunAt)}</span>
                </div>
                <div className="border-r border-[var(--color-border)] px-3">
                    <span className="block text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">Duration</span>
                    <span className="mt-1 block text-[10px] font-semibold text-[var(--color-text-primary)]">{fmtDuration(entry.lastDurationMs)}</span>
                </div>
                <div className="pl-3">
                    <span className="block text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">Run count</span>
                    <span className="mt-1 block text-[10px] font-semibold text-[var(--color-text-primary)]">{entry.runCount}</span>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-[10px]">
                <span className={`font-bold ${accent.time}`}>Next daily run</span>
                <span className="font-mono text-[var(--color-text-muted)]">{vercelSchedule?.time} UTC</span>
            </div>
        </article>
    );
}

function ExecutionTimeline({ now }: { now: Date | null }) {
    const currentHour = now ? now.getUTCHours() + now.getUTCMinutes() / 60 : 0;
    const currentPercent = Math.min(100, Math.max(0, (currentHour / 24) * 100));
    const markers = [0, 3, 6, 9, 12, 15, 18, 21, 24];

    return (
        <section className="cron-live-panel rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Timer size={15} className="text-blue-600" /><h2 className="text-sm font-extrabold text-[var(--color-text-primary)]">UTC Execution Timeline</h2></div>
                <span className="font-mono text-[10px] text-[var(--color-text-muted)]">24-hour orchestration map</span>
            </div>

            <div className="relative mt-8 h-20 px-2">
                <div className="cron-timeline-flow absolute left-2 right-2 top-7 h-px overflow-hidden bg-slate-300" />
                {markers.map((hour) => (
                    <div key={hour} className="absolute top-5 -translate-x-1/2" style={{ left: `${(hour / 24) * 100}%` }}>
                        <span className="block h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span className="mt-3 block -translate-x-1/3 font-mono text-[9px] text-[var(--color-text-muted)]">{String(hour).padStart(2, "0")}:00</span>
                    </div>
                ))}
                {now && (
                    <div className="cron-now-marker absolute top-0 -translate-x-1/2" style={{ left: `${currentPercent}%` }}>
                        <span className="block h-14 w-px bg-blue-500/60" />
                        <span className="absolute -left-7 -top-5 whitespace-nowrap rounded bg-blue-600 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white">NOW {String(now.getUTCHours()).padStart(2, "0")}:{String(now.getUTCMinutes()).padStart(2, "0")}</span>
                    </div>
                )}
                {[{ hour: 9, time: "09:00", tone: "amber" }, { hour: 21, time: "21:00", tone: "indigo" }].map((node) => (
                    <div key={node.time} className={`cron-schedule-node absolute top-1 -translate-x-1/2 ${node.tone === "indigo" ? "cron-delay-evening" : ""}`} style={{ left: `${(node.hour / 24) * 100}%` }}>
                        <span className={`block rounded-md border px-2 py-1 font-mono text-[10px] font-bold ${node.tone === "amber" ? "border-amber-300 bg-amber-50 text-amber-600" : "border-indigo-300 bg-indigo-50 text-indigo-600"}`}>{node.time}</span>
                        <span className={`mx-auto mt-2 block h-4 w-4 rounded-full border-4 border-white ring-2 ${node.tone === "amber" ? "bg-amber-500 ring-amber-300" : "bg-indigo-500 ring-indigo-300"}`} />
                    </div>
                ))}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_36px_1fr_36px_1fr_1.05fr] md:items-center">
                {["Maturity", "SIP Reminder", "Auto-payment"].map((task, index) => (
                    <div key={task} className="contents">
                        <div className="cron-flow-card rounded-xl border border-amber-200 bg-amber-50/40 p-3" style={{ animationDelay: `${index * 450}ms` }}>
                            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><CheckCircle2 size={13} /></span><span className="text-[11px] font-bold text-slate-700">{task}</span></div>
                            <p className="mt-2 text-[9px] text-slate-500">{index === 0 ? "Process matured portfolios" : index === 1 ? "Send upcoming SIP notices" : "Process due installments"}</p>
                        </div>
                        {index < 2 && <ArrowRight size={15} className="cron-flow-arrow mx-auto hidden text-amber-500 md:block" style={{ animationDelay: `${index * 450}ms` }} />}
                    </div>
                ))}
                <div className="cron-flow-card rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 md:ml-2" style={{ animationDelay: "1350ms" }}>
                    <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"><Moon size={13} /></span><span className="text-[11px] font-bold text-slate-700">Maturity Sweep</span></div>
                    <p className="mt-2 text-[9px] text-slate-500">Evening portfolio sweep</p>
                </div>
            </div>
        </section>
    );
}

function NextExecutionCard({ now }: { now: Date | null }) {
    if (!now) {
        return <div className="h-48 animate-pulse rounded-xl border border-[var(--color-border)] bg-white" />;
    }

    const next = getNextExecution(now);
    const countdown = countdownParts(next.date, now);
    const isMorning = next.accent === "amber";

    return (
        <section className="cron-live-panel overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
            <div className="border-b border-[var(--color-border)] px-4 py-3">
                <div className="flex items-center gap-2">
                    <Clock size={14} className={isMorning ? "text-amber-500" : "text-indigo-500"} />
                    <h2 className="text-xs font-extrabold text-[var(--color-text-primary)]">Next Execution</h2>
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{next.name}</p>
                        <p className={`mt-1 text-2xl font-black ${isMorning ? "text-amber-500" : "text-indigo-500"}`}>{next.time} <span className="text-xs">UTC</span></p>
                    </div>
                    <div className={`cron-next-icon flex h-11 w-11 items-center justify-center rounded-xl ${isMorning ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}>
                        {isMorning ? <Sun size={20} /> : <Moon size={20} />}
                    </div>
                </div>
                <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                    {next.date.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                        [countdown.hours, "HRS"],
                        [countdown.minutes, "MIN"],
                        [countdown.seconds, "SEC"],
                    ].map(([value, label]) => (
                        <div key={label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2.5 text-center">
                            <span key={`${label}-${value}`} className="cron-countdown-tick block font-mono text-lg font-black text-[var(--color-text-primary)]">{value}</span>
                            <span className="block text-[8px] font-bold tracking-widest text-[var(--color-text-muted)]">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function SystemHealthCard({ reachable, crons }: { reachable: boolean | null; crons: CronEntry[] }) {
    const schedulerLabel = reachable === null ? "Checking" : reachable ? "Online" : "Offline";
    const schedulerTone = reachable === null ? "text-amber-500" : reachable ? "text-emerald-500" : "text-red-500";
    const schedulerDot = reachable === null ? "bg-amber-500" : reachable ? "bg-emerald-500" : "bg-red-500";
    const locksReady = reachable === true && crons.length > 0;
    const items = [
        { icon: Server, label: "Scheduler API", value: schedulerLabel, tone: schedulerTone, dot: schedulerDot },
        { icon: LockKeyhole, label: "Duplicate locks", value: locksReady ? "Ready" : reachable === null ? "Checking" : "Unavailable", tone: locksReady ? "text-emerald-500" : "text-amber-500", dot: locksReady ? "bg-emerald-500" : "bg-amber-500" },
        { icon: Mail, label: "Email service", value: "Checked on run", tone: "text-blue-500", dot: "bg-blue-500" },
        { icon: Coins, label: "Currency rates", value: "Checked on run", tone: "text-blue-500", dot: "bg-blue-500" },
    ];

    return (
        <section className="cron-live-panel rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <h2 className="text-xs font-extrabold text-[var(--color-text-primary)]">System Health</h2>
            </div>
            <div className="space-y-1">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[var(--color-bg)]">
                            <Icon size={13} className="text-[var(--color-text-muted)]" />
                            <span className="flex-1 text-[10px] font-medium text-[var(--color-text-primary)]">{item.label}</span>
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold ${item.tone}`}><span className={`cron-health-dot h-1.5 w-1.5 rounded-full ${item.dot}`} />{item.value}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function CapacityCard() {
    return (
        <section className="cron-live-panel rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Gauge size={14} className="text-violet-500" />
                    <div>
                        <h2 className="text-xs font-extrabold text-[var(--color-text-primary)]">Vercel Capacity</h2>
                        <p className="mt-0.5 text-[9px] text-[var(--color-text-muted)]">Hobby plan cron slots</p>
                    </div>
                </div>
                <span className="font-mono text-sm font-black text-violet-500">2/2</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-100">
                <div className="cron-capacity-flow h-full w-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-indigo-500" />
            </div>
            <p className="mt-2 text-[9px] text-[var(--color-text-muted)]">Both daily scheduler slots are allocated.</p>
        </section>
    );
}

/* ─── inner page (uses searchParams) ────────────────────────────────────────── */
function CronPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = useAppSelector((s) => s.auth.user);
    const isSuperadmin = currentUser?.role?.some((r: { roleCode: string }) => r.roleCode === "superadmin") ?? false;

    /* URL-synced filter state */
    const filterCron = searchParams.get("cron") ?? "all";
    const filterStatus = searchParams.get("lstatus") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("lpage") ?? "1"));

    const setParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams.toString());
        if (value === "all" || value === "1") next.delete(key);
        else next.set(key, value);
        if (key !== "lpage") next.delete("lpage");
        router.replace(`?${next.toString()}`, { scroll: false });
    };

    /* cron status */
    const [crons, setCrons] = useState<CronEntry[]>([]);
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusReachable, setStatusReachable] = useState<boolean | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [now, setNow] = useState<Date | null>(null);

    /* manual trigger */
    const [triggering, setTriggering] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);

    /* logs */
    const [logs, setLogs] = useState<CronLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);

    const fetchStatus = useCallback(async () => {
        setStatusLoading(true);
        setStatusError(null);
        try {
            const res = await appClient.get("/api/cron/status");
            if (res.data?.status) {
                const rawCrons = res.data.crons;
                const entries = Array.isArray(rawCrons)
                    ? rawCrons
                    : Object.values(rawCrons ?? {});
                setCrons(entries as CronEntry[]);
                setStatusReachable(true);
            } else {
                setCrons([]);
                setStatusReachable(false);
                setStatusError(res.data?.message ?? "The scheduler status API returned an invalid response.");
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string; error?: string } } };
            setCrons([]);
            setStatusReachable(false);
            setStatusError(err.response?.data?.message ?? err.response?.data?.error ?? "Unable to reach the scheduler status API.");
        }
        finally { setStatusLoading(false); }
    }, []);

    const fetchLogs = useCallback(async (p: number, cron: string, status: string) => {
        setLogsLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), limit: "15" });
            if (cron !== "all") params.set("cronName", cron);
            if (status !== "all") params.set("status", status);
            const res = await appClient.get(`/api/cron/logs?${params}`);
            if (res.data?.status) {
                setLogs(res.data.logs ?? []);
                setTotalPages(res.data.totalPages ?? 1);
            }
        } catch { /* silent */ }
        finally { setLogsLoading(false); }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);
    useEffect(() => { fetchLogs(page, filterCron, filterStatus); }, [fetchLogs, page, filterCron, filterStatus]);
    useEffect(() => {
        setNow(new Date());
        const timer = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const handleTrigger = async (name: string) => {
        setTriggering(name);
        try {
            const res = await appClient.post(`/api/cron/run/${name}`);
            if (res.data?.status) {
                toastSuccess(res.data?.message ?? `Cron "${name}" completed.`);
            } else {
                toastError(res.data?.message ?? `Cron "${name}" failed.`);
            }
            await fetchStatus();
            await fetchLogs(page, filterCron, filterStatus);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toastError(err.response?.data?.message ?? "Request failed.");
        } finally {
            setTriggering(null);
        }
    };

    const handleDeleteAll = async () => {
        setDeletingAll(true);
        try {
            const res = await appClient.delete("/api/cron/delete-all");
            if (!res.data?.status) {
                toastError(res.data?.message ?? "Failed to delete cron data.");
                return;
            }

            const deleted = res.data?.deleted;
            toastSuccess(
                `Deleted ${deleted?.logs ?? 0} cron log(s) and ${deleted?.executions ?? 0} execution lock(s).`
            );
            setDeleteConfirmOpen(false);
            setLogs([]);
            setTotalPages(1);
            await fetchStatus();
            await fetchLogs(1, filterCron, filterStatus);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toastError(err.response?.data?.message ?? "Failed to delete cron data.");
        } finally {
            setDeletingAll(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">

            {/* ── header ── */}
            <header className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-2xl">Cron Command Center</h1>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${statusReachable === false ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-emerald-600"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusReachable === false ? "bg-red-500" : "animate-pulse bg-emerald-500"}`} />
                            {statusReachable === null ? "Checking automation" : statusReachable ? "Automation online" : "Automation offline"}
                        </span>
                    </div>
                    <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                        Monitor and control the protected UTC workflows for portfolio maturity and SIP operations.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isSuperadmin && (
                        <button
                            onClick={() => setDeleteConfirmOpen(true)}
                            disabled={deletingAll || crons.some((cron) => cron.state === "running")}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[10px] font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {deletingAll ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            Delete data
                        </button>
                    )}
                    <button
                        onClick={fetchStatus}
                        disabled={statusLoading}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-[10px] font-bold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg)] disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={statusLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
            </header>

            {/* ── orchestration cockpit ── */}
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="flex min-w-0 flex-col gap-4">
                    <ExecutionTimeline now={now} />

                    {statusLoading ? (
                        <div className="flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-white py-20 text-[var(--color-text-muted)]">
                            <Loader2 size={20} className="animate-spin" />
                        </div>
                    ) : statusError ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/60 px-5 py-14 text-center">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500"><XCircle size={18} /></span>
                            <h3 className="mt-3 text-xs font-extrabold text-red-700">Scheduler status unavailable</h3>
                            <p className="mt-1 max-w-md text-[10px] leading-relaxed text-red-600/80">{statusError}</p>
                            <button onClick={fetchStatus} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[10px] font-bold text-red-600 shadow-sm hover:bg-red-50"><RefreshCw size={11} />Try again</button>
                        </div>
                    ) : crons.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-[var(--color-border)] py-16 text-center text-sm text-[var(--color-text-muted)]">No master schedules registered.</p>
                    ) : (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {crons.map((entry) => (
                                <MasterCronCard
                                    key={entry.name}
                                    entry={entry}
                                    onTrigger={handleTrigger}
                                    triggering={triggering}
                                    isSuperadmin={isSuperadmin}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <aside className="flex flex-col gap-3">
                    <NextExecutionCard now={now} />
                    <SystemHealthCard reachable={statusReachable} crons={crons} />
                    <CapacityCard />
                </aside>
            </section>

            {/* ── run history ── */}
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
                {/* section header + filters */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><History size={15} /></div>
                        <div>
                            <span className="block text-xs font-bold text-[var(--color-text-primary)]">Execution history</span>
                            <span className="block text-[9px] text-[var(--color-text-muted)]">Audit every scheduled and manual run</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            size="sm"
                            value={filterCron}
                            onChange={(v) => setParam("cron", v)}
                            options={[
                                { value: "all", label: "All jobs" },
                                ...crons.map((c) => ({ value: c.name, label: c.label })),
                            ]}
                        />

                        <Select
                            size="sm"
                            value={filterStatus}
                            onChange={(v) => setParam("lstatus", v)}
                            options={[
                                { value: "all", label: "All statuses" },
                                { value: "success", label: "Success" },
                                { value: "error", label: "Error" },
                            ]}
                        />
                    </div>
                </div>

                {logsLoading ? (
                    <div className="flex items-center justify-center py-12 text-[var(--color-text-muted)]">
                        <Loader2 size={20} className="animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <p className="text-center py-10 text-[var(--color-text-muted)] text-sm">No logs found.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)] bg-white">
                                        <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-muted)]">Job</th>
                                        <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-muted)]">Status</th>
                                        <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-muted)]">Triggered</th>
                                        <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-muted)] whitespace-nowrap">Started At</th>
                                        <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-muted)]">Duration</th>
                                        <th className="text-left px-4 py-2.5 font-medium text-[var(--color-text-muted)]">Result / Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, i) => (
                                        <tr
                                            key={log._id}
                                            className={`border-b border-[var(--color-border)] ${i % 2 === 0 ? "bg-[var(--color-bg)]" : "bg-white"}`}
                                        >
                                            <td className="px-4 py-3 font-mono text-[var(--color-text-primary)] whitespace-nowrap">
                                                {log.cronName}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={log.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <TriggerBadge by={log.triggeredBy} />
                                            </td>
                                            <td className="px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">
                                                {fmtDate(log.startedAt)}
                                            </td>
                                            <td className="px-4 py-3 text-[var(--color-text-primary)] whitespace-nowrap">
                                                {fmtDuration(log.durationMs)}
                                            </td>
                                            <td className="px-4 py-3 max-w-[280px] truncate text-[var(--color-text-muted)]" title={log.status === "error" ? (log.error ?? "") : resultSummary(log.result)}>
                                                {log.status === "error"
                                                    ? <span className="text-red-400">{log.error ?? "—"}</span>
                                                    : resultSummary(log.result)
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] bg-white">
                                <span className="text-[11px] text-[var(--color-text-muted)]">Page {page} of {totalPages}</span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setParam("lpage", String(page - 1))}
                                        disabled={page === 1}
                                        className="p-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={13} />
                                    </button>
                                    <button
                                        onClick={() => setParam("lpage", String(page + 1))}
                                        disabled={page === totalPages}
                                        className="p-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={13} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmModal
                open={deleteConfirmOpen}
                title="Delete All Cron Data"
                description="Permanently delete every cron run log and master execution lock? Registered schedules will remain active. Removing today's execution locks can allow a Vercel retry to run that slot again. This cannot be undone."
                confirmLabel="Delete All"
                variant="danger"
                loading={deletingAll}
                onConfirm={handleDeleteAll}
                onCancel={() => { if (!deletingAll) setDeleteConfirmOpen(false); }}
            />
        </div>
    );
}

/* ─── page (Suspense boundary for useSearchParams) ───────────────────────────── */
export default function CronSchedulerPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20 text-[var(--color-text-muted)]">
                <Loader2 size={22} className="animate-spin" />
            </div>
        }>
            <CronPageInner />
        </Suspense>
    );
}
