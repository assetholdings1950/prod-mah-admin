"use client";

import type { TransactionInterface } from "@/interface/transaction";
import {
    TYPE_CONFIG, STATUS_CONFIG, USER_MODEL_CONFIG,
    CURRENCY_CONFIG, getCurrencyConfig,
    avatarGradient, getInitials, getUserName, getUserEmail,
    getAdminName, formatCurrencyAmount, formatDate, formatTime,
} from "./types";

interface Props {
    transaction: TransactionInterface;
    onClick: (tx: TransactionInterface) => void;
}

export default function TransactionTableRow({ transaction, onClick }: Props) {
    const tc = TYPE_CONFIG[transaction.type];
    const sc = STATUS_CONFIG[transaction.status];
    const umc = USER_MODEL_CONFIG[transaction.userModel] ?? USER_MODEL_CONFIG.Client;
    const cc = getCurrencyConfig(transaction.currency);
    const TypeIcon = tc.icon;
    const UMIcon = umc.icon;
    const CurrencyIcon = CURRENCY_CONFIG[transaction.currency]?.icon;

    const name = getUserName(transaction.userId);
    const email = getUserEmail(transaction.userId);
    const adminName = getAdminName(transaction.createdBy);
    const isInflow = transaction.type === "deposit" || transaction.type === "earning";

    return (
        <tr
            onClick={() => onClick(transaction)}
            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
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

            {/* type */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tc.chip}`}>
                    <TypeIcon size={11} />
                    {tc.label}
                </span>
            </td>

            {/* amount + currency icon */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    {/* currency icon */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${cc.iconBg}`}>
                        {CurrencyIcon
                            ? <CurrencyIcon size={11} className={cc.iconColor} />
                            : <span className={`text-[10px] font-black leading-none ${cc.iconColor}`}>{cc.symbol}</span>
                        }
                    </div>
                    <div>
                        <p className={`text-[13px] font-bold leading-tight ${isInflow ? "text-emerald-600" : "text-rose-600"}`}>
                            {isInflow ? "+" : "−"}{formatCurrencyAmount(transaction.amount, transaction.currency)}
                        </p>
                        <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded border ${cc.chip}`}>
                            {cc.label}
                        </span>
                    </div>
                </div>
            </td>

            {/* description */}
            <td className="px-4 py-3.5 max-w-[200px]">
                <p className="text-[12px] text-slate-600 truncate">
                    {transaction.description || "—"}
                </p>
                {transaction.referenceId && (
                    <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                        #{String(transaction.referenceId).slice(-8)}
                    </p>
                )}
            </td>

            {/* date */}
            <td className="px-4 py-3.5 whitespace-nowrap">
                <p className="text-[12px] text-slate-600">{formatDate(transaction.createdAt)}</p>
                <p className="text-[11px] text-slate-400">{formatTime(transaction.createdAt)}</p>
            </td>

            {/* status */}
            <td className="px-4 py-3.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${sc.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                </span>
            </td>

            {/* created by */}
            <td className="px-4 py-3.5">
                <p className="text-[12px] text-slate-600 truncate max-w-[120px]">{adminName}</p>
            </td>
        </tr>
    );
}
