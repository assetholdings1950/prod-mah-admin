"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Edit3, FilePlus2, FileText, Search, Trash2, X } from "lucide-react";
import Select from "@/components/common/Select";
import { deleteFundReports, FundReportRecord, FundReportStatus, getFundReports, saveFundReport } from "./fundReportStore";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

export default function FundReportLibrary() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [reports, setReports] = useState<FundReportRecord[]>([]);
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [status, setStatus] = useState(searchParams.get("status") ?? "all");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [pendingDelete, setPendingDelete] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusCounts, setStatusCounts] = useState({ all: 0, published: 0, draft: 0 });

    const loadReports = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getFundReports({ search: search.trim(), status, limit: 100 });
            setReports(result.items);
            setStatusCounts(result.counts);
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Unable to load fund reports.");
        } finally {
            setLoading(false);
        }
    }, [search, status]);

    useEffect(() => {
        const task = window.setTimeout(() => { void loadReports(); }, 250);
        return () => window.clearTimeout(task);
    }, [loadReports]);
    useEffect(() => {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        if (search.trim()) params.set("search", search.trim());
        router.replace(`/fund-reports${params.size ? `?${params}` : ""}`, { scroll: false });
    }, [router, search, status]);

    const filtered = reports;
    const allSelected = filtered.length > 0 && filtered.every((report) => selected.has(report.id));
    const changeReportStatus = async (report: FundReportRecord, nextStatus: string) => {
        const statusValue = nextStatus as FundReportStatus;
        const updated = { ...report, status: statusValue, showPublicly: statusValue === "published", updatedAt: new Date().toISOString() };
        try {
            const saved = await saveFundReport(updated);
            setReports((items) => items.map((item) => item.id === report.id ? saved : item));
            await loadReports();
            toastSuccess(statusValue === "published" ? "Report published and visible to clients." : "Report moved to draft and hidden from clients.");
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Unable to update report status.");
        }
    };

    const removeReports = async () => {
        try {
            await deleteFundReports(pendingDelete);
            setSelected((items) => new Set([...items].filter((id) => !pendingDelete.includes(id))));
            toastSuccess(`${pendingDelete.length === 1 ? "Report" : `${pendingDelete.length} reports`} deleted.`);
            setPendingDelete([]);
            await loadReports();
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Unable to delete the selected reports.");
        }
    };

    return (
        <div className="mx-auto w-full max-w-[1600px] text-navy">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">Investment management</p><h1 className="mt-1 text-3xl font-semibold">Fund Reports</h1><p className="mt-1 text-xs text-slate-500">Manage client-facing fund activity and performance reports.</p></div>
                <button onClick={() => router.push("/fund-reports/create")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-navy px-4 text-xs font-bold text-white shadow-sm hover:bg-navy/90"><FilePlus2 size={15} /> Create fund report</button>
            </header>

            <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-600"><FileText size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Report library</p><p className="text-sm font-bold">{filtered.length} {filtered.length === 1 ? "report" : "reports"}</p></div></div>
                    <div className="grid gap-2 sm:grid-cols-[minmax(240px,1fr)_auto]">
                        <label className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search report or fund" className="h-[42px] w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-blue-500" /></label>
                        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">{([
                            ["all", "All reports"], ["published", "Published"], ["draft", "Draft"],
                        ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setStatus(value)} className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold transition ${status === value ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-navy"}`}>{label}<span className={`rounded-full px-1.5 py-0.5 text-[9px] ${status === value ? "bg-white/15 text-white" : "bg-white text-slate-400"}`}>{statusCounts[value]}</span></button>)}</div>
                    </div>
                </div>
            </section>

            {filtered.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map((report) => report.id)))} className="h-4 w-4 accent-navy" /> Select all reports</label>
                {selected.size > 0 && <button onClick={() => setPendingDelete([...selected])} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-[11px] font-bold text-red-600 hover:bg-red-50"><Trash2 size={13} /> Delete selected ({selected.size})</button>}
            </div>}

            <div className="mt-4 space-y-3">
                {filtered.map((report) => <article key={report.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3"><input type="checkbox" checked={selected.has(report.id)} onChange={() => setSelected((items) => { const next = new Set(items); if (next.has(report.id)) next.delete(report.id); else next.add(report.id); return next; })} className="mt-1 h-4 w-4 shrink-0 accent-navy" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-semibold">{report.title}</h2><Select value={report.status} onChange={(value) => changeReportStatus(report, value)} options={[{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }]} size="sm" className="min-w-[120px]" /></div><p className="mt-1 text-xs font-semibold text-blue-600">{report.fundName}</p><p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400"><CalendarDays size={12} /> Report date {new Date(`${report.reportDate}T00:00:00`).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })} · Updated {new Date(report.updatedAt).toLocaleString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</p></div></div>
                        <div className="flex shrink-0 gap-2"><button onClick={() => router.push(`/fund-reports/${report.id}/edit`)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold hover:bg-slate-50"><Edit3 size={13} /> Edit</button><button onClick={() => setPendingDelete([report.id])} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-[11px] font-bold text-red-600 hover:bg-red-50"><Trash2 size={13} /> Delete</button></div>
                    </div>
                </article>)}
                {!loading && filtered.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><FileText size={28} className="mx-auto text-slate-300" /><h2 className="mt-3 text-xl font-semibold">No fund reports found</h2><p className="mt-1 text-xs text-slate-500">Create a report or adjust the current search and status filter.</p><button onClick={() => router.push("/fund-reports/create")} className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-navy px-4 text-xs font-bold text-white"><FilePlus2 size={14} /> Create fund report</button></div>}
                {loading && <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center text-xs text-slate-500">Loading fund reports…</div>}
            </div>

            {pendingDelete.length > 0 && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><button onClick={() => setPendingDelete([])} aria-label="Close confirmation" className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><Trash2 size={20} /></div><h2 className="mt-4 text-xl font-semibold">Delete {pendingDelete.length === 1 ? "this report" : `${pendingDelete.length} reports`}?</h2><p className="mt-2 text-xs leading-5 text-slate-500">This removes the selected client-facing trust report data. It does not affect the original fund or the Financial Reports module.</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setPendingDelete([])} className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-bold">Cancel</button><button onClick={removeReports} className="h-9 rounded-lg bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700">Delete</button></div></div></div>}
        </div>
    );
}
