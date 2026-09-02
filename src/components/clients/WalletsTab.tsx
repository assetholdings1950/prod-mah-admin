"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Edit2, Loader2, Plus, Star, Trash2, Wallet, X } from "lucide-react";
import appClient from "@/lib/appClient";
import { IWalletDetail } from "@/interface/client";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { Field, inputCls } from "./primitives";

interface Props {
    clientId: string;
    userModel?: "Client" | "Agent" | "User";
}

const EMPTY_FORM = {
    label: "",
    network: "",
    walletAddress: "",
    isPrimary: false,
};

type WalletForm = typeof EMPTY_FORM;

export const WalletsTab = ({ clientId, userModel = "Client" }: Props) => {
    const [wallets, setWallets] = useState<IWalletDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<WalletForm>(EMPTY_FORM);
    const apiBase = userModel === "Agent" ? "/api/agents" : "/api/clients";

    const fetchWallets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await appClient.get(`${apiBase}/wallets?clientId=${clientId}`);
            setWallets(res.data?.data ?? res.data?.wallets ?? []);
        } catch {
            toastError("Failed to load wallets.");
        } finally {
            setLoading(false);
        }
    }, [clientId, apiBase]);

    useEffect(() => { fetchWallets(); }, [fetchWallets]);

    const openAdd = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (wallet: IWalletDetail) => {
        setForm({
            label: wallet.label ?? "",
            network: wallet.network ?? "",
            walletAddress: wallet.walletAddress ?? "",
            isPrimary: wallet.isPrimary ?? false,
        });
        setEditingId(wallet._id);
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleSave = async () => {
        if (!form.walletAddress.trim()) { toastError("Wallet address is required."); return; }
        if (!form.network.trim()) { toastError("Network is required."); return; }

        setSaving(true);
        try {
            if (editingId) {
                const res = await appClient.put(`${apiBase}/wallets/update`, {
                    _id: editingId,
                    ...form,
                    userId: clientId,
                    userModel,
                });
                if (res.data?.status || res.status === 200) {
                    toastSuccess("Wallet updated.");
                    cancelForm();
                    fetchWallets();
                } else {
                    toastError(res.data?.message ?? "Update failed.");
                }
            } else {
                const res = await appClient.post(`${apiBase}/wallets`, {
                    ...form,
                    userId: clientId,
                    userModel,
                });
                if (res.data?.status || res.status === 200 || res.status === 201) {
                    toastSuccess("Wallet added.");
                    cancelForm();
                    fetchWallets();
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
            const res = await appClient.delete(`${apiBase}/wallets/delete?id=${id}`);
            if (res.data?.status || res.status === 200) {
                toastSuccess("Wallet removed.");
                setWallets((prev) => prev.filter((w) => w._id !== id));
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
            {/* Wallet cards */}
            {wallets.length === 0 && !showForm && (
                <div className="text-center py-10 text-slate-400 text-[13px]">
                    <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                    No withdrawal wallets added yet.
                </div>
            )}

            <div className="flex flex-col gap-3">
                {wallets.map((wallet) => (
                    <div key={wallet._id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
                            <InfoRow label="Label" value={wallet.label} />
                            <InfoRow label="Network" value={wallet.network} />
                            <InfoRow label="Wallet Address" value={wallet.walletAddress} mono />
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {wallet.isPrimary && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                    <Star size={10} fill="currentColor" /> Primary
                                </span>
                            )}
                            <button
                                onClick={() => openEdit(wallet)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                                title="Edit"
                            >
                                <Edit2 size={13} />
                            </button>
                            <button
                                onClick={() => handleDelete(wallet._id)}
                                disabled={deletingId === wallet._id}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all disabled:opacity-40"
                                title="Delete"
                            >
                                {deletingId === wallet._id
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
                        {editingId ? "Edit Wallet" : "Add Wallet"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Label">
                            <input className={inputCls} value={form.label}
                                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                                placeholder="e.g. My BTC Wallet" />
                        </Field>
                        <Field label="Network">
                            <input className={inputCls} value={form.network}
                                onChange={(e) => setForm((p) => ({ ...p, network: e.target.value }))}
                                placeholder="e.g. Bitcoin, Ethereum, TRC20" />
                        </Field>
                        <Field label="Wallet Address">
                            <input className={inputCls} value={form.walletAddress}
                                onChange={(e) => setForm((p) => ({ ...p, walletAddress: e.target.value }))}
                                placeholder="0x... or bc1..." />
                        </Field>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={form.isPrimary}
                            onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))}
                            className="w-4 h-4 rounded accent-primary"
                        />
                        <span className="text-[13px] text-slate-600 font-medium">Set as primary wallet</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 disabled:opacity-60 text-white text-[12px] font-semibold px-4 py-2 rounded-lg transition-all"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            {editingId ? "Update" : "Add Wallet"}
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
                    <Plus size={13} /> Add Wallet
                </button>
            )}
        </div>
    );
};

const InfoRow = ({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) => (
    <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <p className={`text-[13px] text-slate-700 break-all ${mono ? "font-mono" : ""}`}>
            {value ?? <span className="text-slate-300 italic text-[12px]">—</span>}
        </p>
    </div>
);
