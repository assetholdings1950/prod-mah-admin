"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Loader2, Plus, RefreshCw, ReceiptText } from "lucide-react";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

type SalaryPayment = {
    _id: string;
    amount: number;
    currency: string;
    description?: string;
    createdAt: string;
    metadata?: { payrollReference?: string | null };
    createdBy?: { fullName?: string; firstName?: string; lastName?: string; email?: string } | null;
};

export function SalaryPaymentsTab({ agentId, onCredited }: { agentId: string; onCredited: () => Promise<void> | void }) {
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [payrollReference, setPayrollReference] = useState("");
    const [payments, setPayments] = useState<SalaryPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const loadPayments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await appClient.get(`/api/agents/salary-payments?agentId=${encodeURIComponent(agentId)}&page=1&limit=20`);
            setPayments(response.data?.data?.docs ?? []);
        } catch {
            toastError("Failed to load salary payment history.");
        } finally {
            setLoading(false);
        }
    }, [agentId]);

    useEffect(() => { loadPayments(); }, [loadPayments]);

    const creditSalary = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            toastError("Enter a valid salary amount greater than USD 0.00.");
            return;
        }
        setSubmitting(true);
        try {
            const response = await appClient.post(`/api/agents/salary-payments?agentId=${encodeURIComponent(agentId)}`, {
                amount: parsedAmount,
                note: note.trim() || undefined,
                payrollReference: payrollReference.trim() || undefined,
            });
            if (!response.data?.status) throw new Error(response.data?.message || "Salary could not be credited.");
            setAmount(""); setNote(""); setPayrollReference("");
            await Promise.all([loadPayments(), onCredited()]);
            toastSuccess("Salary credited and recorded in the agent wallet.");
        } catch (error) {
            toastError(error instanceof Error ? error.message : "Salary could not be credited.");
        } finally {
            setSubmitting(false);
        }
    };

    return <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={creditSalary} className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5">
            <div className="flex items-center gap-3"><span className="rounded-xl border border-violet-100 bg-white p-2.5 text-violet-600"><DollarSign size={18} /></span><div><h3 className="text-sm font-bold text-slate-800">Credit salary</h3><p className="mt-0.5 text-[11px] text-slate-500">Credits the agent’s USD wallet and creates an immutable salary transaction.</p></div></div>
            <div className="mt-5 space-y-4">
                <label className="block"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount (USD)</span><div className="relative mt-1.5"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span><input required min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm font-semibold text-slate-800 outline-none focus:border-violet-400" /></div></label>
                <label className="block"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Payroll reference <em className="normal-case font-normal">optional</em></span><input maxLength={100} value={payrollReference} onChange={(event) => setPayrollReference(event.target.value)} placeholder="e.g. SEP-2026-PAYROLL" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-400" /></label>
                <label className="block"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Salary note <em className="normal-case font-normal">optional</em></span><textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Monthly salary, adjustment, or payroll note" rows={3} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-400" /></label>
                <button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60">{submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Credit salary in USD</button>
            </div>
        </form>
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-800">Salary payment history</h3><p className="mt-0.5 text-[11px] text-slate-400">Manual USD salary credits only. Commission is tracked separately.</p></div><button onClick={loadPayments} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button></div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">{loading ? <div className="flex justify-center p-10"><Loader2 size={18} className="animate-spin text-slate-400" /></div> : !payments.length ? <div className="p-10 text-center"><ReceiptText size={22} className="mx-auto text-slate-300" /><p className="mt-2 text-xs font-semibold text-slate-600">No salary payments recorded</p></div> : <table className="w-full text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400"><tr><th className="px-3 py-2.5">Date</th><th className="px-3 py-2.5">Reference / note</th><th className="px-3 py-2.5 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{payments.map((payment) => <tr key={payment._id}><td className="px-3 py-3 text-[11px] text-slate-500">{new Date(payment.createdAt).toLocaleString()}</td><td className="px-3 py-3"><p className="text-xs font-semibold text-slate-700">{payment.metadata?.payrollReference || "Manual salary credit"}</p><p className="mt-0.5 max-w-[230px] truncate text-[10px] text-slate-400">{payment.description || "—"}</p></td><td className="px-3 py-3 text-right text-xs font-bold text-emerald-600">+ USD {payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td></tr>)}</tbody></table>}</div>
        </section>
    </div>;
}
