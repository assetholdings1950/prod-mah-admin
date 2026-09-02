import type { DepositRequestInterface, DepositUserRef, DepositPaymentMethodRef, DepositAdminRef } from "@/interface/deposit";
import { Clock, CheckCircle2, XCircle, Users, UserCog, Shield } from "lucide-react";

/* ─── status config ─── */

export const STATUS_CONFIG = {
    pending: {
        label: "Pending",
        icon: Clock,
        chip: "bg-amber-50 text-amber-700 border border-amber-200",
        dot: "bg-amber-400",
        bar: "bg-amber-400",
        rowBorder: "border-l-amber-400",
        banner: "bg-amber-50 border-amber-200 text-amber-800",
    },
    approved: {
        label: "Approved",
        icon: CheckCircle2,
        chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        dot: "bg-emerald-400",
        bar: "bg-emerald-400",
        rowBorder: "border-l-emerald-400",
        banner: "bg-emerald-50 border-emerald-200 text-emerald-800",
    },
    rejected: {
        label: "Rejected",
        icon: XCircle,
        chip: "bg-red-50 text-red-700 border border-red-200",
        dot: "bg-red-400",
        bar: "bg-red-400",
        rowBorder: "border-l-red-400",
        banner: "bg-red-50 border-red-200 text-red-800",
    },
} as const;

/* ─── user model config ─── */

export const USER_MODEL_CONFIG = {
    Client: {
        icon: Users,
        bg: "bg-blue-500",
        badge: "bg-blue-50 text-blue-700 border border-blue-200",
        label: "Client",
    },
    Agent: {
        icon: UserCog,
        bg: "bg-violet-500",
        badge: "bg-violet-50 text-violet-700 border border-violet-200",
        label: "Agent",
    },
    User: {
        icon: Shield,
        bg: "bg-teal-500",
        badge: "bg-teal-50 text-teal-700 border border-teal-200",
        label: "Admin",
    },
} as const;

/* ─── avatar ─── */

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

export function getUserName(userId: DepositRequestInterface["userId"]): string {
    if (typeof userId === "string") return "Unknown";
    const u = userId as DepositUserRef;
    const joined = [u.firstName, u.lastName].filter(Boolean).join(" ");
    return (u.fullName ?? joined) || (u.email?.split("@")[0] ?? "Unknown");
}

export function getUserEmail(userId: DepositRequestInterface["userId"]): string {
    if (typeof userId === "string") return "";
    return (userId as DepositUserRef).email ?? "";
}

export function getUserIdStr(userId: DepositRequestInterface["userId"]): string {
    if (typeof userId === "string") return userId;
    const u = userId as DepositUserRef;
    return u.clientId ?? u.agentId ?? u._id ?? "";
}

export function getMethodName(pm: DepositRequestInterface["paymentMethodId"]): string {
    if (typeof pm === "string") return "—";
    return (pm as DepositPaymentMethodRef).name;
}

export function getMethodDetails(pm: DepositRequestInterface["paymentMethodId"]): { currency: string; network: string; type: "fiat" | "crypto" } {
    if (typeof pm === "string") return { currency: "", network: "", type: "fiat" };
    const m = pm as DepositPaymentMethodRef;
    return { currency: m.currency, network: m.network, type: m.type };
}

export function getAdminName(ref?: DepositAdminRef | null): string {
    if (!ref) return "—";
    const joined = [ref.firstName, ref.lastName].filter(Boolean).join(" ");
    return (ref.fullName ?? joined) || ref.email;
}

/* ─── formatters ─── */

export function formatAmount(n: number): string {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
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
        month: "long", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}
