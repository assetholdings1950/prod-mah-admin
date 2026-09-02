import {
    Clock, CheckCircle2, XCircle,
    Users, UserCog, Shield,
    Building2, Wallet,
} from "lucide-react";
import type {
    WithdrawalRequestInterface,
    WithdrawalUserRef,
    WithdrawalAdminRef,
    WithdrawalBankDetailRef,
    WithdrawalWalletDetailRef,
} from "@/interface/withdrawal";

/* ─── status config ─── */
export const STATUS_CONFIG: Record<"pending" | "approved" | "rejected", {
    label: string;
    icon: React.ElementType;
    chip: string;
    dot: string;
    bar: string;
    banner: string;
}> = {
    pending: {
        label: "Pending",
        icon: Clock,
        chip: "bg-amber-50 text-amber-700 border border-amber-200",
        dot: "bg-amber-400",
        bar: "bg-amber-400",
        banner: "bg-amber-50 text-amber-800 border-amber-200",
    },
    approved: {
        label: "Approved",
        icon: CheckCircle2,
        chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        dot: "bg-emerald-400",
        bar: "bg-emerald-400",
        banner: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    rejected: {
        label: "Rejected",
        icon: XCircle,
        chip: "bg-red-50 text-red-700 border border-red-200",
        dot: "bg-red-400",
        bar: "bg-red-400",
        banner: "bg-red-50 text-red-800 border-red-200",
    },
};

/* ─── user model config ─── */
export const USER_MODEL_CONFIG: Record<string, { icon: React.ElementType; badge: string; label: string }> = {
    Client: { icon: Users,   badge: "bg-blue-50 text-blue-700 border border-blue-200",   label: "Client" },
    Agent:  { icon: UserCog, badge: "bg-violet-50 text-violet-700 border border-violet-200", label: "Agent" },
    User:   { icon: Shield,  badge: "bg-slate-100 text-slate-700 border border-slate-200",  label: "Admin" },
};

/* ─── method config ─── */
export const METHOD_CONFIG = {
    bank:   { label: "Bank Transfer", icon: Building2, chip: "bg-blue-50 text-blue-700 border border-blue-200" },
    wallet: { label: "Crypto Wallet", icon: Wallet,    chip: "bg-violet-50 text-violet-700 border border-violet-200" },
};

/* ─── user helpers ─── */
export function getUserName(u: WithdrawalUserRef | string): string {
    if (typeof u === "string") return "Unknown";
    const joined = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return u.fullName ?? (joined || (u.email ?? "Unknown"));
}

export function getUserEmail(u: WithdrawalUserRef | string): string {
    if (typeof u === "string") return "";
    return u.email ?? "";
}

export function getUserIdStr(u: WithdrawalUserRef | string): string {
    if (typeof u === "string") return u;
    return u._id ?? "";
}

export function getAdminName(ref?: WithdrawalAdminRef | null): string {
    if (!ref) return "—";
    const joined = [ref.firstName, ref.lastName].filter(Boolean).join(" ");
    return ref.fullName ?? (joined || ref.email);
}

/* ─── method display helpers ─── */
export function getBankDisplay(b?: WithdrawalBankDetailRef | null): { line1: string; line2: string } {
    if (!b) return { line1: "—", line2: "" };
    return {
        line1: b.bankName ?? "Bank",
        line2: b.accountNumber ? `••••${b.accountNumber.slice(-4)}` : "",
    };
}

export function getWalletDisplay(w?: WithdrawalWalletDetailRef | null): { line1: string; line2: string } {
    if (!w) return { line1: "—", line2: "" };
    const addr = w.walletAddress ?? "";
    return {
        line1: w.network ?? "Crypto",
        line2: addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "",
    };
}

/* ─── avatar ─── */
const GRADIENTS = [
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-sky-600",
];

export function avatarGradient(name: string): string {
    const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
    return GRADIENTS[code % GRADIENTS.length];
}

export function getInitials(name: string): string {
    return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

/* ─── format helpers ─── */
export function formatAmount(n: number): string {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
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

/* ─── keep TS happy for unused import suppression ─── */
export type { WithdrawalRequestInterface };
