"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Mail, Phone, Search, ShieldAlert, UserRoundCog, X } from "lucide-react";
import appClient from "@/lib/appClient";
import type { IClients } from "@/interface/client";
import type { IAgents } from "@/interface/agent";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

type Confirmation = { mode: "assign"; agent: IAgents } | { mode: "remove"; agent: null };

function ManagerConfirmationModal({ confirmation, currentManager, loading, onConfirm, onCancel }: {
    confirmation: Confirmation | null;
    currentManager: IClients["accountManager"];
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    useEffect(() => {
        if (!confirmation || loading) return;
        const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [confirmation, loading, onCancel]);

    const isRemove = confirmation?.mode === "remove";
    const target = confirmation?.mode === "assign" ? confirmation.agent : null;
    const currentName = currentManager?.fullName || `${currentManager?.firstName || ""} ${currentManager?.lastName || ""}`.trim();
    const targetName = target?.fullName || `${target?.firstName || ""} ${target?.lastName || ""}`.trim();

    return (
        <AnimatePresence>
            {confirmation && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onCancel(); }}
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md"
                >
                    <motion.div
                        role="dialog" aria-modal="true" aria-labelledby="manager-confirmation-title"
                        initial={{ opacity: 0, y: 18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ type: "spring", damping: 25, stiffness: 320 }}
                        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)]"
                    >
                        <div className={`relative overflow-hidden px-6 pb-6 pt-7 text-white ${isRemove ? "bg-gradient-to-br from-slate-950 via-rose-950 to-rose-800" : "bg-gradient-to-br from-slate-950 via-[#102b60] to-[#087286]"}`}>
                            <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                            <button onClick={onCancel} disabled={loading} aria-label="Close confirmation" className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/10 p-2 text-white/65 transition hover:bg-white/20 hover:text-white disabled:opacity-40"><X size={16} /></button>
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner">
                                {isRemove ? <AlertTriangle size={22} /> : <UserRoundCog size={23} />}
                            </div>
                            <p className="relative mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">Confirmation required</p>
                            <h2 id="manager-confirmation-title" className="relative mt-1 text-xl font-black !text-white">{isRemove ? "Remove Account Manager?" : currentManager ? "Change Account Manager?" : "Assign Account Manager?"}</h2>
                            <p className="relative mt-2 text-[13px] leading-5 text-white/65">{isRemove ? "The client will be unable to create new investments until another eligible manager is assigned." : "This agent will become the client’s primary investment guide and support contact."}</p>
                        </div>

                        <div className="p-6">
                            {isRemove && currentManager ? (
                                <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white font-bold text-rose-700 shadow-sm">{currentManager.profileImage ? <img src={currentManager.profileImage} alt="" className="h-full w-full object-cover" /> : currentName.slice(0, 2).toUpperCase()}</div>
                                    <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{currentName}</p><p className="mt-0.5 text-[11px] text-slate-500">{currentManager.agentId} · Current manager</p></div>
                                </div>
                            ) : target ? (
                                <div className="space-y-3">
                                    {currentManager && <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><span className="max-w-[130px] truncate">{currentName}</span><ArrowRight size={14} className="text-primary" /><span>New manager</span></div>}
                                    <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 p-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white font-bold text-[#0B2E84] shadow-sm">{target.profileImage ? <img src={target.profileImage} alt="" className="h-full w-full object-cover" /> : targetName.slice(0, 2).toUpperCase()}</div>
                                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{targetName}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{target.agentId} · {target.email}</p></div>
                                        <CheckCircle2 size={19} className="shrink-0 text-emerald-600" />
                                    </div>
                                </div>
                            ) : null}

                            <div className="mt-6 flex gap-3">
                                <button onClick={onCancel} disabled={loading} className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                                <button onClick={onConfirm} disabled={loading} className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg transition disabled:opacity-60 ${isRemove ? "bg-rose-600 shadow-rose-200 hover:bg-rose-700" : "bg-[#0B2E84] shadow-blue-200 hover:bg-[#082461]"}`}>
                                    {loading ? <Loader2 size={15} className="animate-spin" /> : isRemove ? <X size={15} /> : <CheckCircle2 size={15} />}
                                    {loading ? "Updating…" : isRemove ? "Remove Manager" : currentManager ? "Change Manager" : "Assign Manager"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function AccountManagerTab({ client, onAssigned }: { client: IClients; onAssigned: () => Promise<void> }) {
    const [search, setSearch] = useState("");
    const [agents, setAgents] = useState<IAgents[]>([]);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
    const eligible = client.kycStatus === "approved";
    const manager = client.accountManager;

    useEffect(() => {
        if (!eligible) return;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            try {
                const response = await appClient.get("/api/agents/get", {
                    params: { page: 1, limit: 20, search, status: "active", kycStatus: "approved" },
                });
                setAgents(response.data?.agents?.docs ?? response.data?.agents ?? []);
            } catch {
                toastError("Failed to load eligible agents.");
            } finally {
                setLoading(false);
            }
        }, 350);
        return () => window.clearTimeout(timer);
    }, [eligible, search]);

    const updateManager = async (accountManagerId: string | null) => {
        setSavingId(accountManagerId ?? "remove");
        try {
            const response = await appClient.patch("/api/clients/account-manager", { clientId: client._id, accountManagerId });
            if (!response.data?.status) throw new Error(response.data?.message || "Update failed.");
            toastSuccess(response.data.message || "Account Manager updated.");
            setConfirmation(null);
            await onAssigned();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            toastError(err.response?.data?.message || err.message || "Failed to update Account Manager.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <ManagerConfirmationModal
                confirmation={confirmation}
                currentManager={manager}
                loading={savingId !== null}
                onCancel={() => { if (savingId === null) setConfirmation(null); }}
                onConfirm={() => updateManager(confirmation?.mode === "assign" ? confirmation.agent._id : null)}
            />
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-[#102b60] to-[#0b4a6f] p-6 text-white shadow-lg">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                        {manager?.profileImage ? <img src={manager.profileImage} alt="" className="h-full w-full object-cover" /> : <UserRoundCog size={26} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">Current Account Manager</p>
                        {manager ? (
                            <>
                                <h3 className="mt-1 truncate text-xl font-bold !text-white">{manager.fullName || `${manager.firstName} ${manager.lastName}`}</h3>
                                <p className="mt-1 text-xs text-white/60">{manager.agentId} · {manager.agentLevel} agent</p>
                                <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/75">
                                    <span className="flex items-center gap-1.5"><Mail size={13} />{manager.email}</span>
                                    {manager.phoneNumber && <span className="flex items-center gap-1.5"><Phone size={13} />{manager.phoneNumber}</span>}
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="mt-1 text-xl font-bold !text-white">Not assigned</h3>
                                <p className="mt-1 text-sm text-white/65">This client cannot create a new investment until an Account Manager is assigned.</p>
                            </>
                        )}
                    </div>
                    {manager && (
                        <button onClick={() => setConfirmation({ mode: "remove", agent: null })} disabled={savingId !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/20 disabled:opacity-50">
                            {savingId === "remove" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Remove
                        </button>
                    )}
                </div>
            </div>

            {!eligible ? (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div><p className="text-sm font-bold">KYC approval required</p><p className="mt-1 text-xs leading-5 text-amber-800">Approve this client’s KYC before assigning an Account Manager.</p></div>
                </div>
            ) : (
                <div>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div><h3 className="text-sm font-bold text-slate-800">Choose an eligible agent</h3><p className="mt-1 text-xs text-slate-400">Only active agents with approved KYC are shown.</p></div>
                        <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or Agent ID" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" /></div>
                    </div>
                    {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : agents.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">No eligible agents found.</div> : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {agents.map((agent) => {
                                const selected = manager?._id === agent._id;
                                const name = agent.fullName || `${agent.firstName || ""} ${agent.lastName || ""}`.trim();
                                return <button key={agent._id} onClick={() => !selected && setConfirmation({ mode: "assign", agent })} disabled={selected || savingId !== null} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${selected ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"} disabled:cursor-default`}>
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-bold text-slate-600">{agent.profileImage ? <img src={agent.profileImage} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}</div>
                                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{name}</p><p className="truncate text-[11px] text-slate-400">{agent.agentId} · {agent.email}</p></div>
                                    {savingId === agent._id ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : selected ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
                                </button>;
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
