"use client";

import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { ChevronDown, ChevronUp, Download, FileText, Inbox, Loader2, Mail, Search } from "lucide-react";
import { hiringApi, type HiringInterest } from "@/lib/hiringApi";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

const submittedAt = (value: string) =>
    new Intl.DateTimeFormat("en-SG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Singapore",
    }).format(new Date(value));

export default function InterestRequestsList() {
    const [requests, setRequests] = useState<HiringInterest[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, totalDocs: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const downloadResume = async (interest: HiringInterest) => {
        const resumeUrl = interest.resume?.secureUrl;
        if (!resumeUrl) {
            toastError("This request does not have a downloadable resume.");
            return;
        }

        setDownloadingId(interest._id);
        setError("");
        try {
            const response = await fetch(`/api/hiring/interests/${encodeURIComponent(interest._id)}/resume`);
            if (!response.ok) throw new Error("Resume download failed.");
            const source = await response.blob();
            const pdf = new Blob([source], { type: "application/pdf" });
            const objectUrl = URL.createObjectURL(pdf);
            const anchor = document.createElement("a");
            const requestedName = interest.resume.originalFilename || `${interest.reference}-resume.pdf`;
            anchor.href = objectUrl;
            anchor.download = requestedName.toLowerCase().endsWith(".pdf")
                ? requestedName
                : `${requestedName}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
            toastSuccess("Resume downloaded successfully.");
        } catch {
            toastError("Resume download failed. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => window.clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        let active = true;
        hiringApi
            .interests({ page, limit: 20, ...(debouncedSearch ? { search: debouncedSearch } : {}) })
            .then((data) => { if (active) { setRequests(data.items); setPagination(data.pagination); } })
            .catch((requestError: AxiosError<{ message?: string }>) => {
                if (active) setError(requestError.response?.data?.message || "Interest requests could not be loaded.");
            })
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [debouncedSearch, page]);

    const countLabel = useMemo(
        () => `${pagination.totalDocs} ${pagination.totalDocs === 1 ? "request" : "requests"}`,
        [pagination.totalDocs],
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-[#dce5f1] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8798b3]">Talent network</p><p className="mt-1 text-sm font-semibold text-[#0a2149]">{loading ? "Loading requests…" : countLabel}</p></div>
                <label className="relative block w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a2ba]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setLoading(true); setError(""); }} placeholder="Search name, email or reference" className="h-10 w-full rounded-xl border border-[#dce5f1] bg-white pl-10 pr-3 text-sm text-[#0a2149] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" /></label>
            </div>

            {loading ? (
                <div className="flex min-h-64 items-center justify-center rounded-2xl border border-[#dce5f1] bg-white"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
            ) : error ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
            ) : requests.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[#dce5f1] bg-white px-5 text-center"><Inbox className="h-9 w-9 text-[#b7c3d4]" /><h2 className="mt-4 font-serif text-xl text-[#0a2149]">No interest requests found</h2><p className="mt-2 text-sm text-[#71829c]">New general career enquiries will appear here.</p></div>
            ) : (
                <div className="space-y-3">
                    {requests.map((request) => {
                        const isExpanded = expanded === request._id;
                        return (
                            <article key={request._id} className="overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-[0_16px_45px_-40px_rgba(10,33,73,0.7)]">
                                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                                    <div className="flex min-w-0 flex-1 items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Inbox className="h-5 w-5" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">{request.reference}</p><h2 className="mt-1 truncate font-serif text-lg text-[#0a2149]">{request.firstName} {request.lastName}</h2><a href={`mailto:${request.email}`} className="mt-1 inline-flex items-center gap-1.5 truncate text-xs text-[#637590] hover:text-blue-600"><Mail className="h-3.5 w-3.5" />{request.email}</a></div></div>
                                    <div className="text-xs text-[#71829c] lg:text-right"><p className="font-semibold text-[#405574]">Received</p><p className="mt-1">{submittedAt(request.submittedAt)}</p></div>
                                    <div className="flex flex-wrap gap-2 lg:pl-4">
                                        <button type="button" disabled={downloadingId === request._id} onClick={() => void downloadResume(request)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dce5f1] px-3 text-xs font-bold text-[#0a2149] hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-55">{downloadingId === request._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {downloadingId === request._id ? "Downloading…" : "Download PDF"}</button>
                                        <button type="button" onClick={() => setExpanded(isExpanded ? null : request._id)} aria-expanded={isExpanded} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#071d43] px-3 text-xs font-bold text-white hover:bg-blue-700">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} {isExpanded ? "Hide" : "View"} cover letter</button>
                                    </div>
                                </div>
                                {isExpanded && <div className="border-t border-[#e5ebf3] bg-[#f8faff] p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#71829c]"><FileText className="h-4 w-4 text-blue-600" /> Cover letter</div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#405574]">{request.coverLetter}</p></div>}
                            </article>
                        );
                    })}
                    {pagination.totalPages > 1 && <div className="flex items-center justify-between rounded-2xl border border-[#dce5f1] bg-white p-3"><p className="text-xs text-[#71829c]">Page {pagination.page} of {pagination.totalPages}</p><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1 || loading} onClick={() => { setPage((value) => Math.max(value - 1, 1)); setLoading(true); }} className="h-9 rounded-lg border border-[#dce5f1] px-4 text-xs font-bold text-[#0a2149] disabled:opacity-40">Previous</button><button type="button" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => { setPage((value) => Math.min(value + 1, pagination.totalPages)); setLoading(true); }} className="h-9 rounded-lg bg-[#071d43] px-4 text-xs font-bold text-white disabled:opacity-40">Next</button></div></div>}
                </div>
            )}
        </div>
    );
}
