"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft, CheckCircle2, XCircle, Clock, Copy,
    User, Hash, AlertCircle, RefreshCw, Calendar, Shield, Users,
    FileText, TrendingDown, ChevronRight, Building2, Wallet,
} from "lucide-react";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import type { WithdrawalRequestInterface } from "@/interface/withdrawal";
import ConfirmModal from "../../deposits/_components/ConfirmModal";
import RejectModal from "../../deposits/_components/RejectModal";
import {
    STATUS_CONFIG, USER_MODEL_CONFIG, METHOD_CONFIG,
    avatarGradient, getInitials,
    getUserName, getUserEmail, getUserIdStr,
    getBankDisplay, getWalletDisplay,
    getAdminName,
    formatAmount, formatDateTime,
} from "../_components/types";

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

export default function WithdrawalDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [wd, setWd] = useState<WithdrawalRequestInterface | null>(null);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(false);

    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    const fetchWithdrawal = useCallback(async () => {
        setLoading(true);
        try {
            const res = await appClient.get(`/api/withdraws/get?id=${id}`);
            setWd(res.data?.data ?? res.data);
        } catch {
            toastError("Failed to load withdrawal.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchWithdrawal(); }, [fetchWithdrawal]);

    const doApprove = async () => {
        setApproveOpen(false);
        setActioning(true);
        try {
            const res = await appClient.patch(`/api/withdraws/approve?id=${id}`);
            if (res.data?.status || res.status === 200) {
                toastSuccess("Withdrawal approved successfully.");
                setWd((prev) => prev ? { ...prev, status: "approved" } : prev);
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
            const res = await appClient.patch(`/api/withdraws/reject?id=${id}`, { adminNote: note });
            if (res.data?.status || res.status === 200) {
                toastSuccess("Withdrawal rejected.");
                setWd((prev) => prev ? { ...prev, status: "rejected", adminNote: note } : prev);
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

    if (!wd) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <AlertCircle size={40} className="text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">Withdrawal request not found.</p>
                <Link href="/finance/withdrawals/all" className="text-xs text-blue-600 hover:underline">← Back to list</Link>
            </div>
        );
    }

    const sc = STATUS_CONFIG[wd.status] ?? STATUS_CONFIG.pending;
    const StatusIcon = sc.icon;
    const name = getUserName(wd.userId);
    const email = getUserEmail(wd.userId);
    const uid = getUserIdStr(wd.userId);
    const umc = USER_MODEL_CONFIG[wd.userModel] ?? USER_MODEL_CONFIG.Client;
    const UMIcon = umc.icon;
    const mc = METHOD_CONFIG[wd.withdrawalMethod] ?? METHOD_CONFIG.bank;
    const MIcon = mc.icon;
    const isPending = wd.status === "pending";

    /* method detail lines */
    const bank = wd.bankDetailId;
    const wallet = wd.walletId;
    const bankDisplay = getBankDisplay(bank);
    const walletDisplay = getWalletDisplay(wallet);

    return (
        <div className="flex flex-col gap-6 pb-10">

            {/* breadcrumb */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => router.push("/finance/withdrawals/all")}
                    className="flex items-center gap-1.5 h-8 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                    <ArrowLeft size={13} /> Back
                </button>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-xs text-slate-400">Finance</span>
                <ChevronRight size={14} className="text-slate-300" />
                <Link href="/finance/withdrawals/all" className="text-xs text-slate-400 hover:text-slate-600">Withdrawals</Link>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-xs font-bold text-slate-700 truncate max-w-[160px]">{wd._id?.slice(-8).toUpperCase()}</span>
            </div>

            {/* hero */}
            <div className="relative bg-slate-800 rounded-2xl overflow-hidden p-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06)_0%,transparent_60%)]" />
                <div className={`absolute top-0 left-0 w-1 h-full ${sc.bar}`} />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-lg font-black shadow-lg`}>
                            {getInitials(name)}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Withdrawal Request</p>
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
                            {formatAmount(wd.amount)}
                            <span className="text-lg text-slate-400 ml-1.5">{wd.currency}</span>
                        </p>
                        <p className="text-xs text-slate-500">{formatDateTime(wd.createdAt)}</p>
                    </div>
                </div>
            </div>

            {/* body grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* left */}
                <div className="lg:col-span-3 flex flex-col gap-4">

                    {/* requester */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                <UMIcon size={12} className="text-blue-600" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Requester</span>
                            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${umc.badge}`}>
                                {umc.label}
                            </span>
                        </div>
                        <div className="px-5">
                            <InfoRow icon={User}   label="Full Name" value={name} />
                            <InfoRow icon={Shield} label="Email"     value={email} />
                            <InfoRow icon={Hash}   label="User ID"   value={uid} mono copyable />
                        </div>
                    </div>

                    {/* withdrawal details */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                                <TrendingDown size={12} className="text-rose-600" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Withdrawal Details</span>
                        </div>
                        <div className="px-5">
                            <InfoRow icon={Hash}     label="Amount"   value={`${formatAmount(wd.amount)} ${wd.currency}`} />
                            <InfoRow icon={MIcon}    label="Method"   value={mc.label} />
                            {wd.withdrawalMethod === "bank" && bank && (
                                <>
                                    <InfoRow icon={Building2} label="Bank Name"      value={bank.bankName ?? undefined} />
                                    <InfoRow icon={Building2} label="Branch"         value={bank.branchName ?? undefined} />
                                    <InfoRow icon={User}      label="Account Name"   value={bank.accountName ?? undefined} />
                                    <InfoRow icon={Hash}      label="Account Number" value={bank.accountNumber ?? undefined} mono copyable />
                                    <InfoRow icon={Hash}      label="IFSC Code"      value={bank.ifscCode ?? undefined} mono copyable />
                                    <InfoRow icon={Hash}      label="SWIFT Code"     value={bank.swiftCode ?? undefined} mono copyable />
                                </>
                            )}
                            {wd.withdrawalMethod === "wallet" && wallet && (
                                <>
                                    <InfoRow icon={Wallet} label="Network"        value={wallet.network ?? undefined} />
                                    <InfoRow icon={Hash}   label="Wallet Address" value={wallet.walletAddress ?? undefined} mono copyable />
                                    <InfoRow icon={FileText} label="Label"        value={wallet.label ?? undefined} />
                                </>
                            )}
                            {wd.note && <InfoRow icon={FileText} label="Note from Requester" value={wd.note} />}
                            <InfoRow icon={Calendar} label="Submitted At" value={formatDateTime(wd.createdAt)} />
                        </div>
                    </div>

                    {/* admin decision */}
                    {!isPending && (
                        <div className={`border rounded-2xl overflow-hidden ${sc.banner}`}>
                            <div className="px-5 py-3.5 border-b border-current/10 flex items-center gap-2">
                                <StatusIcon size={14} />
                                <span className="text-xs font-black uppercase tracking-widest">Admin Decision</span>
                            </div>
                            <div className="px-5 py-4">
                                {wd.status === "approved" && (
                                    <>
                                        <InfoRow icon={Shield}   label="Approved By" value={getAdminName(wd.approvedBy)} />
                                        <InfoRow icon={Calendar} label="Approved At"  value={formatDateTime(wd.approvedAt)} />
                                    </>
                                )}
                                {wd.status === "rejected" && (
                                    <>
                                        <InfoRow icon={Shield}   label="Rejected By"       value={getAdminName(wd.rejectedBy)} />
                                        <InfoRow icon={Calendar} label="Rejected At"        value={formatDateTime(wd.rejectedAt)} />
                                        {wd.adminNote && <InfoRow icon={FileText} label="Rejection Reason" value={wd.adminNote} />}
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
                            <TimelineItem done label="Request Submitted" sub={formatDateTime(wd.createdAt)} accent="bg-blue-500" />
                            <TimelineItem
                                done={wd.status !== "pending"}
                                label={wd.status === "rejected" ? "Request Rejected" : wd.status === "approved" ? "Request Approved" : "Awaiting Review"}
                                sub={
                                    wd.status === "approved" ? formatDateTime(wd.approvedAt)
                                    : wd.status === "rejected" ? formatDateTime(wd.rejectedAt)
                                    : "Pending admin action"
                                }
                                accent={wd.status === "approved" ? "bg-emerald-500" : wd.status === "rejected" ? "bg-red-500" : "bg-slate-400"}
                            />
                        </div>
                    </div>
                </div>

                {/* right */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                    {/* method summary card */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                                <MIcon size={12} className="text-violet-600" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                                {mc.label}
                            </span>
                        </div>
                        <div className="p-5">
                            {wd.withdrawalMethod === "bank" && bank ? (
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                            <Building2 size={18} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{bankDisplay.line1}</p>
                                            {bankDisplay.line2 && (
                                                <p className="text-xs font-mono text-slate-500 mt-0.5">{bankDisplay.line2}</p>
                                            )}
                                        </div>
                                    </div>
                                    {bank.accountName && (
                                        <p className="text-xs text-slate-500">Account: <span className="font-semibold text-slate-700">{bank.accountName}</span></p>
                                    )}
                                    {bank.ifscCode && (
                                        <p className="text-xs text-slate-500">IFSC: <span className="font-mono font-semibold text-slate-700">{bank.ifscCode}</span></p>
                                    )}
                                </div>
                            ) : wd.withdrawalMethod === "wallet" && wallet ? (
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                            <Wallet size={18} className="text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{walletDisplay.line1}</p>
                                            {walletDisplay.line2 && (
                                                <p className="text-xs font-mono text-slate-500 mt-0.5">{walletDisplay.line2}</p>
                                            )}
                                        </div>
                                    </div>
                                    {wallet.walletAddress && (
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-mono text-slate-600 break-all flex-1">{wallet.walletAddress}</p>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(wallet.walletAddress!); toastSuccess("Address copied."); }}
                                                className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
                                            >
                                                <Copy size={13} />
                                            </button>
                                        </div>
                                    )}
                                    {wallet.label && (
                                        <p className="text-xs text-slate-500">Label: <span className="font-semibold text-slate-700">{wallet.label}</span></p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-4">No method details available.</p>
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
                                    Verify the withdrawal destination and ensure the client has sufficient balance before taking action.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setApproveOpen(true)}
                                    disabled={actioning}
                                    className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                                >
                                    {actioning ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                                    Approve Withdrawal
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setRejectOpen(true)}
                                    disabled={actioning}
                                    className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    <XCircle size={15} /> Reject Withdrawal
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {/* summary card */}
                    <div className="relative bg-slate-800 rounded-2xl overflow-hidden p-5">
                        <div className={`absolute top-0 left-0 right-0 h-[3px] ${sc.bar}`} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Withdrawal Summary</p>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { label: "Amount",   value: `${formatAmount(wd.amount)} ${wd.currency}` },
                                { label: "Currency", value: wd.currency },
                                { label: "Method",   value: mc.label },
                                { label: "Status",   value: sc.label },
                                { label: "User",     value: umc.label },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">{label}</span>
                                    <span className="text-xs font-bold text-white">{value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Request ID</p>
                            <p className="text-xs font-mono text-slate-300 break-all">{wd._id}</p>
                        </div>
                    </div>

                    {/* user link */}
                    <Link
                        href={`/clients/${uid}/edit`}
                        className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl shadow-sm p-4 hover:border-slate-200 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Users size={15} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-700">View {umc.label} Profile</p>
                                <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{name}</p>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </Link>
                </div>
            </div>

            {/* approve confirmation */}
            <ConfirmModal
                open={approveOpen}
                title="Approve Withdrawal"
                description={`Approve withdrawal of ${formatAmount(wd.amount)} ${wd.currency} from ${name}? This will deduct the amount from their wallet.`}
                confirmLabel="Approve"
                variant="success"
                loading={actioning}
                onConfirm={doApprove}
                onCancel={() => setApproveOpen(false)}
            />

            {/* reject modal */}
            <RejectModal
                open={rejectOpen}
                title="Reject Withdrawal"
                subtitle="Provide a reason for the requester"
                onConfirm={doReject}
                onCancel={() => setRejectOpen(false)}
            />
        </div>
    );
}
