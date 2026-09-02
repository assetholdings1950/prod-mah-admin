export type ChargeRow = {
    particular:    string;
    chargePercent: string;
};

export type FormState = {
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    category: "monthly" | "lumpsum" | "crypto";
    minAmount: string;
    maxAmount: string;
    currency: "USD";
    roiType: "fixed" | "range";
    roiMin: string;
    roiMax: string;
    roiPeriod: "annum";
    payoutType: "monthly" | "quarterly" | "maturity";
    durationMinMonths: string;
    durationMaxMonths: string;
    lockInMonths: string;
    exitPenaltyPercent: string;
    riskLevel: "low" | "medium" | "high" | "very_high";
    termsAndConditions: string;
    status: "draft" | "active" | "inactive";
    featured: boolean;
    sortOrder: string;
    charges: ChargeRow[];
};

export const EMPTY_FORM: FormState = {
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    category: "monthly",
    minAmount: "",
    maxAmount: "",
    currency: "USD",
    roiType: "fixed",
    roiMin: "",
    roiMax: "",
    roiPeriod: "annum",
    payoutType: "monthly",
    durationMinMonths: "12",
    durationMaxMonths: "60",
    lockInMonths: "",
    exitPenaltyPercent: "",
    riskLevel: "medium",
    termsAndConditions: "",
    status: "draft",
    featured: false,
    sortOrder: "0",
    charges: [],
};

export const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export const cls = {
    input: "w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/[0.08] transition-all placeholder:text-slate-300",
    textarea: "w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/[0.08] transition-all placeholder:text-slate-300 resize-none",
    label: "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
};

export const CATEGORY_OPTIONS = [
    { label: "Monthly SIP", value: "monthly" },
    { label: "Lump Sum", value: "lumpsum" },
    { label: "Crypto", value: "crypto" },
];

export const ROI_TYPE_OPTIONS = [
    { label: "Fixed Rate", value: "fixed" },
    { label: "Range (Min–Max)", value: "range" },
];

export const PAYOUT_OPTIONS = [
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
    { label: "At Maturity", value: "maturity" },
];

export const RISK_OPTIONS = [
    { label: "Low", value: "low", activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200" },
    { label: "Medium", value: "medium", activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200" },
    { label: "High", value: "high", activeClass: "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200" },
    { label: "Very High", value: "very_high", activeClass: "bg-red-500 text-white border-red-500 shadow-sm shadow-red-200" },
];

export const STATUS_OPTIONS = [
    { label: "Draft", value: "draft", activeClass: "bg-slate-600 text-white border-slate-600" },
    { label: "Active", value: "active", activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200" },
    { label: "Inactive", value: "inactive", activeClass: "bg-slate-400 text-white border-slate-400" },
];
