"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, RefreshCw, UserCheck, UserX } from "lucide-react";
import type { WithdrawalRequestInterface } from "@/interface/withdrawal";
import {
    STATUS_CONFIG, USER_MODEL_CONFIG, METHOD_CONFIG,
    avatarGradient, getInitials,
    getUserName, getUserEmail,
    getBankDisplay, getWalletDisplay,
    getAdminName,
    formatAmount, formatDate, formatTime,
} from "./types";

interface Props {
    withdrawal: WithdrawalRequestInterface;
    isSelected: boolean;
    isActioning: boolean;
    onSelect: (id: string, checked: boolean) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

function shortDateTime(d?: string): string {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function WithdrawalTableRow({ withdrawal, isSelected, isActioning, onSelect, onApprove, onReject }: Props) {
    const router = useRouter();
    const sc = STATUS_CONFIG[withdrawal.status] ?? STATUS_CONFIG.pending;
    const name = getUserName(withdrawal.userId);
    const email = getUserEmail(withdrawal.userId);
    const umc = USER_MODEL_CONFIG[withdrawal.userModel] ?? USER_MODEL_CONFIG.Client;
    const UMIcon = umc.icon;
    const mc = METHOD_CONFIG[withdrawal.withdrawalMethod] ?? METHOD_CONFIG.bank;
    const MIcon = mc.icon;

    const methodDisplay = withdrawal.withdrawalMethod === "bank"
        ? getBankDisplay(withdrawal.bankDetailId)
        : getWalletDisplay(withdrawal.walletId);

    const isPending = withdrawal.status === "pending";
    const id = withdrawal._id!;

    const stop = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <tr
            onClick={() => router.push(`/finance/withdrawals/${id}`)}
            className={`border-b border-slate-100 transition-colors cursor-pointer ${
                isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/70"
            }`}
        >
            {/* checkbox */}
            <td className="px-4 py-3.5 w-10" onClick={stop}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(id, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 accent-slate-800 cursor-pointer"
                />
            </td>

            {/* user */}
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                        {getInitials(name)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 leading-tight truncate">{name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{email}</p>
                        <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${umc.badge}`}>
                            <UMIcon size={9} />
                            {umc.label}
                        </span>
                    </div>
                </div>
            </td>

            {/* amount */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <p className="text-[13px] font-semibold text-slate-800">{formatAmount(withdrawal.amount)}</p>
                <p className="text-[11px] text-slate-400">{withdrawal.currency}</p>
            </td>

            {/* method */}
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${mc.chip}`}>
                        <MIcon size={9} />
                        {mc.label}
                    </span>
                </div>
                <p className="text-[12px] font-medium text-slate-700 truncate max-w-[130px]">{methodDisplay.line1}</p>
                {methodDisplay.line2 && (
                    <p className="text-[10px] text-slate-400 font-mono">{methodDisplay.line2}</p>
                )}
            </td>

            {/* date */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <p className="text-[12px] text-slate-600">{formatDate(withdrawal.createdAt)}</p>
                <p className="text-[11px] text-slate-400">{formatTime(withdrawal.createdAt)}</p>
            </td>

            {/* status */}
            <td className="px-4 py-3.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${sc.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                </span>
            </td>

            {/* decision / actions */}
            <td className="px-4 py-3.5" onClick={stop}>
                {isPending ? (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onApprove(id)}
                            disabled={isActioning}
                            className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-200"
                        >
                            {isActioning
                                ? <RefreshCw size={13} className="animate-spin" />
                                : <CheckCircle2 size={14} />}
                            Approve
                        </button>
                        <button
                            onClick={() => onReject(id)}
                            disabled={isActioning}
                            className="h-8 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-lg border border-red-200 transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <XCircle size={14} />
                            Reject
                        </button>
                    </div>
                ) : withdrawal.status === "approved" ? (
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                            <UserCheck size={13} className="text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-emerald-700 truncate max-w-[150px]">
                                {getAdminName(withdrawal.approvedBy)}
                            </p>
                            <p className="text-[10px] text-slate-400">{shortDateTime(withdrawal.approvedAt)}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                            <UserX size={13} className="text-red-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-red-700 truncate max-w-[150px]">
                                {getAdminName(withdrawal.rejectedBy)}
                            </p>
                            <p className="text-[10px] text-slate-400">{shortDateTime(withdrawal.rejectedAt)}</p>
                            {withdrawal.adminNote && (
                                <p className="text-[10px] text-slate-500 truncate max-w-[150px] mt-0.5 italic">
                                    &ldquo;{withdrawal.adminNote}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </td>
        </tr>
    );
}
