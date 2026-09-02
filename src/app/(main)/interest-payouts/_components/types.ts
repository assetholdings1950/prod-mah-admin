import {
    Bitcoin, Coins, DollarSign, CircleDot,
    ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import type { PortfolioInterface, PortfolioStatus, InvestmentMode, PayoutType } from "@/interface/portfolio";

// ─── Currency config ──────────────────────────────────────────────────────────

export const CURRENCY_CONFIG: Record<string, {
    label: string; symbol: string;
    iconBg: string; iconColor: string; accentBar: string; chip: string;
    icon?: React.ElementType;
}> = {
    BTC:  { label: "Bitcoin",  symbol: "₿", iconBg: "bg-amber-50",   iconColor: "text-amber-500",   accentBar: "bg-amber-400",   chip: "bg-amber-50 text-amber-700 border-amber-200",  icon: Bitcoin },
    ETH:  { label: "Ethereum", symbol: "Ξ", iconBg: "bg-indigo-50",  iconColor: "text-indigo-500",  accentBar: "bg-indigo-400",  chip: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Coins },
    USDT: { label: "Tether",   symbol: "₮", iconBg: "bg-emerald-50", iconColor: "text-emerald-600", accentBar: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: DollarSign },
    SOL:  { label: "Solana",   symbol: "◎", iconBg: "bg-purple-50",  iconColor: "text-purple-500",  accentBar: "bg-purple-400",  chip: "bg-purple-50 text-purple-700 border-purple-200", icon: CircleDot },
    TRX:  { label: "Tron",     symbol: "T", iconBg: "bg-rose-50",    iconColor: "text-rose-500",    accentBar: "bg-rose-400",    chip: "bg-rose-50 text-rose-700 border-rose-200", icon: ArrowUpRight },
    USD:  { label: "USD",      symbol: "$", iconBg: "bg-slate-100",  iconColor: "text-slate-600",   accentBar: "bg-slate-300",   chip: "bg-slate-50 text-slate-600 border-slate-200", icon: DollarSign },
};

export function getCurrencyConfig(c: string) {
    return CURRENCY_CONFIG[c?.toUpperCase()] ?? {
        label: c, symbol: c?.slice(0, 1) ?? "?",
        iconBg: "bg-slate-100", iconColor: "text-slate-500",
        accentBar: "bg-slate-300", chip: "bg-slate-50 text-slate-600 border-slate-200",
    };
}

export function formatCurrencyAmount(amount: number, currency: string): string {
    const decimals = ["BTC"].includes(currency?.toUpperCase()) ? 6
        : ["ETH", "SOL"].includes(currency?.toUpperCase()) ? 4
            : 2;
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: decimals });
}

// ─── Portfolio status config ──────────────────────────────────────────────────

export const STATUS_CONFIG: Record<PortfolioStatus, { label: string; dot: string; chip: string; badge: string }> = {
    active:    { label: "Active",    dot: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
    paused:    { label: "Paused",    dot: "bg-amber-400",   chip: "bg-amber-50 text-amber-700 border-amber-200",       badge: "bg-amber-100 text-amber-700" },
    matured:   { label: "Matured",   dot: "bg-blue-400",    chip: "bg-blue-50 text-blue-700 border-blue-200",          badge: "bg-blue-100 text-blue-700" },
    closed:    { label: "Closed",    dot: "bg-slate-400",   chip: "bg-slate-100 text-slate-600 border-slate-200",      badge: "bg-slate-100 text-slate-600" },
    cancelled: { label: "Cancelled", dot: "bg-red-400",     chip: "bg-red-50 text-red-700 border-red-200",             badge: "bg-red-100 text-red-700" },
};

export const MODE_CONFIG: Record<InvestmentMode, { label: string; chip: string }> = {
    sip:     { label: "SIP",      chip: "bg-blue-50 text-blue-700 border-blue-200" },
    lumpsum: { label: "Lump Sum", chip: "bg-violet-50 text-violet-700 border-violet-200" },
};

export const PAYOUT_CONFIG: Record<PayoutType, { label: string; chip: string }> = {
    monthly:   { label: "Monthly",   chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    quarterly: { label: "Quarterly", chip: "bg-sky-50 text-sky-700 border-sky-200" },
    maturity:  { label: "At Maturity", chip: "bg-amber-50 text-amber-700 border-amber-200" },
};

export const CATEGORY_CONFIG: Record<string, { label: string; chip: string }> = {
    monthly: { label: "Monthly SIP",    chip: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    lumpsum: { label: "Lump Sum",       chip: "bg-violet-50 text-violet-700 border-violet-200" },
    crypto:  { label: "Digital Assets", chip: "bg-amber-50 text-amber-700 border-amber-200" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getClientName(clientId: PortfolioInterface["clientId"]): string {
    if (typeof clientId === "string") return "Client";
    const { firstName, lastName } = clientId;
    return [firstName, lastName].filter(Boolean).join(" ") || clientId.email?.split("@")[0] || "Client";
}

export function getClientEmail(clientId: PortfolioInterface["clientId"]): string {
    if (typeof clientId === "string") return "";
    return clientId.email ?? "";
}

export function getClientId(clientId: PortfolioInterface["clientId"]): string {
    if (typeof clientId === "string") return "";
    return clientId.clientId ?? "";
}

export function avatarGradient(name: string): string {
    const n = (name || "").charCodeAt(0) % 6;
    const g = [
        "from-violet-500 to-purple-600",
        "from-blue-500 to-indigo-600",
        "from-emerald-500 to-teal-600",
        "from-amber-500 to-orange-600",
        "from-rose-500 to-pink-600",
        "from-sky-500 to-cyan-600",
    ];
    return g[n] ?? g[0];
}

export function getInitials(name: string): string {
    return (name || "?").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

export function formatDate(d: string | null | undefined): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(d: string | null | undefined): string {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function fmtUsd(n: number | null | undefined): string {
    if (n == null || !Number.isFinite(n)) return "$0.00";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function calcPayoutProgress(paid: number, expected: number): number {
    if (!expected || expected <= 0) return 0;
    return Math.min(100, Math.round((paid / expected) * 100));
}

export { ArrowUpRight, ArrowDownRight };
