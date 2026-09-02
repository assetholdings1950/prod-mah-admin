"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Edit2, Landmark, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import appClient from "@/lib/appClient";
import { IBankDetail } from "@/interface/client";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { Field, inputCls } from "./primitives";

interface Props {
    clientId: string;
    userModel?: "Client" | "Agent" | "User";
}

const EMPTY_FORM = {
    bankName: "",
    branchName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    swiftCode: "",
    isPrimary: false,
};

type BankForm = typeof EMPTY_FORM;

export const BankTab = ({ clientId, userModel = "Client" }: Props) => {
    const [banks, setBanks] = useState<IBankDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<BankForm>(EMPTY_FORM);
    const apiBase = userModel === "Agent" ? "/api/agents" : "/api/clients";

    const fetchBanks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await appClient.get(`${apiBase}/bank-details?clientId=${clientId}`);
            setBanks(res.data?.data ?? res.data?.bankDetails ?? []);
        } catch {
            toastError("Failed to load bank details.");
        } finally {
            setLoading(false);
        }
    }, [clientId, apiBase]);

    useEffect(() => { fetchBanks(); }, [fetchBanks]);

    const openAdd = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (bank: IBankDetail) => {
        setForm({
            bankName: bank.bankName ?? "",
            branchName: bank.branchName ?? "",
            accountName: bank.accountName ?? "",
            accountNumber: bank.accountNumber ?? "",
            ifscCode: bank.ifscCode ?? "",
            swiftCode: bank.swiftCode ?? "",
            isPrimary: bank.isPrimary ?? false,
        });
        setEditingId(bank._id);
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleSave = async () => {
        if (!form.bankName.trim()) { toastError("Bank name is required."); return; }
        if (!form.accountNumber.trim()) { toastError("Account number is required."); return; }

        setSaving(true);
        try {
            if (editingId) {
                const res = await appClient.put(`${apiBase}/bank-details/update`, {
                    _id: editingId,
                    ...form,
                    userId: clientId,
                    userModel,
                });
                if (res.data?.status || res.status === 200) {
                    toastSuccess("Bank detail updated.");
                    cancelForm();
                    fetchBanks();
                } else {
                    toastError(res.data?.message ?? "Update failed.");
                }
            } else {
                const res = await appClient.post(`${apiBase}/bank-details`, {
                    ...form,
                    userId: clientId,
                    userModel,
                });
                if (res.data?.status || res.status === 200 || res.status === 201) {
                    toastSuccess("Bank detail added.");
                    cancelForm();
                    fetchBanks();
                } else {
                    toastError(res.data?.message ?? "Failed to add.");
                }
            }
        } catch {
            toastError("Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await appClient.delete(`${apiBase}/bank-details/delete?id=${id}`);
            if (res.data?.status || res.status === 200) {
                toastSuccess("Bank detail removed.");
                setBanks((prev) => prev.filter((b) => b._id !== id));
            } else {
                toastError(res.data?.message ?? "Delete failed.");
            }
        } catch {
            toastError("Failed to delete.");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Bank account cards */}
            {banks.length === 0 && !showForm && (
                <div className="text-center py-10 text-slate-400 text-[13px]">
                    <Landmark size={32} className="mx-auto mb-3 opacity-30" />
                    No bank accounts added yet.
                </div>
            )}

            <div className="flex flex-col gap-3">
                {banks.map((bank) => (
                    <div key={bank._id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                            <InfoRow label="Bank" value={bank.bankName} />
                            <InfoRow label="Branch" value={bank.branchName} />
                            <InfoRow label="Account Name" value={bank.accountName} />
                            <InfoRow label="Account No." value={bank.accountNumber} mono />
                            <InfoRow label="IFSC" value={bank.ifscCode} mono />
                            <InfoRow label="SWIFT" value={bank.swiftCode} mono />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {bank.isPrimary && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                    <Star size={10} fill="currentColor" /> Primary
                                </span>
                            )}
                            <button
                                onClick={() => openEdit(bank)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                                title="Edit"
                            >
                                <Edit2 size={13} />
                            </button>
                            <button
                                onClick={() => handleDelete(bank._id)}
                                disabled={deletingId === bank._id}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all disabled:opacity-40"
                                title="Delete"
                            >
                                {deletingId === bank._id
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <Trash2 size={13} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Inline add/edit form */}
            {showForm && (
                <div className="p-5 rounded-xl border border-primary/20 bg-primary/3 flex flex-col gap-4">
                    <p className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">
                        {editingId ? "Edit Bank Account" : "Add Bank Account"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Bank Name">
                            <input className={inputCls} value={form.bankName}
                                onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                                placeholder="e.g. State Bank of India" />
                        </Field>
                        <Field label="Branch Name">
                            <input className={inputCls} value={form.branchName}
                                onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))}
                                placeholder="Branch name" />
                        </Field>
                        <Field label="Account Holder Name">
                            <input className={inputCls} value={form.accountName}
                                onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))}
                                placeholder="Name as on account" />
                        </Field>
                        <Field label="Account Number">
                            <input className={inputCls} value={form.accountNumber}
                                onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                                placeholder="Account number" />
                        </Field>
                        <Field label="IFSC Code">
                            <input className={inputCls} value={form.ifscCode}
                                onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                                placeholder="IFSC code" maxLength={11} />
                        </Field>
                        <Field label="SWIFT / BIC Code">
                            <input className={inputCls} value={form.swiftCode}
                                onChange={(e) => setForm((p) => ({ ...p, swiftCode: e.target.value.toUpperCase() }))}
                                placeholder="SWIFT code" maxLength={11} />
                        </Field>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={form.isPrimary}
                            onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))}
                            className="w-4 h-4 rounded accent-primary"
                        />
                        <span className="text-[13px] text-slate-600 font-medium">Set as primary bank account</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 disabled:opacity-60 text-white text-[12px] font-semibold px-4 py-2 rounded-lg transition-all"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            {editingId ? "Update" : "Add Bank"}
                        </button>
                        <button
                            onClick={cancelForm}
                            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X size={13} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {!showForm && (
                <button
                    onClick={openAdd}
                    className="self-start flex items-center gap-2 text-[12px] font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={13} /> Add Bank Account
                </button>
            )}
        </div>
    );
};

const InfoRow = ({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) => (
    <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <p className={`text-[13px] text-slate-700 ${mono ? "font-mono" : ""}`}>
            {value ?? <span className="text-slate-300 italic text-[12px]">—</span>}
        </p>
    </div>
);
