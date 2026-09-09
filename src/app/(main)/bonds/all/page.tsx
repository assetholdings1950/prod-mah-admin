"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    Banknote, CalendarClock, Clock, Coins, Pencil,
    RefreshCw, Search, Shield, Star, Trash2, Wallet,
} from "lucide-react";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import Select from "@/components/common/Select";
import Pagination from "@/components/pagination/pagination";
import appClient from "@/lib/appClient";
import { BondInterface } from "@/interface/bond";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

const perPageOptions = [6, 12, 24];
const money = (value?: number | null) => value == null ? "No limit" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const term = (months: number) => months % 12 === 0 ? `${months / 12} Year${months === 12 ? "" : "s"}` : `${months} Months`;
const frequency: Record<BondInterface["couponFrequency"], string> = { monthly: "Monthly", quarterly: "Quarterly", semiannual: "Semi-annually", annual: "Annually", maturity: "At Maturity" };
const statusStyle: Record<BondInterface["status"], string> = {
    draft: "bg-slate-100 text-slate-600", active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-amber-100 text-amber-700", matured: "bg-blue-100 text-blue-700", archived: "bg-rose-100 text-rose-700",
};

function BondCard({ bond, index, onEdit, onDelete }: { bond: BondInterface; index: number; onEdit: () => void; onDelete: () => void }) {
    const [confirming, setConfirming] = useState(false);
    return (
        <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-navy/8 transition-all overflow-hidden flex flex-col">
            <div className="relative bg-gradient-to-br from-navy via-[#15376b] to-[#0a8e91] px-5 pt-5 pb-6 text-white min-h-[180px]">
                <div className="absolute right-[-28px] top-[-28px] w-36 h-36 rounded-full border-[24px] border-white/[0.05]" />
                <div className="relative flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center"><Banknote className="h-5 w-5 text-cyan-200" /></div>
                    <div className="flex items-center gap-1.5">
                        {bond.featured && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-300 text-amber-950 text-[10px] font-extrabold"><Star className="h-2.5 w-2.5 fill-current" /> Featured</span>}
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold capitalize ${statusStyle[bond.status]}`}>{bond.status}</span>
                    </div>
                </div>
                <div className="relative mt-5">
                    <p className="text-[10px] font-bold tracking-[0.18em] text-cyan-200 uppercase">{bond.code}</p>
                    <h2 className="text-xl font-extrabold mt-1 leading-tight line-clamp-2">{bond.name}</h2>
                    <div className="flex items-end justify-between mt-4">
                        <div><p className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Annual Coupon</p><p className="text-3xl font-extrabold">{bond.couponRateAnnual}%<span className="text-xs ml-1 text-white/60">p.a.</span></p></div>
                        <div className="text-right"><p className="text-[9px] uppercase tracking-widest text-white/50 font-bold">USDT Benefit</p><p className="text-xl font-extrabold text-cyan-200">{bond.usdtBenefitEnabled ? `${bond.usdtBenefitPercent}%` : "Off"}</p></div>
                    </div>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1">
                {bond.shortDescription && <div className="text-xs text-slate-500 line-clamp-2 rich-text-preview" dangerouslySetInnerHTML={{ __html: bond.shortDescription }} />}
                <div className="grid grid-cols-2 gap-2">
                    <Metric icon={<Clock />} label="Term" value={term(bond.termMonths)} />
                    <Metric icon={<Wallet />} label="Minimum" value={money(bond.minInvestment)} />
                    <Metric icon={<CalendarClock />} label="Coupon" value={frequency[bond.couponFrequency]} />
                    <Metric icon={<Shield />} label="Early Exit" value={bond.earlyRedemptionAllowed ? "Allowed" : "Not Allowed"} />
                </div>
                <div className="flex-1" />
                <AnimatePresence mode="wait" initial={false}>
                    {confirming ? <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-red-100 pt-3">
                        <p className="text-[11px] font-bold text-red-600 text-center mb-2">Delete this bond?</p>
                        <div className="flex gap-2"><button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold">Cancel</button><button onClick={onDelete} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold">Delete</button></div>
                    </motion.div> : <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 border-t border-slate-100 pt-3">
                        {bond.status === "draft" && <button onClick={() => setConfirming(true)} title="Delete draft" className="w-10 h-10 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>}
                        <button onClick={onEdit} className="flex-1 h-10 rounded-xl bg-navy text-white text-xs font-bold inline-flex items-center justify-center gap-2"><Pencil className="h-3.5 w-3.5" /> Edit Bond</button>
                    </motion.div>}
                </AnimatePresence>
            </div>
        </motion.article>
    );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return <div className="bg-slate-50 rounded-xl px-3 py-2.5"><p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{<span className="[&>svg]:h-2.5 [&>svg]:w-2.5">{icon}</span>}{label}</p><p className="text-xs font-extrabold text-navy mt-1 truncate">{value}</p></div>;
}

export default function BondsListPage() {
    const router = useRouter();
    const [bonds, setBonds] = useState<BondInterface[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(12);
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [riskLevel, setRiskLevel] = useState("all");
    const [couponFrequency, setCouponFrequency] = useState("all");
    const [loading, setLoading] = useState(false);

    useEffect(() => { const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350); return () => clearTimeout(timer); }, [searchInput]);

    const fetchBonds = useCallback(async () => {
        setLoading(true);
        try {
            const response = await appClient.get("/api/bonds/get", { params: { page, limit, search, status: status === "all" ? undefined : status, riskLevel: riskLevel === "all" ? undefined : riskLevel, couponFrequency: couponFrequency === "all" ? undefined : couponFrequency } });
            const result = response.data?.bonds;
            setBonds(result?.docs ?? []);
            setTotalDocs(result?.totalDocs ?? 0);
            setTotalPages(result?.totalPages ?? 0);
        } catch { toastError("Failed to load bonds."); }
        finally { setLoading(false); }
    }, [page, limit, search, status, riskLevel, couponFrequency]);

    useEffect(() => {
        // The list is intentionally refreshed whenever paging or filters change.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchBonds();
    }, [fetchBonds]);

    const remove = async (id: string) => {
        try {
            const response = await appClient.delete("/api/bonds/delete", { data: { ids: [id] } });
            if (!response.data?.status) return toastError(response.data?.message || "Delete failed.");
            toastSuccess("Bond deleted successfully.");
            fetchBonds();
        } catch { toastError("Failed to delete bond."); }
    };

    const clear = () => { setSearchInput(""); setStatus("all"); setRiskLevel("all"); setCouponFrequency("all"); setPage(1); };
    const filtered = searchInput || status !== "all" || riskLevel !== "all" || couponFrequency !== "all";

    return <div className="w-full h-full flex flex-col space-y-5 p-1 text-foreground">
        <WorksSpaceHeader isButtonVisible subHeading="Manage Bond Products" heading="Bonds" buttonText="Create New Bond" handleOpenCreate={() => router.push("/bonds/create")} />
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[190px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search bonds or codes…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-navy/20" /></div>
            <Select size="sm" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: "all", label: "All Statuses" }, { value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "matured", label: "Matured" }, { value: "archived", label: "Archived" }]} />
            <Select size="sm" value={couponFrequency} onChange={(value) => { setCouponFrequency(value); setPage(1); }} options={[{ value: "all", label: "All Frequencies" }, { value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "semiannual", label: "Semi-annually" }, { value: "annual", label: "Annually" }, { value: "maturity", label: "At Maturity" }]} />
            <Select size="sm" value={riskLevel} onChange={(value) => { setRiskLevel(value); setPage(1); }} options={[{ value: "all", label: "All Risk Levels" }, { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "very_high", label: "Very High" }]} />
            {filtered && <button onClick={clear} className="px-3 py-2 text-xs font-bold text-slate-500">Clear</button>}
            <button onClick={fetchBonds} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></button>
            <span className="text-xs font-bold text-slate-400 ml-auto">{totalDocs} bond{totalDocs === 1 ? "" : "s"}</span>
        </div>

        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{[0, 1, 2].map((item) => <div key={item} className="h-[430px] rounded-2xl bg-white border border-slate-100 animate-pulse" />)}</div>
            : bonds.length === 0 ? <div className="py-24 flex flex-col items-center text-center"><div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><Coins className="h-7 w-7 text-navy/30" /></div><p className="mt-4 text-sm font-extrabold text-navy">No bonds found</p><p className="text-xs text-slate-400 mt-1">Create a bond or adjust the filters.</p></div>
            : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{bonds.map((bond, index) => <BondCard key={bond._id} bond={bond} index={index} onEdit={() => router.push(`/bonds/${bond._id}/edit`)} onDelete={() => bond._id && remove(bond._id)} />)}</div>}

        {totalPages > 0 && <div className="bg-white rounded-xl border border-slate-100 shadow-sm"><Pagination page={page} totalPages={totalPages} limit={limit} totalDocs={totalDocs} perPageOptions={perPageOptions} onPageChange={setPage} onLimitChange={(value) => { setLimit(value); setPage(1); }} /></div>}
    </div>;
}
