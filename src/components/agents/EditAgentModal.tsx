"use client";

import { IAgents } from "@/interface/agent";
import { Save, X, Loader2 } from "lucide-react";
import Select from "@/components/common/Select";
import { useState } from "react";
import appClient from "@/lib/appClient";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";

interface Props {
    agent: IAgents;
    onClose: () => void;
    onUpdated: () => void;
}

export default function EditAgentModal({ agent, onClose, onUpdated }: Props) {
    const [saving, setSaving] = useState(false);
    
    // Form states
    const [status, setStatus] = useState<IAgents["status"]>(agent.status);
    const [kycStatus, setKycStatus] = useState<IAgents["kycStatus"]>(agent.kycStatus);
    const [agentLevel, setAgentLevel] = useState<IAgents["agentLevel"]>(agent.agentLevel);
    const [commissionPercentage, setCommissionPercentage] = useState<number>(agent.commissionPercentage ?? 5);
    const [preferredCurrency, setPreferredCurrency] = useState<string>(agent.preferredCurrency ?? "USD");
    const [notes, setNotes] = useState<string>(agent.notes ?? "");

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await appClient.post("/api/agents/update", {
                _id: agent._id,
                status,
                kycStatus,
                agentLevel,
                commissionPercentage: Number(commissionPercentage),
                preferredCurrency,
                notes,
            });

            if (res.data?.status || res.status === 200) {
                toastSuccess("Agent settings updated successfully.");
                onUpdated();
                onClose();
            } else {
                toastError(res.data?.message ?? "Failed to update settings.");
            }
        } catch (error) {
            console.error("Save agent settings error:", error);
            toastError("Something went wrong while saving agent settings.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div 
                className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-[14px] font-bold text-slate-800">Edit Agent Settings</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{agent.firstName} {agent.lastName} ({agent.agentId})</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form fields */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold text-slate-500">
                    {/* Account Status */}
                    <div className="flex flex-col gap-1.5">
                        <label className="uppercase tracking-wider text-slate-400">Account Status</label>
                        <Select
                            fullWidth
                            value={status ?? ""}
                            onChange={(v) => setStatus(v as IAgents["status"])}
                            options={[
                                { value: "pending",   label: "Pending" },
                                { value: "active",    label: "Active" },
                                { value: "inactive",  label: "Inactive" },
                                { value: "suspended", label: "Suspended" },
                                { value: "blocked",   label: "Blocked" },
                                { value: "closed",    label: "Closed" },
                            ]}
                        />
                    </div>

                    {/* KYC Status */}
                    <div className="flex flex-col gap-1.5">
                        <label className="uppercase tracking-wider text-slate-400">KYC Status</label>
                        <Select
                            fullWidth
                            value={kycStatus ?? ""}
                            onChange={(v) => setKycStatus(v as IAgents["kycStatus"])}
                            options={[
                                { value: "pending",      label: "Pending" },
                                { value: "under_review", label: "Under Review" },
                                { value: "approved",     label: "Approved" },
                                { value: "rejected",     label: "Rejected" },
                            ]}
                        />
                    </div>

                    {/* Agent Level */}
                    <div className="flex flex-col gap-1.5">
                        <label className="uppercase tracking-wider text-slate-400">Agent Level</label>
                        <Select
                            fullWidth
                            value={agentLevel ?? ""}
                            onChange={(v) => setAgentLevel(v as IAgents["agentLevel"])}
                            options={[
                                { value: "basic",    label: "Basic" },
                                { value: "silver",   label: "Silver" },
                                { value: "gold",     label: "Gold" },
                                { value: "diamond",  label: "Diamond" },
                            ]}
                        />
                    </div>

                    {/* Commission Rate */}
                    <div className="flex flex-col gap-1.5">
                        <label className="uppercase tracking-wider text-slate-400">Commission Rate (%)</label>
                        <input
                            type="number"
                            value={commissionPercentage}
                            min={0}
                            max={100}
                            step={0.1}
                            onChange={(e) => setCommissionPercentage(parseFloat(e.target.value) || 0)}
                            className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
                        />
                    </div>

                    {/* Preferred Currency */}
                    <div className="flex flex-col gap-1.5">
                        <label className="uppercase tracking-wider text-slate-400">Preferred Currency</label>
                        <Select
                            fullWidth
                            value={preferredCurrency}
                            onChange={setPreferredCurrency}
                            options={[
                                { value: "USD", label: "USD" },
                                { value: "SGD", label: "SGD" },
                                { value: "EUR", label: "EUR" },
                                { value: "GBP", label: "GBP" },
                            ]}
                        />
                    </div>

                    {/* Admin Notes */}
                    <div className="flex flex-col gap-1.5">
                        <label className="uppercase tracking-wider text-slate-400">Admin Notes</label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add administrative notes here..."
                            className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition resize-none placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-navy hover:bg-navy/95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-navy/10"
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
