"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft, CheckCircle2, XCircle, Clock, Copy,
    ExternalLink, User, Wallet, Hash, MapPin,
    AlertCircle, RefreshCw, Calendar, Shield, Users,
    FileText, TrendingUp, ChevronRight,
} from "lucide-react";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import type { DepositRequestInterface, DepositAdminRef } from "@/interface/deposit";
import ConfirmModal from "../_components/ConfirmModal";
import RejectModal from "../_components/RejectModal";
import {
    STATUS_CONFIG, USER_MODEL_CONFIG,
    avatarGradient, getInitials,
    getUserName, getUserEmail, getUserIdStr,
    getMethodName, getMethodDetails,
    formatAmount, formatDateTime,
} from "../_components/types";

/* ─── helpers ─── */

function getAdminName(ref?: DepositAdminRef | null): string {
    if (!ref) return "—";
    const joined = [ref.firstName, ref.lastName].filter(Boolean).join(" ");
    return (ref.fullName ?? joined) || ref.email;
}

/* ─── info row ─── */

function InfoRow({ icon: Icon, label, value, mono = false, copyable = false }: {
    icon: React.ElementType; label: string; value?: string; mono?: boolean; copyable?: boolean;
}) {
    const doCopy = () => {
        if (value) navigator.clipboard.writeText(value);
        toastSuccess("Copied to clipboard.");
    };
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={13} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                <p className={`text-sm mt-0.5 text-slate-800 break-all ${mono ? "font-mono text-xs" : "font-semibold"}`}>{value}</p>
            </div>
            {copyable && (
                <button onClick={doCopy} className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5">
                    <Copy size={13} />
                </button>
            )}
        </div>
    );
}

/* ─── timeline item ─── */

