"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    Settings2,
    Trash2,
    Video,
    X,
} from "lucide-react";
import CandidateSelect from "@/components/hiring/CandidateSelect";
import Select from "@/components/common/Select";
import {
    HiringCandidateOption,
    HiringInterview,
    InterviewAvailability,
    InterviewCalendar,
    hiringApi,
} from "@/lib/hiringApi";

const TIMEZONE = "Asia/Singapore";
const DAY_START = 0;
const DAY_END = 24;
const HOUR_HEIGHT = 58;
const HOURS = Array.from({ length: DAY_END - DAY_START + 1 }, (_, index) => DAY_START + index);

const hourLabel = (hour: number) => {
    if (hour === 0 || hour === 24) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
};

const INTERVIEW_MODE_OPTIONS = [
    { value: "Video call", label: "Video call", icon: <Video className="h-3 w-3" />, color: "bg-blue-50 text-blue-600" },
    { value: "In person", label: "In person", icon: <MapPin className="h-3 w-3" />, color: "bg-emerald-50 text-emerald-600" },
];

const INTERVIEW_TYPE_OPTIONS = [
    "Initial Interview",
    "Portfolio Interview",
    "Technical Interview",
    "Role Interview",
    "Standards Interview",
    "Final Interview",
    "HR Interview",
].map((label) => ({ value: label, label }));

const AVAILABILITY_OPTIONS = [
    { value: "Available", label: "Available" },
    { value: "Unavailable", label: "Unavailable" },
];

const dateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const singaporeDateKey = (value: string | Date) =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(value));

const singaporeTime = (value: string | Date) =>
    new Intl.DateTimeFormat("en-SG", {
        timeZone: TIMEZONE,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(value));

const singaporeMinutes = (value: string | Date) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(value));
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
    return hour * 60 + minute;
};

const singaporeTimeInput = (value: string | Date) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(value));
    return `${parts.find((part) => part.type === "hour")?.value || ""}:${parts.find((part) => part.type === "minute")?.value || ""}`;
};

const startOfWeek = (value: Date) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    return date;
};

const addDays = (value: Date, amount: number) => {
    const next = new Date(value);
    next.setDate(next.getDate() + amount);
    return next;
};

const combineSgt = (day: string, time: string) => new Date(`${day}T${time}:00+08:00`).toISOString();

const durationHours = (items: Array<{ startAt: string; endAt: string }>) =>
    items.reduce((total, item) => total + (new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) / 3600000, 0);

const rangeLabel = (start: Date, end: Date) => {
    const first = new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short" }).format(start);
    const last = new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", year: "numeric" }).format(end);
    return `${first} – ${last}`;
};

