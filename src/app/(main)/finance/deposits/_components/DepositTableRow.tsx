"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, RefreshCw, UserCheck, UserX } from "lucide-react";
import type { DepositRequestInterface } from "@/interface/deposit";
import {
    STATUS_CONFIG, USER_MODEL_CONFIG,
    avatarGradient, getInitials,
    getUserName, getUserEmail,
    getMethodName, getMethodDetails,
    getAdminName,
    formatAmount, formatDate, formatTime,
} from "./types";

interface Props {
    deposit: DepositRequestInterface;
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

export default function DepositTableRow({ deposit, isSelected, isActioning, onSelect, onApprove, onReject }: Props) {
    const router = useRouter();
    const sc = STATUS_CONFIG[deposit.status] ?? STATUS_CONFIG.pending;
    const name = getUserName(deposit.userId);
    const email = getUserEmail(deposit.userId);
    const methodName = getMethodName(deposit.paymentMethodId);
    const { network, type } = getMethodDetails(deposit.paymentMethodId);
    const umc = USER_MODEL_CONFIG[deposit.userModel] ?? USER_MODEL_CONFIG.Client;
    const UMIcon = umc.icon;
    const isPending = deposit.status === "pending";
    const id = deposit._id!;

    const handleRowClick = () => router.push(`/finance/deposits/${id}`);

    const stop = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <tr
            onClick={handleRowClick}
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

            {/* depositor */}
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="shrink-0">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(name)} flex items-center justify-center text-white text-[11px] font-bold`}>
                            {getInitials(name)}
                        </div>
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
                <p className="text-[13px] font-semibold text-slate-800">${formatAmount(deposit.amount)}</p>
                <p className="text-[11px] text-slate-400">{deposit.currency}</p>
            </td>

            {/* method */}
            <td className="px-4 py-3.5">
                <p className="text-[12px] font-medium text-slate-700 truncate max-w-[130px]">{methodName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                        type === "crypto"
                            ? "bg-violet-50 text-violet-600 border-violet-200"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}>
                        {type}
                    </span>
                    <span className="text-[10px] text-slate-400">{network}</span>
                </div>
            </td>

            {/* date */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <p className="text-[12px] text-slate-600">{formatDate(deposit.createdAt)}</p>
                <p className="text-[11px] text-slate-400">{formatTime(deposit.createdAt)}</p>
            </td>

            {/* status */}
            <td className="px-4 py-3.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${sc.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                </span>
            </td>

            {/* decision / actions — always visible */}
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
                ) : deposit.status === "approved" ? (
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                            <UserCheck size={13} className="text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-emerald-700 truncate max-w-[150px]">
                                {getAdminName(deposit.approvedBy)}
                            </p>
                            <p className="text-[10px] text-slate-400">{shortDateTime(deposit.approvedAt)}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                            <UserX size={13} className="text-red-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-red-700 truncate max-w-[150px]">
                                {getAdminName(deposit.rejectedBy)}
                            </p>
                            <p className="text-[10px] text-slate-400">{shortDateTime(deposit.rejectedAt)}</p>
                            {deposit.adminNote && (
                                <p className="text-[10px] text-slate-500 truncate max-w-[150px] mt-0.5 italic">
                                    &ldquo;{deposit.adminNote}&rdquo;
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </td>
        </tr>
    );
}
