"use client";

import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import { CommissionTierPolicyOption } from "@/components/agents/AccountTab";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { Loader2, Plus, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type DraftPolicy = CommissionTierPolicyOption & { description?: string };

const blankPolicy = { name: "", commissionRate: 0, description: "", isDefault: false, active: true };

export default function CommissionPoliciesPage() {
    const [policies, setPolicies] = useState<DraftPolicy[]>([]);
    const [draft, setDraft] = useState(blankPolicy);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    const loadPolicies = useCallback(async () => {
        setLoading(true);
        try {
            const response = await appClient.get("/api/commission-tier-policies");
            setPolicies(response.data?.policies ?? []);
        } catch {
            toastError("Could not load commission tier policies.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPolicies(); }, [loadPolicies]);

    const createPolicy = async () => {
        if (!draft.name.trim()) return toastError("Enter a policy name.");
        setSavingId("new");
        try {
            await appClient.post("/api/commission-tier-policies", draft);
            setDraft(blankPolicy);
            await loadPolicies();
            toastSuccess("Commission tier policy created.");
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toastError(message || "Could not create the policy.");
        } finally {
            setSavingId(null);
        }
    };

    const updateDraft = (id: string, field: keyof DraftPolicy, value: string | number | boolean) =>
        setPolicies((current) => current.map((policy) => policy._id === id ? { ...policy, [field]: value } : policy));

    const savePolicy = async (policy: DraftPolicy) => {
        setSavingId(policy._id);
        try {
            await appClient.patch(`/api/commission-tier-policies/${policy._id}`, {
                name: policy.name,
                commissionRate: Number(policy.commissionRate),
                description: policy.description || "",
                active: policy.active,
                isDefault: policy.isDefault,
            });
            await loadPolicies();
            toastSuccess("Commission tier policy updated.");
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toastError(message || "Could not update the policy.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="w-full space-y-6 p-1 text-foreground">
            <WorksSpaceHeader
                isButtonVisible={false}
                heading="Commission Tier Policies"
                subHeading="Create reusable commission rates, then assign one policy to each agent. Policy changes apply only to future completed investments."
            />

            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800">Create policy</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_.5fr_1.8fr_auto] md:items-end">
                    <label className="text-xs font-medium text-slate-500">Name
                        <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Growth Partner" />
                    </label>
                    <label className="text-xs font-medium text-slate-500">Rate (%)
                        <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" type="number" min="0" max="100" step="0.1" value={draft.commissionRate} onChange={(e) => setDraft({ ...draft, commissionRate: Number(e.target.value) })} />
                    </label>
                    <label className="text-xs font-medium text-slate-500">Description
                        <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Optional internal note" />
                    </label>
                    <button onClick={createPolicy} disabled={savingId === "new"} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">
                        {savingId === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
                    </button>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-800">Available policies</h2></div>
                {loading ? <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Policy</th><th className="px-5 py-3">Rate</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Default</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
                            <tbody>{policies.map((policy) => <tr key={policy._id} className="border-t border-slate-100">
                                <td className="px-5 py-3"><input className="w-full rounded border border-slate-200 px-2 py-1.5" value={policy.name} onChange={(e) => updateDraft(policy._id, "name", e.target.value)} /><p className="mt-1 text-[10px] text-slate-400">{policy.slug}</p></td>
                                <td className="px-5 py-3"><input className="w-24 rounded border border-slate-200 px-2 py-1.5" type="number" min="0" max="100" step="0.1" value={policy.commissionRate} onChange={(e) => updateDraft(policy._id, "commissionRate", Number(e.target.value))} /></td>
                                <td className="px-5 py-3"><input className="w-full rounded border border-slate-200 px-2 py-1.5" value={policy.description || ""} onChange={(e) => updateDraft(policy._id, "description", e.target.value)} /></td>
                                <td className="px-5 py-3"><label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={policy.active} onChange={(e) => updateDraft(policy._id, "active", e.target.checked)} /> Active</label></td>
                                <td className="px-5 py-3"><label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={policy.isDefault} onChange={(e) => updateDraft(policy._id, "isDefault", e.target.checked)} /> Default</label></td>
                                <td className="px-5 py-3 text-right"><button onClick={() => savePolicy(policy)} disabled={savingId === policy._id} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{savingId === policy._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button></td>
                            </tr>)}</tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