export default function InterviewsPage() {
    const initialDate = useMemo(() => {
        if (typeof window === "undefined") return new Date();
        const param = new URLSearchParams(window.location.search).get("date");
        return param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? new Date(`${param}T12:00:00`) : new Date();
    }, []);
    const [weekStart, setWeekStart] = useState(() => startOfWeek(initialDate));
    const [selectedDate, setSelectedDate] = useState(() => dateKey(initialDate));
    const [calendar, setCalendar] = useState<InterviewCalendar | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [availabilityOpen, setAvailabilityOpen] = useState(false);
    const [editingInterview, setEditingInterview] = useState<HiringInterview | null>(null);
    const [deletingInterviewId, setDeletingInterviewId] = useState("");
    const cache = useRef(new Map<string, InterviewCalendar>());
    const scheduleRef = useRef<HTMLDivElement>(null);
    const calendarScrollRef = useRef<HTMLDivElement>(null);

    const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
    const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
    const requestRange = useMemo(() => ({
        from: combineSgt(dateKey(weekStart), "00:00"),
        to: combineSgt(dateKey(addDays(weekStart, 7)), "00:00"),
        timezone: TIMEZONE,
    }), [weekStart]);

    const loadCalendar = useCallback(async (force = false) => {
        const key = `${requestRange.from}:${requestRange.to}`;
        if (!force && cache.current.has(key)) {
            setCalendar(cache.current.get(key) || null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError("");
        try {
            const data = await hiringApi.interviewCalendar(requestRange);
            cache.current.set(key, data);
            setCalendar(data);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Could not load the interview calendar.");
        } finally {
            setLoading(false);
        }
    }, [requestRange]);

    useEffect(() => { void loadCalendar(); }, [loadCalendar]);

    const selectDate = (day: string) => {
        const chosen = new Date(`${day}T12:00:00`);
        if (chosen < weekStart || chosen >= addDays(weekStart, 7)) {
            setWeekStart(startOfWeek(chosen));
        }
        setSelectedDate(day);
        const url = new URL(window.location.href);
        url.searchParams.set("date", day);
        window.history.replaceState({}, "", url);
    };

    const selectedInterviews = useMemo(
        () => (calendar?.interviews || []).filter((item) => singaporeDateKey(item.startAt) === selectedDate),
        [calendar, selectedDate],
    );
    const selectedAvailability = useMemo(
        () => (calendar?.availability || []).filter((item) => singaporeDateKey(item.startAt) === selectedDate),
        [calendar, selectedDate],
    );
    useEffect(() => {
        if (loading || !calendarScrollRef.current) return;
        const firstInterview = [...selectedInterviews].sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
        const focusMinutes = firstInterview ? singaporeMinutes(firstInterview.startAt) : 8 * 60;
        calendarScrollRef.current.scrollTop = Math.max(0, ((focusMinutes - 60) / 60) * HOUR_HEIGHT);
    }, [loading, selectedDate, selectedInterviews]);

    const moveWeek = (amount: number) => {
        const next = addDays(weekStart, amount * 7);
        setWeekStart(next);
        selectDate(dateKey(next));
    };
    const deleteInterview = async (item: HiringInterview) => {
        if (!window.confirm(`Delete ${item.candidateName}'s ${item.type}? This cannot be undone.`)) return;
        setDeletingInterviewId(item._id);
        setError("");
        try {
            await hiringApi.deleteInterview(item._id);
            cache.current.clear();
            await loadCalendar(true);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Could not delete the interview.");
        } finally {
            setDeletingInterviewId("");
        }
    };

    return (
        <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-10">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400"><CalendarDays className="h-3.5 w-3.5 text-navy" />Hiring</div>
                    <h1 className="mt-1 text-2xl font-extrabold text-navy">Interviews</h1>
                    <p className="mt-1 text-xs text-slate-500">Plan interviews against manually maintained availability.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setAvailabilityOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-navy"><Settings2 className="h-4 w-4" /> Manage availability</button>
                    <button onClick={() => scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Schedule interview</button>
                </div>
            </header>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
                <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                        <div>
                            <h2 className="font-heading text-lg font-bold text-navy">Weekly schedule</h2>
                            <p className="mt-0.5 text-[10px] text-slate-400">Singapore time · UTC+8</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => moveWeek(-1)} aria-label="Previous week" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
                            <button onClick={() => { const today = new Date(); setWeekStart(startOfWeek(today)); selectDate(dateKey(today)); }} className="h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-navy hover:bg-slate-50">Today</button>
                            <span className="min-w-32 text-center text-xs font-bold text-navy">{rangeLabel(weekStart, weekEnd)}</span>
                            <button onClick={() => moveWeek(1)} aria-label="Next week" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[620px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                    ) : (
                        <div ref={calendarScrollRef} className="max-h-[650px] overflow-auto">
                            <div className="min-w-[850px]">
                                <div className="sticky top-0 z-30 grid grid-cols-[64px_repeat(7,minmax(105px,1fr))] border-b border-slate-200 bg-white shadow-sm">
                                    <div />
                                    {days.map((day) => {
                                        const key = dateKey(day);
                                        const active = key === selectedDate;
                                        return <button key={key} onClick={() => selectDate(key)} className={`border-l border-slate-100 px-2 py-3 text-center ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}><span className={`block text-[9px] font-extrabold uppercase tracking-wider ${active ? "text-blue-600" : "text-slate-400"}`}>{new Intl.DateTimeFormat("en-SG", { weekday: "short" }).format(day)}</span><span className={`mt-1 grid h-7 place-items-center text-sm font-bold ${active ? "mx-auto w-7 rounded-full bg-blue-600 text-white" : "text-navy"}`}>{day.getDate()}</span></button>;
                                    })}
                                </div>
                                <div className="relative grid grid-cols-[64px_repeat(7,minmax(105px,1fr))]" style={{ height: (DAY_END - DAY_START) * HOUR_HEIGHT }}>
                                    <div className="relative">
                                        {HOURS.slice(0, -1).map((hour, index) => <span key={hour} className="absolute right-3 -translate-y-2 text-[9px] font-semibold text-slate-400" style={{ top: index * HOUR_HEIGHT }}>{hourLabel(hour)}</span>)}
                                        <span className="absolute right-3 -translate-y-2 text-[9px] font-semibold text-slate-400" style={{ top: (DAY_END - DAY_START) * HOUR_HEIGHT }}>{hourLabel(DAY_END)}</span>
                                    </div>
                                    {days.map((day) => {
                                        const key = dateKey(day);
                                        const slots = (calendar?.availability || []).filter((item) => singaporeDateKey(item.startAt) === key);
                                        const interviews = (calendar?.interviews || []).filter((item) => singaporeDateKey(item.startAt) === key);
                                        return <div key={key} className={`relative border-l border-slate-100 ${key === selectedDate ? "bg-blue-50/20" : ""}`}>
                                            {HOURS.slice(0, -1).map((hour, index) => <div key={hour} className="absolute inset-x-0 border-t border-slate-100" style={{ top: index * HOUR_HEIGHT }} />)}
                                            {slots.map((slot) => <CalendarBlock key={slot._id} startAt={slot.startAt} endAt={slot.endAt} className={slot.status === "Available" ? "border-emerald-200 bg-emerald-50/90 text-emerald-800" : "border-slate-200 bg-slate-100/95 text-slate-500"}><span className="font-bold">{slot.status}</span><span>{singaporeTime(slot.startAt)}–{singaporeTime(slot.endAt)}</span></CalendarBlock>)}
                                            {interviews.map((item) => <CalendarBlock key={item._id} startAt={item.startAt} endAt={item.endAt} className="z-10 border-blue-300 bg-blue-600 text-white shadow-sm">
                                                <div className="flex items-start justify-between gap-1">
                                                    <span className="truncate font-extrabold">{singaporeTime(item.startAt)}–{singaporeTime(item.endAt)}</span>
                                                    <span className="flex shrink-0 gap-0.5">
                                                        <button type="button" title="Edit interview" aria-label={`Edit ${item.candidateName} interview`} onClick={() => setEditingInterview(item)} className="grid h-4 w-4 place-items-center rounded bg-white/20 hover:bg-white/30"><Pencil className="h-2.5 w-2.5" /></button>
                                                        <button type="button" title="Delete interview" aria-label={`Delete ${item.candidateName} interview`} disabled={deletingInterviewId === item._id} onClick={() => void deleteInterview(item)} className="grid h-4 w-4 place-items-center rounded bg-white/20 hover:bg-red-500 disabled:opacity-50"><Trash2 className="h-2.5 w-2.5" /></button>
                                                    </span>
                                                </div>
                                                <span className="truncate font-bold">{item.candidateName}</span>
                                                <span className="truncate text-blue-100">{item.type}</span>
                                            </CalendarBlock>)}
                                        </div>;
                                    })}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 px-5 py-3 text-[9px] font-semibold text-slate-500"><LegendDot color="bg-emerald-400" label="Available" /><LegendDot color="bg-blue-600" label="Booked" /><LegendDot color="bg-slate-300" label="Unavailable" /><span className="ml-auto">All availability is maintained manually</span></div>
                            </div>
                        </div>
                    )}
                </section>

                <aside className="min-w-0 space-y-4">
                    <div ref={scheduleRef}>
                        <InterviewForm
                            selectedDate={selectedDate}
                            selectedInterviews={selectedInterviews}
                            onDateChange={selectDate}
                            onSaved={() => loadCalendar(true)}
                        />
                    </div>
                </aside>
            </div>

            {availabilityOpen && <AvailabilityDialog selectedDate={selectedDate} slots={selectedAvailability} onClose={() => setAvailabilityOpen(false)} onSaved={async () => { cache.current.clear(); await loadCalendar(true); }} />}
            {editingInterview && <InterviewEditDialog item={editingInterview} onClose={() => setEditingInterview(null)} onSaved={async () => { setEditingInterview(null); cache.current.clear(); await loadCalendar(true); }} />}
        </div>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return <span className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>;
}

function CalendarBlock({ startAt, endAt, className, children }: { startAt: string; endAt: string; className: string; children: React.ReactNode }) {
    const start = singaporeMinutes(startAt);
    const end = singaporeMinutes(endAt);
    const top = Math.max(0, ((start - DAY_START * 60) / 60) * HOUR_HEIGHT);
    const height = Math.max(24, ((Math.min(end, DAY_END * 60) - Math.max(start, DAY_START * 60)) / 60) * HOUR_HEIGHT);
    if (end <= DAY_START * 60 || start >= DAY_END * 60) return null;
    return <div className={`absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-[8px] leading-tight ${className}`} style={{ top, height }}>{children}</div>;
}

function AgendaInterview({ item, onUpdated }: { item: HiringInterview; onUpdated: () => void }) {
    const [busy, setBusy] = useState(false);
    const updateStatus = async (status: string) => {
        setBusy(true);
        try { await hiringApi.updateInterview(item._id, { status }); onUpdated(); } finally { setBusy(false); }
    };
    return <article className="rounded-xl border border-blue-100 bg-blue-50/60 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold text-blue-700">{singaporeTime(item.startAt)} – {singaporeTime(item.endAt)}</p><h3 className="mt-1 truncate text-xs font-bold text-navy">{item.candidateName}</h3><p className="mt-0.5 truncate text-[9px] text-slate-500">{item.type} · {item.mode}</p></div><span className="rounded-md bg-white px-2 py-1 text-[8px] font-bold text-blue-700">{item.status}</span></div>{item.status === "Scheduled" && <div className="mt-3 flex gap-2"><button disabled={busy} onClick={() => updateStatus("Completed")} className="h-7 rounded-md bg-emerald-600 px-2 text-[8px] font-bold text-white">Complete</button><button disabled={busy} onClick={() => updateStatus("Cancelled")} className="h-7 rounded-md border border-amber-200 bg-white px-2 text-[8px] font-bold text-amber-700">Cancel</button></div>}</article>;
}

function InterviewEditDialog({ item, onClose, onSaved }: { item: HiringInterview; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState({
        date: singaporeDateKey(item.startAt),
        start: singaporeTimeInput(item.startAt),
        end: singaporeTimeInput(item.endAt),
        type: item.type,
        mode: item.mode,
        locationOrLink: item.locationOrLink || "",
        interviewers: (item.interviewers || []).join(", "),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, []);

    const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            await hiringApi.updateInterview(item._id, {
                startAt: combineSgt(form.date, form.start),
                endAt: combineSgt(form.date, form.end),
                type: form.type,
                mode: form.mode,
                locationOrLink: form.locationOrLink,
                interviewers: form.interviewers.split(",").map((value) => value.trim()).filter(Boolean),
            });
            await onSaved();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Could not update the interview.");
        } finally {
            setSaving(false);
        }
    };

    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-interview-title">
        <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
                <div><p className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600">Edit booking</p><h2 id="edit-interview-title" className="mt-1 font-heading text-xl font-bold text-navy">{item.candidateName}</h2><p className="mt-1 text-xs text-slate-500">{item.role}</p></div>
                <button type="button" aria-label="Close interview editor" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Interview date<input required type="date" value={form.date} onChange={(event) => update("date", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-navy outline-none focus:border-blue-500" /></label>
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Start time<input required type="time" value={form.start} onChange={(event) => update("start", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-navy outline-none focus:border-blue-500" /></label>
                    <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">End time<input required type="time" value={form.end} onChange={(event) => update("end", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-navy outline-none focus:border-blue-500" /></label>
                </div>
                <div className="grid grid-cols-2 gap-3"><Select value={form.type} onChange={(value) => update("type", value)} options={INTERVIEW_TYPE_OPTIONS} fullWidth /><Select value={form.mode} onChange={(value) => update("mode", value)} options={INTERVIEW_MODE_OPTIONS} fullWidth /></div>
                <input value={form.locationOrLink} onChange={(event) => update("locationOrLink", event.target.value)} placeholder="Meeting link or location" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" />
                <input value={form.interviewers} onChange={(event) => update("interviewers", event.target.value)} placeholder="Interviewers, comma separated" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" />
                {error && <p className="rounded-lg bg-red-50 p-2 text-[10px] text-red-700">{error}</p>}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="h-9 rounded-lg border border-slate-200 px-4 text-[10px] font-bold text-slate-600">Cancel</button><button disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy px-4 text-[10px] font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />} Save changes</button></div>
            </div>
        </form>
    </div>;
}

function InterviewForm({
    selectedDate,
    selectedInterviews,
    onDateChange,
    onSaved,
}: {
    selectedDate: string;
    selectedInterviews: HiringInterview[];
    onDateChange: (date: string) => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState({ applicationReference: "", startAt: "", endAt: "", type: "Initial Interview", mode: "Video call", locationOrLink: "", interviewers: "Hiring Admin" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [candidates, setCandidates] = useState<HiringCandidateOption[]>([]);
    const [candidatesLoading, setCandidatesLoading] = useState(true);

    useEffect(() => {
        let active = true;
        hiringApi.candidateOptions({ limit: 100 }).then((items) => {
            if (!active) return;
            setCandidates(items);
            const requested = new URLSearchParams(window.location.search).get("candidate");
            if (requested) setForm((current) => ({ ...current, applicationReference: requested }));
        }).catch(() => setError("Could not load candidates.")).finally(() => { if (active) setCandidatesLoading(false); });
        return () => { active = false; };
    }, []);

    useEffect(() => setForm((current) => ({ ...current, startAt: "", endAt: "" })), [selectedDate]);
    const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
    const updateTime = (field: "startAt" | "endAt", value: string) => update(field, value ? combineSgt(selectedDate, value) : "");
    const submit = async (event: FormEvent) => {
        event.preventDefault(); setSaving(true); setError("");
        try {
            await hiringApi.createInterview({ ...form, interviewers: form.interviewers.split(",").map((value) => value.trim()).filter(Boolean) });
            setForm((current) => ({ ...current, applicationReference: "", startAt: "", endAt: "", locationOrLink: "" }));
            onSaved();
        } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not schedule interview."); }
        finally { setSaving(false); }
    };

    return (
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div><p className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600">New booking</p><h2 className="mt-1 font-heading text-lg font-bold text-navy">Schedule interview</h2></div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">SGT</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Interview date
                    <input required type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-navy outline-none focus:border-blue-500" />
                </label>
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Start time
                    <input required type="time" value={form.startAt ? singaporeTimeInput(form.startAt) : ""} onChange={(event) => updateTime("startAt", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-navy outline-none focus:border-blue-500" />
                </label>
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">End time
                    <input required type="time" value={form.endAt ? singaporeTimeInput(form.endAt) : ""} onChange={(event) => updateTime("endAt", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-navy outline-none focus:border-blue-500" />
                </label>
            </div>

            <div className="mt-4"><CandidateSelect candidates={candidates} value={form.applicationReference} onChange={(reference) => update("applicationReference", reference)} loading={candidatesLoading} /></div>
            <div className="mt-3 grid grid-cols-2 gap-2"><Select value={form.type} onChange={(type) => update("type", type)} options={INTERVIEW_TYPE_OPTIONS} fullWidth /><Select value={form.mode} onChange={(mode) => update("mode", mode)} options={INTERVIEW_MODE_OPTIONS} fullWidth /></div>

            {selectedInterviews.length > 0 && <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Interviews for this date</p>
                {[...selectedInterviews].sort((a, b) => a.startAt.localeCompare(b.startAt)).map((item) => <AgendaInterview key={item._id} item={item} onUpdated={onSaved} />)}
            </div>}

            <input value={form.locationOrLink} onChange={(event) => update("locationOrLink", event.target.value)} placeholder="Meeting link or location" className="mt-4 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" />
            <input value={form.interviewers} onChange={(event) => update("interviewers", event.target.value)} placeholder="Interviewers, comma separated" className="mt-3 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" />
            {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-[10px] text-red-700">{error}</p>}
            <button disabled={saving || candidatesLoading || !form.applicationReference || !form.startAt || !form.endAt} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-navy text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />} Schedule and notify</button>
        </form>
    );
}

function AvailabilityDialog({ selectedDate, slots, onClose, onSaved }: { selectedDate: string; slots: InterviewAvailability[]; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState({ start: "09:00", end: "12:00", status: "Available", label: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => { const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, []);
    const submit = async (event: FormEvent) => {
        event.preventDefault(); setSaving(true); setError("");
        try { await hiringApi.createInterviewAvailability({ startAt: combineSgt(selectedDate, form.start), endAt: combineSgt(selectedDate, form.end), status: form.status, label: form.label, timezone: TIMEZONE }); setForm((current) => ({ ...current, label: "" })); await onSaved(); }
        catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not save availability."); }
        finally { setSaving(false); }
    };
    const remove = async (id: string) => { await hiringApi.deleteInterviewAvailability(id); await onSaved(); };
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="availability-dialog-title"><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4"><div><p className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600">Manual schedule controls</p><h2 id="availability-dialog-title" className="mt-1 font-heading text-xl font-bold text-navy">Manage availability</h2><p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${selectedDate}T12:00:00`))} · SGT</p></div><button aria-label="Close availability editor" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button></div><div className="p-5"><form onSubmit={submit} className="rounded-xl bg-slate-50 p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Start<input type="time" required value={form.start} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs" /></label><label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">End<input type="time" required value={form.end} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs" /></label><label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Status<span className="mt-2 block"><Select value={form.status} onChange={(status) => setForm((current) => ({ ...current, status }))} options={AVAILABILITY_OPTIONS} fullWidth /></span></label><label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Label<input value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} placeholder="Optional note" className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs normal-case tracking-normal" /></label></div>{error && <p className="mt-3 text-[10px] text-red-600">{error}</p>}<button disabled={saving} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-navy px-4 text-[10px] font-bold text-white"><Plus className="h-3.5 w-3.5" /> Add time rule</button></form><div className="mt-5"><h3 className="text-xs font-bold text-navy">Rules for this day</h3><div className="mt-3 space-y-2">{slots.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">No rules added yet.</p>}{slots.map((slot) => <div key={slot._id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><div><p className={`text-[10px] font-bold ${slot.status === "Available" ? "text-emerald-700" : "text-slate-600"}`}>{slot.status}</p><p className="mt-1 text-[10px] text-slate-500">{singaporeTime(slot.startAt)} – {singaporeTime(slot.endAt)}{slot.label ? ` · ${slot.label}` : ""}</p></div><button aria-label="Delete availability rule" onClick={() => remove(slot._id)} className="grid h-8 w-8 place-items-center rounded-lg border border-red-100 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div></div><div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[10px] leading-5 text-blue-700">Availability is maintained manually. Booked interviews are checked against these rules and against other scheduled interviews.</div></div></div></div>;
}
