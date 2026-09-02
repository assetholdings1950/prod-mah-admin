export type FormState = {
    name: string;
    slug: string;
    type: "fiat" | "crypto";
    currency: string;
    network: string;
    walletAddress: string;
    accountDetails: string;
    instructions: string;
    processingTime: string;
    status: "active" | "inactive";
    sortOrder: string;
};

export const EMPTY_FORM: FormState = {
    name: "",
    slug: "",
    type: "fiat",
    currency: "USD",
    network: "bank",
    walletAddress: "",
    accountDetails: "",
    instructions: "",
    processingTime: "1-3 business days",
    status: "active",
    sortOrder: "1",
};

export const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export const cls = {
    input: "w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/[0.08] transition-all placeholder:text-slate-300",
    textarea: "w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/[0.08] transition-all placeholder:text-slate-300 resize-none",
    label: "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
};

export const TYPE_OPTIONS = [
    { label: "Fiat", value: "fiat" },
    { label: "Crypto", value: "crypto" },
];

export const FIAT_CURRENCIES = ["USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];
export const CRYPTO_CURRENCIES = ["USDT", "USDC", "BTC", "ETH", "BNB", "TRX", "SOL"];

export const FIAT_NETWORKS = ["bank", "swift", "sepa", "ach", "wire"];
export const CRYPTO_NETWORKS = ["TRC20", "ERC20", "BEP20", "SOL", "BTC", "Polygon"];

export const STATUS_OPTIONS = [
    { label: "Active", value: "active", activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200" },
    { label: "Inactive", value: "inactive", activeClass: "bg-slate-400 text-white border-slate-400" },
];
