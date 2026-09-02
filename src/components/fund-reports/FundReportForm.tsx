"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    CheckCircle2,
    Copy,
    FileUp,
    GripVertical,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";
import Select from "@/components/common/Select";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess, toastWarning } from "@/utils/toast-message/taost-message";
import { createReportId, FundReportRecord, FundReportStatus, getFundReport, saveFundReport } from "./fundReportStore";

type ActivityPeriod = {
    id: string;
    label: string;
    days: number;
    from: string;
    to: string;
    clients: number;
    capital: number;
};

type Allocation = {
    id: string;
    name: string;
    percentage: number;
    description: string;
};

type ProfitPeriod = {
    id: string;
    label: string;
    days: number;
    from: string;
    to: string;
    profit: number;
    returnPercentage: number;
    feeBasis: "gross" | "net";
    profitType: "realized" | "unrealized" | "combined";
};

const uid = () => Math.random().toString(36).slice(2, 10);
const today = "2026-08-13";

const INITIAL_ACTIVITY: ActivityPeriod[] = [
    { id: uid(), label: "Last 24 hours", days: 1, from: "2026-08-12", to: today, clients: 12, capital: 132400 },
    { id: uid(), label: "Last 7 days", days: 7, from: "2026-08-06", to: today, clients: 76, capital: 1420000 },
    { id: uid(), label: "Last 30 days", days: 30, from: "2026-07-15", to: today, clients: 182, capital: 4850000 },
];

const INITIAL_ALLOCATIONS: Allocation[] = [
    { id: uid(), name: "Blockchain Infrastructure", percentage: 10, description: "Core infrastructure" },
    { id: uid(), name: "Global Equities", percentage: 45, description: "Public equity markets" },
    { id: uid(), name: "Sustainable Infrastructure", percentage: 25, description: "Energy, water and mobility" },
    { id: uid(), name: "Fixed Income", percentage: 20, description: "Investment-grade bonds" },
];

const INITIAL_PROFITS: ProfitPeriod[] = [
    { id: uid(), label: "Last 24 hours", days: 1, from: "2026-08-12", to: today, profit: 8240, returnPercentage: 0.58, feeBasis: "net", profitType: "realized" },
    { id: uid(), label: "Last 7 days", days: 7, from: "2026-08-06", to: today, profit: 54600, returnPercentage: 3.85, feeBasis: "net", profitType: "realized" },
    { id: uid(), label: "Last 30 days", days: 30, from: "2026-07-15", to: today, profit: 132400, returnPercentage: 9.32, feeBasis: "net", profitType: "combined" },
];

type FundOption = { value: string; label: string };

