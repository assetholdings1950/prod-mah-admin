"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, MapPin, Search, Users } from "lucide-react";
import { HiringApplication, hiringApi } from "@/lib/hiringApi";

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default function HiringApplicationsPage() {
    const [applications, setApplications] = useState<HiringApplication[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError("");
            try {
                setApplications(await hiringApi.applications({ limit: 100, ...(search.trim() ? { search: search.trim() } : {}) }));
            } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : "Could not load applications.");
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => window.clearTimeout(timer);
    }, [search]);

    const countLabel = useMemo(() => `${applications.length} application${applications.length === 1 ? "" : "s"}`, [applications.length]);

    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-8">
            <header className="border-b border-border pb-5">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400"><Users className="h-3.5 w-3.5 text-navy" /> Hiring</div>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy">Applications</h1>
                <p className="mt-1 text-xs text-slate-500">Live candidate records from the hiring API · {countLabel}</p>
            </header>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search candidates, email, role, or application ID" className="min-w-0 flex-1 bg-transparent text-xs text-navy outline-none placeholder:text-slate-400" />
                {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            </div>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="hidden grid-cols-[minmax(220px,1.2fr)_minmax(190px,1fr)_120px_130px_110px_40px] gap-4 border-b border-slate-200 bg-slate-50/60 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:grid">
                    <span>Candidate</span><span>Role</span><span>Experience</span><span>Received</span><span>Stage</span><span />
                </div>
                {!loading && applications.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">No applications match this search.</div>
                ) : applications.map((candidate, index) => (
                    <Link key={candidate._id} href={`/applications/${encodeURIComponent(candidate.reference)}`} className={`group grid gap-3 px-5 py-4 transition-colors hover:bg-blue-50/40 lg:grid-cols-[minmax(220px,1.2fr)_minmax(190px,1fr)_120px_130px_110px_40px] lg:items-center lg:gap-4 ${index > 0 ? "border-t border-slate-100" : ""}`}>
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-navy">{candidate.firstName[0]}{candidate.lastName[0]}</div>
                            <div className="min-w-0"><p className="truncate text-xs font-bold text-navy">{candidate.firstName} {candidate.lastName}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{candidate.reference}</p></div>
                        </div>
                        <div><p className="text-xs font-semibold text-slate-600">{candidate.jobSnapshot.title}</p><p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-slate-400"><MapPin className="h-3 w-3" />{candidate.city}, {candidate.country}</p></div>
                        <span className="text-xs text-slate-600">{candidate.yearsOfExperience} years</span>
                        <span className="text-xs text-slate-600">{formatDate(candidate.submittedAt)}</span>
                        <span className="w-fit rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{candidate.stage}</span>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                    </Link>
                ))}
            </section>
        </div>
    );
}
