"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileSignature, Loader2, RefreshCw, ShieldAlert, Trash2, XCircle } from "lucide-react";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

type AccountForm = {
    _id: string; version: string; legalName: string; signatureUrl?: string; signatureDataUrl?: string;
    status: "pending" | "approved" | "rejected"; adminRemarks?: string;
    submittedAt: string; reviewedAt?: string | null;
    declaration: Record<string, string>;
    clientSnapshot: Record<string, string | undefined>;
};

const LABELS: Record<string, string> = {
    employmentStatus: "Employment status", occupation: "Occupation", employerName: "Employer / business",
    annualIncome: "Annual income", sourceOfFunds: "Source of funds", estimatedNetWorth: "Estimated net worth",
    investmentObjective: "Investment objective", investmentExperience: "Investment experience",
    taxResidency: "Tax residency", taxIdentificationNumber: "Tax identification number",
    politicallyExposed: "Politically exposed", usPerson: "US person", beneficialOwner: "Beneficial owner",
};

function DataItem({ label, value }: { label: string; value?: string | null }) {
    return <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 break-words text-[13px] font-semibold text-slate-700">{value || "—"}</p></div>;
}

export default function AccountFormTab({ clientId }: { clientId: string }) {
    const [form, setForm] = useState<AccountForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [remarks, setRemarks] = useState("");

    const load = useCallback(async (notify = false) => {
        setLoading(true);
        try {
            const response = await appClient.get(`/api/account-forms/client?clientId=${clientId}`);
            const next = response.data?.data ?? null;
            setForm(next);
            setRemarks(next?.adminRemarks ?? "");
            if (notify) toastSuccess("Account form refreshed.");
        } catch { toastError("Failed to load the account form."); }
        finally { setLoading(false); }
    }, [clientId]);

    useEffect(() => { void load(); }, [load]);

    const act = async (status: "approved" | "rejected") => {
        if (!form) return;
        if (status === "rejected" && !remarks.trim()) { toastError("Add remarks before rejecting the form."); return; }
        setActing(true);
        try {
            const response = await appClient.patch(`/api/account-forms/status?id=${form._id}`, { status, remarks: remarks.trim() });
            setForm(response.data?.data ?? form);
            toastSuccess(`Account form ${status}. Client notification sent.`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toastError(err.response?.data?.message ?? "Failed to update account form.");
        } finally { setActing(false); }
    };

    const remove = async () => {
        if (!form || !window.confirm("Delete this client's account form? Withdrawal eligibility will be revoked immediately.")) return;
        setActing(true);
        try {
            await appClient.delete(`/api/account-forms/delete?id=${form._id}`);
            setForm(null);
            setRemarks("");
            toastSuccess("Account form deleted. Client notification sent.");
        } catch { toastError("Failed to delete the account form."); }
        finally { setActing(false); }
    };

    if (loading) return <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading account form…</div>;
    if (!form) return <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center"><FileSignature className="h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">No account form submitted</p><p className="mt-1 text-xs text-slate-400">This client has not submitted an account opening declaration.</p><button onClick={() => void load(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"><RefreshCw size={13} /> Refresh</button></div>;

    const statusClass = form.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : form.status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200";
    return <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center">
            <div><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Account opening declaration</p><p className="mt-1 text-sm font-semibold text-slate-800">Submitted {new Date(form.submittedAt).toLocaleString()}</p></div>
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto"><span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${statusClass}`}>{form.status}</span><button onClick={() => void load(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"><RefreshCw size={13} /> Refresh</button></div>
        </div>
        <section><p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Client snapshot at submission</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><DataItem label="Legal name" value={form.legalName} /><DataItem label="Email" value={form.clientSnapshot.email} /><DataItem label="Phone" value={`${form.clientSnapshot.countryCode || ""} ${form.clientSnapshot.phoneNumber || ""}`.trim()} /><DataItem label="Country" value={form.clientSnapshot.country} /><DataItem label="City" value={form.clientSnapshot.city} /><DataItem label="Postal code" value={form.clientSnapshot.postalCode} /><div className="sm:col-span-2 lg:col-span-3"><DataItem label="Street address" value={form.clientSnapshot.address} /></div></div></section>
        <section><p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Financial and regulatory declaration</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(form.declaration).map(([key, value]) => <DataItem key={key} label={LABELS[key] ?? key} value={value} />)}</div></section>
        <section><p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Electronic signature</p><div className="rounded-xl border border-slate-200 bg-white p-4"><img src={form.signatureUrl ?? form.signatureDataUrl} alt={`Signature of ${form.legalName}`} className="h-32 max-w-full object-contain" /><p className="mt-2 text-xs font-semibold text-slate-500">Signed by {form.legalName} · Document {form.version}</p></div></section>
        <section className="rounded-xl border border-slate-200 p-4"><label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Administrator remarks</label><textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} placeholder="Required when rejecting; optional when approving" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" /><div className="mt-4 flex flex-wrap gap-2"><button disabled={acting} onClick={() => void act("approved")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} /> Approve</button><button disabled={acting} onClick={() => void act("rejected")} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><XCircle size={15} /> Reject</button><button disabled={acting} onClick={() => void remove()} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 disabled:opacity-50"><Trash2 size={15} /> Delete form</button></div><p className="mt-3 flex items-center gap-2 text-[11px] text-slate-400"><ShieldAlert size={13} /> Every action sends an email notification to the client.</p></section>
    </div>;
}
