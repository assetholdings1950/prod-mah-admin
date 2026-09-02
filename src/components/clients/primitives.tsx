import {
    BarChart3,
    FileText,
    FileSignature,
    History,
    Landmark,
    Phone,
    Receipt,
    Settings,
    ShieldCheck,
    TrendingUp,
    User,
    UserRoundCog,
    Wallet,
    X,
    ZoomIn,
} from "lucide-react";
import { Tab } from "./types";

// ─── Class constants ──────────────────────────────────────────
export const inputCls =
    "w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition placeholder:text-slate-300";

export const selectCls =
    "w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition";

// ─── Field wrapper ────────────────────────────────────────────
export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
        {children}
    </div>
);

// ─── Read-only display field ──────────────────────────────────
export const ReadonlyField = ({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
        <div className="w-full text-sm text-slate-600 bg-slate-100/70 border border-slate-200 rounded-lg px-3 py-2.5 font-mono break-all">
            {value ?? <span className="text-slate-300 italic">—</span>}
        </div>
    </div>
);

// ─── Image thumbnail (click → full-screen preview) ────────────
export const ImageThumbnail = ({
    label,
    url,
    onPreview,
}: {
    label: string;
    url: string | null;
    onPreview: (url: string) => void;
}) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
        {url ? (
            <button
                type="button"
                onClick={() => onPreview(url)}
                className="group relative block w-full rounded-lg overflow-hidden border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
                <img src={url} alt={label} className="w-full h-40 object-cover" />
                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-[12px] font-medium">
                    <ZoomIn size={15} /> Preview
                </span>
            </button>
        ) : (
            <div className="h-40 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-300 italic">
                Not uploaded
            </div>
        )}
    </div>
);

// ─── Full-screen image modal ──────────────────────────────────
export const ImageModal = ({ url, onClose }: { url: string; onClose: () => void }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
    >
        <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        >
            <X size={18} />
        </button>
        <img
            src={url}
            alt="Preview"
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        />
    </div>
);

// ─── Toggle switch ────────────────────────────────────────────
export const Toggle = ({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
    description: string;
}) => (
    <div className="sm:col-span-2 flex items-center gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
        <button
            type="button"
            onClick={onChange}
            className={`relative rounded-full transition-colors shrink-0 ${checked ? "bg-green-700" : "bg-slate-300"}`}
            style={{ width: 40, height: 22 }}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
            />
        </button>
        <div>
            <p className="text-[13px] font-medium text-slate-700">{label}</p>
            <p className="text-[11px] text-slate-400">{description}</p>
        </div>
    </div>
);

// ─── Section heading ──────────────────────────────────────────
export const SectionHeading = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-1">{children}</p>
);

// ─── Tab definitions ──────────────────────────────────────────
export const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "personal", label: "Personal", icon: <User size={14} /> },
    { key: "contact", label: "Contact", icon: <Phone size={14} /> },
    { key: "account", label: "Account & Settings", icon: <Settings size={14} /> },
    { key: "account-manager", label: "Account Manager", icon: <UserRoundCog size={14} /> },
    { key: "account-form", label: "Account Form", icon: <FileSignature size={14} /> },
    { key: "kyc", label: "KYC Details", icon: <ShieldCheck size={14} /> },
    { key: "bank", label: "Bank Details", icon: <Landmark size={14} /> },
    { key: "wallets", label: "Withdrawal Wallets", icon: <Wallet size={14} /> },
    { key: "financial", label: "Financial Overview", icon: <BarChart3 size={14} /> },
    { key: "notes", label: "Notes", icon: <FileText size={14} /> },
    { key: "transactions", label: "Transaction History", icon: <Receipt size={14} /> },
    { key: "balance", label: "Fund Balance", icon: <Wallet size={14} /> },
    { key: "portfolio", label: "Portfolios", icon: <TrendingUp size={14} /> },
    { key: "activity", label: "Activity Log", icon: <History size={14} /> },
];
