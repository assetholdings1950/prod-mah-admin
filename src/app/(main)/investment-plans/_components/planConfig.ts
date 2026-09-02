import { BarChart3, Banknote, Bitcoin } from "lucide-react";
import { InvestmentPlanInterface } from "@/interface/investmentPlan";

export const RISK_CONFIG = {
    low: { label: "Low Risk", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    medium: { label: "Medium Risk", className: "bg-amber-50 text-amber-700 border-amber-200" },
    high: { label: "High Risk", className: "bg-orange-50 text-orange-700 border-orange-200" },
    very_high: { label: "Very High", className: "bg-red-50 text-red-700 border-red-200" },
};

export const STATUS_CONFIG = {
    active: { label: "Active", dot: "bg-emerald-500", text: "text-emerald-700" },
    draft: { label: "Draft", dot: "bg-amber-500", text: "text-amber-700" },
    inactive: { label: "Inactive", dot: "bg-slate-400", text: "text-slate-500" },
};

export const CATEGORY_CONFIG: Record<
    InvestmentPlanInterface["category"],
    { label: string; Icon: React.ElementType; className: string }
> = {
    monthly: { label: "Monthly SIP", Icon: BarChart3, className: "bg-indigo-50 text-indigo-700 border-indigo-100" },
    lumpsum: { label: "Lump Sum", Icon: Banknote, className: "bg-sky-50 text-sky-700 border-sky-100" },
    crypto: { label: "Crypto", Icon: Bitcoin, className: "bg-violet-50 text-violet-700 border-violet-100" },
};

export const PAYOUT_LABEL: Record<InvestmentPlanInterface["payoutType"], string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    maturity: "At Maturity",
};

export const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const fmtROI = (p: InvestmentPlanInterface) =>
    p.roiType === "fixed" ? `${p.roiMin}%` : `${p.roiMin}% – ${p.roiMax}%`;

export const fmtDuration = (min: number, max: number) =>
    min === max ? `${min} Mo` : `${min} – ${max} Mo`;