function TimelineItem({ done, label, sub, accent }: { done: boolean; label: string; sub?: string; accent: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? accent : "bg-slate-100"}`}>
                {done ? <CheckCircle2 size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
            </div>
            <div className="pb-4 flex-1">
                <p className={`text-sm font-bold ${done ? "text-slate-800" : "text-slate-400"}`}>{label}</p>
                {sub && <p className={`text-xs mt-0.5 ${done ? "text-slate-500" : "text-slate-300"}`}>{sub}</p>}
            </div>
        </div>
    );
}

/* ─── main ─── */

export default function DepositDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [dep, setDep] = useState<DepositRequestInterface | null>(null);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(false);
    const [proofOpen, setProofOpen] = useState(false);

    /* confirm approve modal */
    const [approveOpen, setApproveOpen] = useState(false);
    /* reject modal */
    const [rejectOpen, setRejectOpen] = useState(false);

    const fetchDeposit = useCallback(async () => {
        setLoading(true);
        try {
            const res = await appClient.get(`/api/deposits/get?id=${id}`);
            setDep(res.data?.deposit ?? res.data?.data ?? res.data);
        } catch {
            toastError("Failed to load deposit.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchDeposit(); }, [fetchDeposit]);

    const doApprove = async () => {
        setApproveOpen(false);
        setActioning(true);
        try {
            const res = await appClient.patch(`/api/deposits/approve?id=${id}`);
            if (res.data?.status || res.status === 200) {
                toastSuccess("Deposit approved successfully.");
                setDep((prev) => prev ? { ...prev, status: "approved" } : prev);
            } else {
                toastError(res.data?.message ?? "Approval failed.");
            }
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Approval failed.");
        } finally {
            setActioning(false);
        }
    };

    const doReject = async (note: string) => {
        setRejectOpen(false);
        setActioning(true);
        try {
            const res = await appClient.patch(`/api/deposits/reject?id=${id}`, { adminNote: note });
            if (res.data?.status || res.status === 200) {
                toastSuccess("Deposit rejected.");
                setDep((prev) => prev ? { ...prev, status: "rejected", adminNote: note } : prev);
            } else {
                toastError(res.data?.message ?? "Rejection failed.");
            }
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Rejection failed.");
        } finally {
            setActioning(false);
        }
    };

    /* ── loading skeleton ── */
    if (loading) {
        return (
            <div className="flex flex-col gap-6 pb-10 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-20 bg-slate-200 rounded-xl" />
                    <div className="h-5 w-48 bg-slate-200 rounded" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    <div className="lg:col-span-3 bg-white rounded-2xl h-96 border border-slate-100" />
                    <div className="lg:col-span-2 bg-white rounded-2xl h-96 border border-slate-100" />
                </div>
            </div>
        );
    }

    if (!dep) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <AlertCircle size={40} className="text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">Deposit not found.</p>
                <Link href="/finance/deposits/all" className="text-xs text-blue-600 hover:underline">← Back to list</Link>
            </div>
        );
    }

    const sc = STATUS_CONFIG[dep.status] ?? STATUS_CONFIG.pending;
    const StatusIcon = sc.icon;
    const name = getUserName(dep.userId);
    const email = getUserEmail(dep.userId);
    const uid = getUserIdStr(dep.userId);
    const methodName = getMethodName(dep.paymentMethodId);
    const { type: methodType, currency: methodCurrency, network: methodNetwork } = getMethodDetails(dep.paymentMethodId);
    const umc = USER_MODEL_CONFIG[dep.userModel] ?? USER_MODEL_CONFIG.Client;
    const UMIcon = USER_MODEL_CONFIG[dep.userModel]?.icon ?? Users;
    const isPending = dep.status === "pending";

    return (
        <div className="flex flex-col gap-6 pb-10">

            {/* breadcrumb */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => router.push("/finance/deposits/all")}
                    className="flex items-center gap-1.5 h-8 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                    <ArrowLeft size={13} /> Back
                </button>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-xs text-slate-400">Finance</span>
                <ChevronRight size={14} className="text-slate-300" />
                <Link href="/finance/deposits/all" className="text-xs text-slate-400 hover:text-slate-600">Deposits</Link>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-xs font-bold text-slate-700 truncate max-w-[160px]">{dep._id?.slice(-8).toUpperCase()}</span>
            </div>

            {/* hero header */}
            <div className="relative bg-slate-800 rounded-2xl overflow-hidden p-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06)_0%,transparent_60%)]" />
                <div className={`absolute top-0 left-0 w-1 h-full ${sc.bar}`} />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-lg font-black shadow-lg`}>
                            {getInitials(name)}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Deposit Request</p>
                            <p className="text-white font-black text-xl mt-0.5">{name}</p>
                            <p className="text-slate-400 text-sm">{email}</p>
                            <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${umc.badge}`}>
                                <UMIcon size={10} />
                                {umc.label}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.chip}`}>
                            <StatusIcon size={12} />
                            {sc.label}
                        </span>
                        <p className="text-3xl font-black text-white">
                            ${formatAmount(dep.amount)}
                            <span className="text-lg text-slate-400 ml-1.5">{dep.currency}</span>
                        </p>
                        <p className="text-xs text-slate-500">{formatDateTime(dep.createdAt)}</p>
                    </div>
                </div>
            </div>

            {/* body grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* left */}
                <div className="lg:col-span-3 flex flex-col gap-4">

                    {/* depositor */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                <UMIcon size={12} className="text-blue-600" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Depositor</span>
                            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${umc.badge}`}>
                                {umc.label}
                            </span>
                        </div>
                        <div className="px-5">
                            <InfoRow icon={User} label="Full Name" value={name} />
                            <InfoRow icon={Shield} label="Email" value={email} />
                            <InfoRow icon={Hash} label="User ID" value={uid} mono copyable />
                        </div>
                    </div>

                    {/* transaction */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <TrendingUp size={12} className="text-emerald-600" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Transaction Details</span>
                        </div>
                        <div className="px-5">
                            <InfoRow icon={Wallet} label="Payment Method" value={methodName} />
                            <InfoRow icon={MapPin} label="Network" value={`${methodNetwork} · ${methodType.toUpperCase()}`} />
                            <InfoRow icon={Hash} label="Currency" value={`${dep.currency} (${methodCurrency})`} />
                            {dep.transactionHash && <InfoRow icon={Hash} label="Transaction Hash" value={dep.transactionHash} mono copyable />}
                            {dep.senderWalletAddress && <InfoRow icon={MapPin} label="Sender Wallet" value={dep.senderWalletAddress} mono copyable />}
                            {dep.note && <InfoRow icon={FileText} label="Note from Depositor" value={dep.note} />}
                            <InfoRow icon={Calendar} label="Submitted At" value={formatDateTime(dep.createdAt)} />
                        </div>
                    </div>

                    {/* admin decision (non-pending) */}
                    {!isPending && (
                        <div className={`border rounded-2xl overflow-hidden ${sc.banner}`}>
                            <div className="px-5 py-3.5 border-b border-current/10 flex items-center gap-2">
                                <StatusIcon size={14} />
                                <span className="text-xs font-black uppercase tracking-widest">Admin Decision</span>
                            </div>
                            <div className="px-5 py-4 flex flex-col gap-0">
                                {dep.status === "approved" && (
                                    <>
                                        <InfoRow icon={Shield} label="Approved By" value={getAdminName(dep.approvedBy)} />
                                        <InfoRow icon={Calendar} label="Approved At" value={formatDateTime(dep.approvedAt)} />
                                    </>
                                )}
                                {dep.status === "rejected" && (
                                    <>
                                        <InfoRow icon={Shield} label="Rejected By" value={getAdminName(dep.rejectedBy)} />
                                        <InfoRow icon={Calendar} label="Rejected At" value={formatDateTime(dep.rejectedAt)} />
                                        {dep.adminNote && <InfoRow icon={FileText} label="Rejection Reason" value={dep.adminNote} />}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* timeline */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center">
                                <Clock size={12} className="text-slate-500" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Timeline</span>
                        </div>
                        <div className="px-5 py-4">
                            <TimelineItem done label="Request Submitted" sub={formatDateTime(dep.createdAt)} accent="bg-blue-500" />
                            <TimelineItem
                                done={dep.status !== "pending"}
                                label={dep.status === "rejected" ? "Request Rejected" : dep.status === "approved" ? "Request Approved" : "Awaiting Review"}
                                sub={dep.status === "approved" ? formatDateTime(dep.approvedAt) : dep.status === "rejected" ? formatDateTime(dep.rejectedAt) : "Pending admin action"}
                                accent={dep.status === "approved" ? "bg-emerald-500" : dep.status === "rejected" ? "bg-red-500" : "bg-slate-400"}
                            />
                        </div>
                    </div>
                </div>

                {/* right */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* payment proof */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                                <FileText size={12} className="text-violet-600" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Payment Proof</span>
                        </div>
                        <div className="p-4">
                            {dep.paymentProofUrl ? (
                                <div className="relative group cursor-pointer" onClick={() => setProofOpen(true)}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={dep.paymentProofUrl}
                                        alt="Payment proof"
                                        className="w-full rounded-xl object-cover max-h-64 border border-slate-100"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                            <ExternalLink size={13} /> View Full Size
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 gap-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <FileText size={28} className="text-slate-300" />
                                    <p className="text-xs text-slate-400 font-medium">No proof uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* admin actions */}
                    {isPending && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <AlertCircle size={12} className="text-amber-600" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Admin Action</span>
                            </div>
                            <div className="p-5 flex flex-col gap-3">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Verify the payment proof and transaction details before taking action.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setApproveOpen(true)}
                                    disabled={actioning}
                                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                                >
                                    {actioning ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                    Approve Deposit
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setRejectOpen(true)}
                                    disabled={actioning}
                                    className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    <XCircle size={15} /> Reject Deposit
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {/* summary card */}
                    <div className="relative bg-slate-800 rounded-2xl overflow-hidden p-5">
                        <div className={`absolute top-0 left-0 right-0 h-[3px] ${sc.bar}`} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Deposit Summary</p>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { label: "Amount", value: `$${formatAmount(dep.amount)}` },
                                { label: "Currency", value: dep.currency },
                                { label: "Network", value: methodNetwork },
                                { label: "Type", value: methodType.toUpperCase() },
                                { label: "Status", value: sc.label },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">{label}</span>
                                    <span className="text-xs font-bold text-white">{value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Deposit ID</p>
                            <p className="text-xs font-mono text-slate-300 break-all">{dep._id}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* approve confirmation */}
            <ConfirmModal
                open={approveOpen}
                title="Approve Deposit"
                description={`Approve $${formatAmount(dep.amount)} ${dep.currency} from ${name}? This will credit their wallet balance.`}
                confirmLabel="Approve"
                variant="success"
                loading={actioning}
                onConfirm={doApprove}
                onCancel={() => setApproveOpen(false)}
            />

            {/* reject modal */}
            <RejectModal
                open={rejectOpen}
                onConfirm={doReject}
                onCancel={() => setRejectOpen(false)}
            />

            {/* proof lightbox */}
            {proofOpen && dep.paymentProofUrl && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setProofOpen(false)}
                >
                    <motion.img
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        src={dep.paymentProofUrl}
                        alt="Payment proof"
                        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain cursor-zoom-out"
                        onClick={(e) => e.stopPropagation()}
                    />
                </motion.div>
            )}
        </div>
    );
}
