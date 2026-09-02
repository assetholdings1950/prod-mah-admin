"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarClock, CircleAlert, ClipboardCheck, Loader2, PlusCircle, Users } from "lucide-react";
import { HiringDashboard, hiringApi } from "@/lib/hiringApi";

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const formatDateTime = (value: string) => new Intl.DateTimeFormat("en-SG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function HiringDashboardPage() {
    const [dashboard, setDashboard] = useState<HiringDashboard | null>(null);
    const [error, setError] = useState("");
    useEffect(() => { hiringApi.dashboard().then(setDashboard).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not load hiring dashboard.")); }, []);
    if (!dashboard && !error) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
    if (!dashboard) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;

    const metrics = [
        ["Active vacancies", dashboard.metrics.activeVacancies, BriefcaseBusiness, "Published openings"],
        ["Candidates in review", dashboard.metrics.candidatesInReview, Users, "Across all vacancies"],
        ["Interviews this week", dashboard.metrics.interviewsThisWeek, CalendarClock, "Scheduled manually"],
        ["Assessments to review", dashboard.metrics.assessmentsToReview, ClipboardCheck, "Manual marking required"],
        ["Decisions due", dashboard.metrics.decisionsDue, CircleAlert, "Require hiring action"],
    ] as const;

    return <div className="mx-auto w-full max-w-[1480px] space-y-5 pb-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400"><BriefcaseBusiness className="h-3.5 w-3.5 text-navy" />Hiring</div><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy">Hiring Dashboard</h1><p className="mt-1 text-xs text-slate-500">Live vacancy health, candidate progress, and manual actions.</p></div><Link href="/jobs" className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-navy px-4 text-xs font-bold text-white"><PlusCircle className="h-4 w-4" /> Create job opening</Link></header>

        <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-5">{metrics.map(([label, value, Icon, detail], index) => <div key={label} className={`flex items-center justify-between px-5 py-4 ${index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-heading text-3xl font-bold text-navy">{value}</p><p className="mt-0.5 text-[10px] text-slate-400">{detail}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-navy"><Icon className="h-4 w-4" /></div></div>)}</section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-bold text-navy">Vacancy health</h2><p className="text-[10px] text-slate-400">Live progress by active opening</p></div><Link href="/jobs" className="text-[11px] font-bold text-blue-600">View jobs</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Vacancy</th><th>Applications</th><th>In review</th><th>Interviews</th><th>Decision</th><th>Closing</th><th className="px-5 text-right">Action</th></tr></thead><tbody>{dashboard.vacancies.map((item) => <tr key={item._id} className="border-t border-slate-100 text-xs"><td className="px-5 py-4 font-bold text-navy">{item.title}</td><td>{item.applications}</td><td>{item.inReview}</td><td>{item.interviews}</td><td>{item.decisions}</td><td>{formatDate(item.closingDate)}</td><td className="px-5 text-right"><Link href="/applications" className="font-bold text-blue-600">Open workspace</Link></td></tr>)}</tbody></table></div></section>

        <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-navy">Decisions due</h2><Link href="/applications" className="text-[11px] font-bold text-blue-600">All applications</Link></div><div className="mt-4 space-y-2">{dashboard.decisionsDue.length ? dashboard.decisionsDue.map((item) => <Link key={item.reference} href={`/applications/${encodeURIComponent(item.reference)}`} className="group flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50"><div><p className="text-xs font-bold text-navy">{item.candidateName}</p><p className="text-[10px] text-slate-400">{item.role} · {item.stage} · due {formatDate(item.dueAt)}</p></div><ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600" /></Link>) : <p className="text-xs text-slate-400">No decisions are currently due.</p>}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-navy">Upcoming interviews</h2><Link href="/interviews" className="text-[11px] font-bold text-blue-600">Interview calendar</Link></div><div className="mt-4 space-y-2">{dashboard.upcomingInterviews.length ? dashboard.upcomingInterviews.map((item) => <div key={item._id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between"><p className="text-xs font-bold text-navy">{item.candidateName}</p><span className="text-[10px] font-bold text-blue-700">{item.type}</span></div><p className="mt-1 text-[10px] text-slate-400">{formatDateTime(item.startAt)} · {item.mode}</p></div>) : <p className="text-xs text-slate-400">No upcoming interviews.</p>}</div></section></div>
    </div>;
}
