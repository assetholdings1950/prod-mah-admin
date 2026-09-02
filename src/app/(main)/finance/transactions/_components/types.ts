import {
    ArrowDownCircle, ArrowUpCircle, TrendingUp, Coins,
    Users, UserCog, Shield, DollarSign, ShieldAlert, Percent,
} from "lucide-react";
import type {
    TransactionInterface,
    TransactionUserRef,
    TransactionAdminRef,
    TransactionType,
    TransactionStatus,
} from "@/interface/transaction";

/* ─── transaction type config ─── */
export const TYPE_CONFIG: Record<TransactionType, {
    label: string;
    icon: React.ElementType;
    chip: string;
    dot: string;
    accent: string;
}> = {
    deposit: {
        label: "Deposit",
        icon: ArrowDownCircle,
        chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        dot: "bg-emerald-400",
        accent: "bg-emerald-400",
    },
    withdrawal: {
        label: "Withdrawal",
        icon: ArrowUpCircle,
        chip: "bg-rose-50 text-rose-700 border border-rose-200",
        dot: "bg-rose-400",
        accent: "bg-rose-400",
    },
    investment: {
        label: "Investment",
        icon: TrendingUp,
        chip: "bg-blue-50 text-blue-700 border border-blue-200",
        dot: "bg-blue-400",
        accent: "bg-blue-400",
    },
    earning: {
        label: "Earning",
        icon: Coins,
        chip: "bg-amber-50 text-amber-700 border border-amber-200",
        dot: "bg-amber-400",
        accent: "bg-amber-400",
    },
    penalty: {
        label: "Penalty",
        icon: ShieldAlert,
        chip: "bg-rose-50 text-rose-700 border border-rose-200",
        dot: "bg-rose-400",
        accent: "bg-rose-400",
    },
    charge: {
        label: "Charge",
        icon: Percent,
        chip: "bg-orange-50 text-orange-700 border border-orange-200",
        dot: "bg-orange-400",
        accent: "bg-orange-400",
    },
};

/* ─── status config ─── */
export const STATUS_CONFIG: Record<TransactionStatus, {
    label: string;
    chip: string;
    dot: string;
}> = {
    completed: {
        label: "Completed",
        chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        dot: "bg-emerald-400",
    },
    pending: {
        label: "Pending",
        chip: "bg-amber-50 text-amber-700 border border-amber-200",
        dot: "bg-amber-400",
    },
    failed: {
        label: "Failed",
        chip: "bg-red-50 text-red-700 border border-red-200",
        dot: "bg-red-400",
    },
};

/* ─── user model config ─── */
export const USER_MODEL_CONFIG = {
    Client: {
        icon: Users,
        badge: "bg-blue-50 text-blue-700 border border-blue-200",
        label: "Client",
    },
    Agent: {
        icon: UserCog,
        badge: "bg-violet-50 text-violet-700 border border-violet-200",
        label: "Agent",
    },
    User: {
        icon: Shield,
        badge: "bg-teal-50 text-teal-700 border border-teal-200",
        label: "Admin",
    },
} as const;

/* ─── currency config ─── */
export type KnownCurrency = "USD" | "USDT" | "BTC" | "ETH" | "SOL" | "TRX";

export const CURRENCY_CONFIG: Record<string, {
    label: string;
    symbol: string;
    icon: React.ElementType | null; // null = use symbol text
    iconColor: string;
    iconBg: string;
    chip: string;        // badge classes
    accentBar: string;   // top accent on stat card
    decimals: number;
}> = {
    USD: {
        label: "USD",
        symbol: "$",
        icon: DollarSign,
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100",
        chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        accentBar: "bg-emerald-500",
        decimals: 2,
    },
    USDT: {
        label: "USDT",
        symbol: "₮",
        icon: null,
        iconColor: "text-teal-600",
        iconBg: "bg-teal-100",
        chip: "bg-teal-50 text-teal-700 border border-teal-200",
        accentBar: "bg-teal-500",
        decimals: 2,
    },
    BTC: {
        label: "BTC",
        symbol: "₿",
        icon: null,
        iconColor: "text-orange-600",
        iconBg: "bg-orange-100",
        chip: "bg-orange-50 text-orange-700 border border-orange-200",
        accentBar: "bg-orange-500",
        decimals: 6,
    },
    ETH: {
        label: "ETH",
        symbol: "Ξ",
        icon: null,
        iconColor: "text-indigo-600",
        iconBg: "bg-indigo-100",
        chip: "bg-indigo-50 text-indigo-700 border border-indigo-200",
        accentBar: "bg-indigo-500",
        decimals: 6,
    },
    SOL: {
        label: "SOL",
        symbol: "◎",
        icon: null,
        iconColor: "text-violet-600",
        iconBg: "bg-violet-100",
        chip: "bg-violet-50 text-violet-700 border border-violet-200",
        accentBar: "bg-violet-500",
        decimals: 4,
    },
    TRX: {
        label: "TRX",
        symbol: "T",
        icon: null,
        iconColor: "text-red-600",
        iconBg: "bg-red-100",
        chip: "bg-red-50 text-red-700 border border-red-200",
        accentBar: "bg-red-500",
        decimals: 2,
    },
};

export function getCurrencyConfig(currency: string) {
    return CURRENCY_CONFIG[currency] ?? {
        label: currency,
        symbol: currency.slice(0, 1),
        icon: null,
        iconColor: "text-slate-600",
        iconBg: "bg-slate-100",
        chip: "bg-slate-50 text-slate-700 border border-slate-200",
        accentBar: "bg-slate-400",
        decimals: 2,
    };
}

/* ─── avatar helpers ─── */
const AVATAR_GRADIENTS = [
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
];

export function avatarGradient(name: string): string {
    return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

export function getInitials(name: string): string {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";
}

/* ─── field extractors ─── */
export function getUserName(userId: TransactionInterface["userId"]): string {
    if (typeof userId === "string") return "Unknown";
    const u = userId as TransactionUserRef;
    const joined = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return (u.fullName ?? joined) || (u.email?.split("@")[0] ?? "Unknown");
}

export function getUserEmail(userId: TransactionInterface["userId"]): string {
    if (typeof userId === "string") return "";
    return (userId as TransactionUserRef).email ?? "";
}

export function getAdminName(ref?: TransactionInterface["createdBy"]): string {
    if (!ref || typeof ref === "string") return "System";
    const a = ref as TransactionAdminRef;
    const joined = [a.firstName, a.lastName].filter(Boolean).join(" ");
    return (a.fullName ?? joined) || a.email;
}

/* ─── formatters ─── */
export function formatAmount(n: number): string {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function formatCurrencyAmount(n: number, currency: string): string {
    const dec = getCurrencyConfig(currency).decimals;
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: dec }).format(n);
}

export function formatDate(d?: string): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(d?: string): string {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(d?: string): string {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}