type InvestmentPlanSummary = {
    _id?: string;
    slug?: string;
    name?: string;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const numeric = (value: string) => Number(value.replace(/[^0-9.-]/g, "")) || 0;

const fieldClass = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-navy outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400";
const labelClass = "mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500";

function SectionTitle({ number, title, id }: { number: number; title: string; id: string }) {
    return (
        <div id={id} className="flex scroll-mt-6 items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{number}</span>
            <h2 className="text-[20px] font-semibold tracking-normal text-navy">{title}</h2>
        </div>
    );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return <button type="button" aria-label={label} title={label} onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-navy">{children}</button>;
}

export default function FundReportForm({ reportId }: { reportId?: string }) {
    const router = useRouter();
    const recordId = useRef(reportId ?? createReportId());
    const createdAt = useRef(new Date().toISOString());
    const [reportStatus, setReportStatus] = useState<FundReportStatus>("draft");
    const [fundOptions, setFundOptions] = useState<FundOption[]>([]);
    const [fundsLoading, setFundsLoading] = useState(true);
    const [fund, setFund] = useState("");
    const [title, setTitle] = useState("");
    const [reportDate, setReportDate] = useState(today);
    const [reportTime, setReportTime] = useState("16:30");
    const [timezone, setTimezone] = useState("sgt");
    const [currencyCode, setCurrencyCode] = useState("usd");
    const [summary, setSummary] = useState("<p>Strong net capital inflows continued this week, led by allocations to global equities and sustainable infrastructure.</p>");
    const [internalNotes, setInternalNotes] = useState("");
    const [activity, setActivity] = useState(INITIAL_ACTIVITY);
    const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);
    const [profits, setProfits] = useState(INITIAL_PROFITS);
    const [allocationSource, setAllocationSource] = useState(INITIAL_ACTIVITY[1].id);
    const [sourceReference, setSourceReference] = useState("Custody & fund admin — Merlion Fund Services");
    const [methodology, setMethodology] = useState("<p>Returns are time-weighted (TWR) based on daily NAVs.</p><p>Net returns after all fees and expenses. All amounts are in USD.</p>");
    const [feeBasis, setFeeBasis] = useState("net");
    const [reviewer, setReviewer] = useState("alice");
    const [disclosure, setDisclosure] = useState("standard-v21");
    const [showPublicly, setShowPublicly] = useState(true);
    const [publishDate, setPublishDate] = useState(today);
    const [publishTime, setPublishTime] = useState("18:00");
    const [revisionReason, setRevisionReason] = useState("scheduled");
    const [privacyThreshold, setPrivacyThreshold] = useState("standard");
    const [checks, setChecks] = useState([false, false, false, false]);
    const [evidence, setEvidence] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!reportId) return;
        let active = true;
        queueMicrotask(async () => {
            if (!active) return;
            try {
                const report = await getFundReport(reportId);
                if (!active) return;
                createdAt.current = report.createdAt;
                setReportStatus(report.status);
                setFund(report.fundId);
                setTitle(report.title);
                setReportDate(report.reportDate);
                setReportTime(report.reportTime);
                setTimezone(report.timezone);
                setCurrencyCode(report.currencyCode);
                setSummary(report.summary);
                setInternalNotes(report.internalNotes);
                setActivity(report.activity as ActivityPeriod[]);
                setAllocations(report.allocations as Allocation[]);
                setProfits(report.profits as ProfitPeriod[]);
                setAllocationSource(report.allocationSource);
                setSourceReference(report.sourceReference);
                setMethodology(report.methodology);
                setFeeBasis(report.feeBasis);
                setReviewer(report.reviewer);
                setDisclosure(report.disclosure);
                setShowPublicly(report.showPublicly);
                setPublishDate(report.publishDate);
                setPublishTime(report.publishTime);
                setRevisionReason(report.revisionReason);
                setPrivacyThreshold(report.privacyThreshold);
                setChecks(report.checks);
            } catch {
                toastError("Fund report was not found.");
                router.replace("/fund-reports");
            }
        });
        return () => { active = false; };
    }, [reportId, router]);

    useEffect(() => {
        let active = true;

        const loadFunds = async () => {
            try {
                const response = await appClient.get("/api/investment-plans/get", {
                    params: { page: 1, limit: 100 },
                });
                const payload = response.data?.data ?? response.data?.plans ?? response.data?.investmentPlans;
                const plans: InvestmentPlanSummary[] = Array.isArray(payload) ? payload : payload?.docs ?? [];
                const seen = new Set<string>();
                const options = plans.reduce<FundOption[]>((items, plan) => {
                    const value = plan._id ?? plan.slug;
                    const label = plan.name?.trim();
                    if (!value || !label || seen.has(value)) return items;
                    seen.add(value);
                    items.push({ value, label });
                    return items;
                }, []);

                if (!active) return;
                setFundOptions(options);
                if (options.length > 0) {
                    setFund((current) => current && options.some((option) => option.value === current) ? current : options[0].value);
                    setTitle((current) => current || `${options[0].label} — Weekly Report`);
                }
            } catch {
                if (active) toastError("Unable to load the fund list. Please try again.");
            } finally {
                if (active) setFundsLoading(false);
            }
        };

        void loadFunds();
        return () => { active = false; };
    }, []);

    const changeFund = (value: string) => {
        const selectedFund = fundOptions.find((option) => option.value === value);
        setFund(value);
        if (selectedFund) setTitle(`${selectedFund.label} — Weekly Report`);
    };

    const sourcePeriod = activity.find((item) => item.id === allocationSource) ?? activity[0] ?? {
        id: "none",
        label: "No source period",
        clients: 0,
        capital: 0,
    };
    const allocationTotal = allocations.reduce((total, row) => total + row.percentage, 0);
    const allocationAmount = allocations.reduce((total, row) => total + sourcePeriod.capital * row.percentage / 100, 0);
    const updateActivity = (id: string, patch: Partial<ActivityPeriod>) => setActivity((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
    const updateAllocation = (id: string, patch: Partial<Allocation>) => setAllocations((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));
    const updateProfit = (id: string, patch: Partial<ProfitPeriod>) => setProfits((rows) => rows.map((row) => row.id === id ? { ...row, ...patch } : row));

    const addActivity = () => setActivity((rows) => [...rows, { id: uid(), label: "Custom period", days: 60, from: "2026-06-15", to: today, clients: 0, capital: 0 }]);
    const addAllocation = () => setAllocations((rows) => [...rows, { id: uid(), name: "", percentage: 0, description: "" }]);
    const addProfit = () => setProfits((rows) => [...rows, { id: uid(), label: "Custom period", days: 60, from: "2026-06-15", to: today, profit: 0, returnPercentage: 0, feeBasis: "net", profitType: "combined" }]);

    const buildRecord = (status: FundReportStatus): FundReportRecord => ({
        id: recordId.current,
        fundId: fund,
        fundName: fundOptions.find((option) => option.value === fund)?.label ?? "Fund",
        title: title.trim() || "Untitled fund report",
        status,
        reportDate,
        reportTime,
        timezone,
        currencyCode,
        summary,
        internalNotes,
        activity,
        allocations,
        profits,
        allocationSource,
        sourceReference,
        methodology,
        feeBasis,
        reviewer,
        disclosure,
        showPublicly: status === "published",
        publishDate,
        publishTime,
        revisionReason,
        privacyThreshold,
        checks,
        createdAt: createdAt.current,
        updatedAt: new Date().toISOString(),
    });

    const persist = async (status: FundReportStatus) => {
        setSaving(true);
        try {
            const saved = await saveFundReport(buildRecord(status));
            recordId.current = saved.id;
            createdAt.current = saved.createdAt;
            setReportStatus(status);
            toastSuccess(status === "published" ? "Fund report published and visible to clients." : "Fund report saved as draft.");
            router.push(`/fund-reports?status=${status}`);
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Unable to save the fund report.");
        } finally {
            setSaving(false);
        }
    };

    const saveDraft = () => {
        void persist("draft");
    };

    const validate = () => {
        if (Math.abs(allocationTotal - 100) > 0.001) { toastError(`Capital allocation must total 100%. It currently totals ${allocationTotal}%.`); return false; }
        if (!title.trim()) { toastError("Report title is required."); return false; }
        if (!sourceReference.trim()) { toastError("A source reference is required."); return false; }
        if (!methodology.replace(/<[^>]*>/g, "").trim()) { toastError("Calculation methodology is required."); return false; }
        return true;
    };

    const publishReport = () => {
        if (!validate()) return;
        if (!checks.every(Boolean)) { toastWarning("Complete every publication confirmation before publishing the report."); return; }
        void persist("published");
    };

    return (
        <div className="mx-auto w-full max-w-[1600px] pb-24 text-navy">
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">Investment management</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-normal">{reportId ? "Edit Fund Report" : "Create Fund Report"}</h1>
                    <p className="mt-1 text-xs text-slate-500">Manage investment activity, allocation, profit and publication details.</p>
                </div>
                <div className="grid w-full grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(220px,1.6fr)_minmax(150px,0.9fr)_minmax(170px,1fr)_auto] xl:w-auto">
                    <div><span className={labelClass}>Fund</span><Select value={fund} onChange={changeFund} options={fundOptions} placeholder={fundsLoading ? "Loading funds…" : "Select fund"} disabled={fundsLoading || fundOptions.length === 0} fullWidth size="sm" /></div>
                    <label><span className={labelClass}>Report date</span><input type="date" value={reportDate} max={today} onChange={(e) => setReportDate(e.target.value)} className={fieldClass} /></label>
                    <div><span className={labelClass}>Timezone</span><Select value={timezone} onChange={setTimezone} options={[{ value: "sgt", label: "SGT (UTC+8)" }, { value: "utc", label: "UTC" }]} fullWidth size="sm" /></div>
                    <div><span className={labelClass}>Status</span><span className={`inline-flex h-9 w-full items-center justify-center rounded-lg border px-4 text-xs font-bold capitalize sm:w-auto ${reportStatus === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{reportStatus}</span></div>
                </div>
            </div>

            <div className="grid items-start gap-4">
                <div className="space-y-4">
                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                        <SectionTitle number={1} title="Report overview" id="overview" />
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(220px,1fr)]">
                                    <label><span className={labelClass}>Report title *</span><input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} /></label>
                                    <div><span className={labelClass}>Fund *</span><Select value={fund} onChange={changeFund} options={fundOptions} placeholder={fundsLoading ? "Loading funds…" : "Select fund"} disabled={fundsLoading || fundOptions.length === 0} fullWidth size="sm" /></div>
                                </div>
                                <RichTextEditor label="Public summary *" value={summary} onChange={setSummary} minHeight="92px" placeholder="Summarise this report for clients…" />
                            </div>
                            <div className="grid content-start grid-cols-2 gap-3">
                                <label><span className={labelClass}>As-of date *</span><input type="date" value={reportDate} max={today} onChange={(e) => setReportDate(e.target.value)} className={fieldClass} /></label>
                                <label><span className={labelClass}>As-of time *</span><input type="time" value={reportTime} onChange={(e) => setReportTime(e.target.value)} className={fieldClass} /></label>
                                <div><span className={labelClass}>Currency *</span><Select value={currencyCode} onChange={setCurrencyCode} options={[{ value: "usd", label: "USD" }]} fullWidth size="sm" /></div>
                                <label className="col-span-2"><span className={labelClass}>Internal notes</span><textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className="min-h-20 w-full resize-y rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" placeholder="Not visible to clients…" /></label>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                            <SectionTitle number={2} title="Client investment activity" id="activity" />
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full min-w-[640px] text-left text-[11px]">
                                    <thead><tr className="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-400"><th className="pb-2">Period</th><th className="pb-2">Days</th><th className="pb-2">From</th><th className="pb-2">To</th><th className="pb-2">Clients</th><th className="pb-2">Capital received</th><th /></tr></thead>
                                    <tbody>{activity.map((row) => <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                        <td className="py-2 pr-2"><input value={row.label} onChange={(e) => updateActivity(row.id, { label: e.target.value })} className={`${fieldClass} min-w-28`} /></td>
                                        <td className="py-2 pr-2"><input type="number" min="1" value={row.days} onChange={(e) => updateActivity(row.id, { days: numeric(e.target.value) })} className={`${fieldClass} w-16`} /></td>
                                        <td className="py-2 pr-2"><input type="date" value={row.from} onChange={(e) => updateActivity(row.id, { from: e.target.value })} className={`${fieldClass} w-32`} /></td>
                                        <td className="py-2 pr-2"><input type="date" value={row.to} max={today} onChange={(e) => updateActivity(row.id, { to: e.target.value })} className={`${fieldClass} w-32`} /></td>
                                        <td className="py-2 pr-2"><input type="number" min="0" value={row.clients} onChange={(e) => updateActivity(row.id, { clients: numeric(e.target.value) })} className={`${fieldClass} w-20`} /></td>
                                        <td className="py-2 pr-2"><input inputMode="decimal" value={row.capital} onChange={(e) => updateActivity(row.id, { capital: numeric(e.target.value) })} className={`${fieldClass} w-28`} /></td>
                                        <td className="py-2"><div className="flex"><IconButton label="Duplicate period" onClick={() => setActivity((rows) => [...rows, { ...row, id: uid(), label: `${row.label} copy` }])}><Copy size={13} /></IconButton><IconButton label="Delete period" onClick={() => setActivity((rows) => rows.filter((item) => item.id !== row.id))}><Trash2 size={13} /></IconButton></div></td>
                                    </tr>)}</tbody>
                                </table>
                            </div>
                            <button type="button" onClick={addActivity} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-[11px] font-bold text-blue-600 hover:bg-blue-50"><Plus size={13} /> Add period</button>
                        </section>

                        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <SectionTitle number={3} title="Where we invest" id="allocation" />
                                <div className="min-w-52"><Select value={allocationSource} onChange={setAllocationSource} options={activity.map((row) => ({ value: row.id, label: `${row.label} · ${currency.format(row.capital)}` }))} fullWidth size="sm" /></div>
                            </div>
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full min-w-[610px] text-left text-[11px]">
                                    <thead><tr className="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-400"><th /><th className="pb-2">Investment area</th><th className="pb-2">%</th><th className="pb-2">Calculated USD</th><th className="pb-2">Description</th><th /></tr></thead>
                                    <tbody>{allocations.map((row) => <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                        <td className="py-2 text-slate-300"><GripVertical size={14} /></td>
                                        <td className="py-2 pr-2"><input value={row.name} onChange={(e) => updateAllocation(row.id, { name: e.target.value })} className={`${fieldClass} min-w-36`} placeholder="Investment area" /></td>
                                        <td className="py-2 pr-2"><input type="number" min="0" max="100" step="0.01" value={row.percentage} onChange={(e) => updateAllocation(row.id, { percentage: numeric(e.target.value) })} className={`${fieldClass} w-16`} /></td>
                                        <td className="py-2 pr-2"><input disabled value={currency.format(sourcePeriod.capital * row.percentage / 100)} className={`${fieldClass} w-28`} /></td>
                                        <td className="py-2 pr-2"><input value={row.description} onChange={(e) => updateAllocation(row.id, { description: e.target.value })} className={`${fieldClass} min-w-36`} placeholder="Public description" /></td>
                                        <td className="py-2"><IconButton label="Delete allocation" onClick={() => setAllocations((rows) => rows.filter((item) => item.id !== row.id))}><Trash2 size={13} /></IconButton></td>
                                    </tr>)}</tbody>
                                </table>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <button type="button" onClick={addAllocation} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-[11px] font-bold text-blue-600 hover:bg-blue-50"><Plus size={13} /> Add investment area</button>
                                <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold ${allocationTotal === 100 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}><CheckCircle2 size={14} /> {allocationTotal}% allocated · {currency.format(allocationAmount)} accounted for</div>
                            </div>
                        </section>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                            <SectionTitle number={4} title="Profit earned" id="profit" />
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left text-[11px]">
                                    <thead><tr className="border-b border-slate-200 text-[9px] uppercase tracking-wider text-slate-400"><th className="pb-2">Period</th><th className="pb-2">From</th><th className="pb-2">To</th><th className="pb-2">Profit USD</th><th className="pb-2">Return %</th><th className="pb-2">Basis</th><th className="pb-2">Type</th><th /></tr></thead>
                                    <tbody>{profits.map((row) => <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                        <td className="py-2 pr-2"><input value={row.label} onChange={(e) => updateProfit(row.id, { label: e.target.value })} className={`${fieldClass} min-w-28`} /></td>
                                        <td className="py-2 pr-2"><input type="date" value={row.from} onChange={(e) => updateProfit(row.id, { from: e.target.value })} className={`${fieldClass} w-32`} /></td>
                                        <td className="py-2 pr-2"><input type="date" value={row.to} max={today} onChange={(e) => updateProfit(row.id, { to: e.target.value })} className={`${fieldClass} w-32`} /></td>
                                        <td className="py-2 pr-2"><input value={row.profit} onChange={(e) => updateProfit(row.id, { profit: numeric(e.target.value) })} className={`${fieldClass} w-24`} /></td>
                                        <td className="py-2 pr-2"><input type="number" step="0.01" value={row.returnPercentage} onChange={(e) => updateProfit(row.id, { returnPercentage: numeric(e.target.value) })} className={`${fieldClass} w-20`} /></td>
                                        <td className="py-2 pr-2"><select value={row.feeBasis} onChange={(e) => updateProfit(row.id, { feeBasis: e.target.value as ProfitPeriod["feeBasis"] })} className={`${fieldClass} w-20`}><option value="net">Net</option><option value="gross">Gross</option></select></td>
                                        <td className="py-2 pr-2"><select value={row.profitType} onChange={(e) => updateProfit(row.id, { profitType: e.target.value as ProfitPeriod["profitType"] })} className={`${fieldClass} w-28`}><option value="realized">Realized</option><option value="unrealized">Unrealized</option><option value="combined">Combined</option></select></td>
                                        <td className="py-2"><IconButton label="Delete profit period" onClick={() => setProfits((rows) => rows.filter((item) => item.id !== row.id))}><Trash2 size={13} /></IconButton></td>
                                    </tr>)}</tbody>
                                </table>
                            </div>
                            <button type="button" onClick={addProfit} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-[11px] font-bold text-blue-600 hover:bg-blue-50"><Plus size={13} /> Add profit period</button>
                            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-800"><AlertCircle className="mt-0.5 shrink-0" size={13} /> Reported profit requires a calculation basis and supporting source. It must not be presented as guaranteed future performance.</p>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                            <SectionTitle number={5} title="Evidence and methodology" id="evidence" />
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <label><span className={labelClass}>Source reference *</span><input value={sourceReference} onChange={(e) => setSourceReference(e.target.value)} className={fieldClass} /></label>
                                <div><span className={labelClass}>Evidence uploads</span><input ref={fileInput} type="file" multiple accept=".pdf,.csv,.xlsx,.xls" className="hidden" onChange={(e) => setEvidence((current) => [...current, ...Array.from(e.target.files ?? [])])} /><button type="button" onClick={() => fileInput.current?.click()} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/40 text-[11px] font-bold text-blue-600 hover:bg-blue-50"><FileUp size={14} /> Attach files</button></div>
                                <div className="sm:col-span-2"><RichTextEditor label="Calculation methodology *" value={methodology} onChange={setMethodology} minHeight="105px" /></div>
                                <div><span className={labelClass}>Fee basis *</span><Select value={feeBasis} onChange={setFeeBasis} options={[{ value: "net", label: "Net of all fees" }, { value: "gross", label: "Gross before fees" }]} fullWidth size="sm" /></div>
                                <div><span className={labelClass}>Reviewer *</span><Select value={reviewer} onChange={setReviewer} options={[{ value: "alice", label: "Alice Tan — Head of Investments" }, { value: "compliance", label: "Compliance Team" }]} fullWidth size="sm" /></div>
                                <div className="sm:col-span-2"><span className={labelClass}>Disclosure *</span><Select value={disclosure} onChange={setDisclosure} options={[{ value: "standard-v21", label: "Standard performance disclosure (v2.1)" }, { value: "extended-v1", label: "Extended fund disclosure (v1.0)" }]} fullWidth size="sm" /></div>
                            </div>
                            {evidence.length > 0 && <div className="mt-3 space-y-1">{evidence.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[10px] text-slate-600"><FileUp size={12} className="text-blue-600" /><span className="min-w-0 flex-1 truncate">{file.name}</span><button type="button" onClick={() => setEvidence((files) => files.filter((_, i) => i !== index))}><X size={12} /></button></div>)}</div>}
                        </section>
                    </div>

                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
                        <SectionTitle number={6} title="Publication settings" id="publication" />
                        <div className="mt-4 grid gap-4 lg:grid-cols-3">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"><span className="text-xs font-semibold">Show on client fund page</span><button type="button" onClick={() => setShowPublicly((value) => !value)} role="switch" aria-checked={showPublicly} className={`relative h-6 w-11 rounded-full transition ${showPublicly ? "bg-blue-600" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${showPublicly ? "left-[22px]" : "left-0.5"}`} /></button></div>
                                <div className="grid grid-cols-2 gap-2"><label><span className={labelClass}>Publish date</span><input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className={fieldClass} /></label><label><span className={labelClass}>Time</span><input type="time" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} className={fieldClass} /></label></div>
                            </div>
                            <div className="space-y-3"><div><span className={labelClass}>Revision / change reason *</span><Select value={revisionReason} onChange={setRevisionReason} options={[{ value: "scheduled", label: "Regular scheduled report" }, { value: "correction", label: "Correction to published report" }, { value: "methodology", label: "Methodology change" }]} fullWidth size="sm" /></div><div><span className={labelClass}>Privacy threshold *</span><Select value={privacyThreshold} onChange={setPrivacyThreshold} options={[{ value: "standard", label: "Fewer than 5 displays as ‘<5’" }, { value: "ten", label: "Fewer than 10 displays as ‘<10’" }]} fullWidth size="sm" /></div></div>
                            <div><span className={labelClass}>Confirmation checklist *</span><div className="space-y-2">{["All figures are accurate and reconciled", "Methodology and evidence are attached", "Disclosures are reviewed and current", "No confidential client information is included"].map((item, index) => <label key={item} className="flex cursor-pointer items-start gap-2 text-[10px] leading-5 text-slate-600"><input type="checkbox" checked={checks[index]} onChange={() => setChecks((values) => values.map((value, i) => i === index ? !value : value))} className="mt-1 accent-blue-600" />{item}</label>)}</div></div>
                        </div>
                    </section>
                </div>

            </div>

            <div className="sticky bottom-[-12px] z-30 mt-4 flex w-full flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white/95 px-5 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
                <button type="button" onClick={() => router.push("/fund-reports")} className="h-10 rounded-lg border border-slate-200 px-5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="button" disabled={saving} onClick={saveDraft} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-5 text-xs font-bold text-navy hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"><Save size={14} /> {saving ? "Saving…" : "Save draft"}</button>
                <button type="button" disabled={saving} onClick={publishReport} className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy px-5 text-xs font-bold text-white shadow-sm hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle2 size={14} /> {saving ? "Publishing…" : "Publish report"}</button>
            </div>
        </div>
    );
}
