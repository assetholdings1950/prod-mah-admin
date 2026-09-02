"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, TrendingDown, TrendingUp, Wallet, RotateCcw } from "lucide-react";
import appClient from "@/lib/appClient";
import { getCurrencyConfig, CURRENCY_CONFIG, formatCurrencyAmount } from "@/app/(main)/finance/transactions/_components/types";
import { useAppSelector } from "@/store/hooks/hooks";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";
import ConfirmModal from "@/app/(main)/finance/deposits/_components/ConfirmModal";

interface FundWallet {
    _id: string;
    currency: string;
    balance: number;
    totalDeposited: number;
    totalWithdrawn: number;
}

type ConfirmState = {
    open: boolean; title: string; description: string;
    confirmLabel: string; variant: "danger" | "warning" | "success"; onConfirm: () => void;
};
const CLOSED_CONFIRM: ConfirmState = {
    open: false, title: "", description: "", confirmLabel: "", variant: "danger", onConfirm: () => {},
};

interface Props {
    clientId: string;
    client: any;
    userModel?: "Client" | "Agent";
    onRefreshClient?: () => void;
}

function WalletCard({ w, loading }: { w: FundWallet; loading?: boolean }) {
    const cc = getCurrencyConfig(w.currency);
    const CIcon = CURRENCY_CONFIG[w.currency]?.icon;

    return (
        <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`h-[3px] ${cc.accentBar}`} />

            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cc.iconBg}`}>
                            {CIcon
                                ? <CIcon size={18} className={cc.iconColor} />
                                : <span className={`text-[18px] font-black leading-none ${cc.iconColor}`}>{cc.symbol}</span>
                            }
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-slate-800">{cc.label}</p>
                            <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${cc.chip}`}>
                                {w.currency}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Available Balance</p>
                    {loading
                        ? <div className="h-8 w-32 rounded-lg bg-slate-100 animate-pulse" />
                        : <p className="text-2xl font-black leading-none text-emerald-700">
                            {cc.symbol}{formatCurrencyAmount(w.balance, w.currency)}
                        </p>
                    }
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <TrendingUp size={12} className="text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Deposited</span>
                        </div>
                        <p className="text-[14px] font-bold text-emerald-800">
                            {cc.symbol}{formatCurrencyAmount(w.totalDeposited, w.currency)}
                        </p>
                    </div>

                    <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <TrendingDown size={12} className="text-rose-600" />
                            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">Withdrawn</span>
                        </div>
                        <p className="text-[14px] font-bold text-rose-800">
                            {cc.symbol}{formatCurrencyAmount(w.totalWithdrawn, w.currency)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BalanceTab({ clientId, client, userModel = "Client", onRefreshClient }: Props) {
    const currentUser = useAppSelector((s) => s.auth.user);
    const isSuperAdmin = currentUser?.role?.some((r) => r.roleCode === "superadmin") ?? false;
    const [confirmModal, setConfirmModal] = useState<ConfirmState>(CLOSED_CONFIRM);
    const [resetting, setResetting] = useState(false);

    const [wallets, setWallets] = useState<FundWallet[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const fetchBalances = useCallback(async () => {
        setLoading(true);
        try {
            const res = await appClient.get(`/api/transactions/fund-balances?userId=${clientId}&userModel=${userModel}`);
            setWallets(res.data?.wallets ?? []);
        } catch {
            // non-critical
        } finally {
            setLoading(false);
            setFetched(true);
        }
    }, [clientId, userModel]);

    useEffect(() => { fetchBalances(); }, [fetchBalances]);

    const handleResetFundBalance = () => {
        setConfirmModal({
            open: true,
            title: "Reset Fund Balance",
            description: "Reset all wallet balances (balance, total deposited, total withdrawn) to zero for this client? This cannot be undone.",
            confirmLabel: "Reset to Zero",
            variant: "danger",
            onConfirm: doResetFundBalance,
        });
    };

    const doResetFundBalance = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setResetting(true);
        try {
            await appClient.patch("/api/clients/reset-fund-balances", { userId: clientId, userModel });
            toastSuccess("Fund balances reset to zero.");
            fetchBalances();
            onRefreshClient?.();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Reset failed.");
        } finally {
            setResetting(false);
        }
    };

    const handleResetPortfolioValue = () => {
        setConfirmModal({
            open: true,
            title: "Reset Portfolio Value",
            description: "Reset portfolio value and available balance to zero for this client? This cannot be undone.",
            confirmLabel: "Reset to Zero",
            variant: "danger",
            onConfirm: doResetPortfolioValue,
        });
    };

    const doResetPortfolioValue = async () => {
        setConfirmModal(CLOSED_CONFIRM);
        setResetting(true);
        try {
            await appClient.patch("/api/clients/reset-portfolio-value", { clientId });
            toastSuccess("Portfolio value reset to zero.");
            onRefreshClient?.();
        } catch (e: unknown) {
            toastError(e instanceof Error ? e.message : "Reset failed.");
        } finally {
            setResetting(false);
        }
    };

    const currency = client.preferredCurrency ?? "USD";
    const money = (n: number) =>
        `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const cards = userModel === "Agent"
        ? [
            { label: "Available Commission", value: money(client.availableCommissionBalance ?? 0), accent: "bg-emerald-500" },
            { label: "Total Commission Earned", value: money(client.totalCommissionEarned ?? 0), accent: "bg-blue-500" },
            { label: "Total Deposited", value: money(client.totalDeposits ?? 0), accent: "bg-teal-500" },
            { label: "Total Withdrawn", value: money(client.totalWithdrawals ?? 0), accent: "bg-rose-400" },
        ]
        : [
            { label: "Available Balance", value: money(client.availableBalance ?? 0), accent: "bg-emerald-500" },
            { label: "Portfolio Value", value: money(client.portfolioValue ?? 0), accent: "bg-blue-500" },
            { label: "Total Deposited", value: money(client.totalDeposits ?? 0), accent: "bg-teal-500" },
            { label: "Total Withdrawn", value: money(client.totalWithdrawals ?? 0), accent: "bg-rose-400" },
        ];

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {cards.map((item) => (
                    <div key={item.label} className="relative bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden p-4">
                        <div className={`absolute top-0 inset-x-0 h-[3px] ${item.accent}`} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                        <p className="text-[15px] font-black text-slate-800 leading-tight truncate">{item.value}</p>
                    </div>
                ))}
            </div>

            {isSuperAdmin && (
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleResetFundBalance}
                        disabled={resetting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm"
                    >
                        <RotateCcw size={12} />
                        Reset Fund Balance to Zero
                    </button>
                    <button
                        onClick={handleResetPortfolioValue}
                        disabled={resetting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm"
                    >
                        <RotateCcw size={12} />
                        Reset Portfolio Value to Zero
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-slate-500" />
                    <p className="text-[13px] font-semibold text-slate-700">Fund Balances</p>
                </div>
                <button
                    onClick={fetchBalances}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {loading && !fetched ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-2xl shadow-sm h-44 animate-pulse" />
                    ))}
                </div>
            ) : wallets.length === 0 ? (
                <div className="py-16 text-center bg-white border border-slate-100 rounded-2xl">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <Wallet size={24} className="text-slate-400" />
                        </div>
                        <p className="text-[13px] font-medium text-slate-600">No fund balances yet</p>
                        <p className="text-[11px] text-slate-400">Balances appear here once a deposit is approved.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wallets.map((w) => (
                        <WalletCard key={w._id} w={w} loading={loading} />
                    ))}
                </div>
            )}

            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(CLOSED_CONFIRM)}
            />
        </div>
    );
}
