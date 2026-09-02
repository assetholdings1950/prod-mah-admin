"use client";

import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import appClient from "@/lib/appClient";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IAgents } from "@/interface/agent";
import Pagination from "@/components/pagination/pagination";
import { toastError } from "@/utils/toast-message/taost-message";
import {
    Award,
    DollarSign,
    Wallet,
    Users,
    Search,
    ShieldCheck,
    Activity,
    Lock,
    Pencil,
    RefreshCw,
    TrendingUp,
    Filter,
    Percent
} from "lucide-react";
import Select from "@/components/common/Select";

const perPageOptions = [5, 10, 20, 50];

// ─── Level Badge ──────────────────────────────────────────────
const LevelBadge = ({ level }: { level: IAgents["agentLevel"] }) => {
    const map = {
        basic: "bg-orange-50 text-orange-700 border-orange-200",
        silver: "bg-slate-100 text-slate-700 border-slate-200",
        gold: "bg-amber-50 text-amber-800 border-amber-200",
        diamond: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[level] ?? map.basic}`}>
            {level}
        </span>
    );
};

// ─── Avatar Component ──────────────────────────────────────────
const Avatar = ({ name, src }: { name: string; src?: string | null }) => {
    const initials =
        name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
            />
        );
    }
    return (
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-500">
            {initials}
        </div>
    );
};

export default function AgentCommissionsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [agents, setAgents] = useState<IAgents[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filters — initialised from URL query params
    const [levelFilter, setLevelFilter] = useState(searchParams.get("agentLevel") ?? "all");
    const [salaryFilter, setSalaryFilter] = useState(searchParams.get("salaryStatus") ?? "all");
    const [eligibilityFilter, setEligibilityFilter] = useState(searchParams.get("eligibility") ?? "all");

    // Summary Statistics
    const [summaryStats, setSummaryStats] = useState({
        totalEarned: 0,
        availableBalance: 0,
        pendingApprovals: 0,
        activatedSalaries: 0,
        eligibleThisMonth: 0
    });

    // Sync active filters → URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (levelFilter && levelFilter !== "all") params.set("agentLevel", levelFilter);
        if (salaryFilter && salaryFilter !== "all") params.set("salaryStatus", salaryFilter);
        if (eligibilityFilter && eligibilityFilter !== "all") params.set("eligibility", eligibilityFilter);
        const qs = params.toString();
        router.replace(`/agents/commissions${qs ? `?${qs}` : ""}`, { scroll: false } as Parameters<typeof router.replace>[1]);
    }, [levelFilter, salaryFilter, eligibilityFilter, router]);

    const handleGetAgents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await appClient.get("/api/agents/get", {
                params: {
                    page,
                    limit,
                    search,
                    agentLevel: levelFilter !== "all" ? levelFilter : undefined,
                },
            });
            if (response.data.status) {
                let fetchedDocs: IAgents[] = response.data.agents?.docs ?? response.data.agents ?? [];

                // Frontend filters for Salary status as backend might not filter it natively via query
                if (salaryFilter !== "all") {
                    const activatedTarget = salaryFilter === "activated";
                    fetchedDocs = fetchedDocs.filter(a => !!a.salaryActivated === activatedTarget);
                }
                if (eligibilityFilter !== "all") {
                    const eligibleTarget = eligibilityFilter === "eligible";
                    fetchedDocs = fetchedDocs.filter(a => !!a.isSalaryEligibleThisMonth === eligibleTarget);
                }

                setAgents(fetchedDocs);
                setTotalDocs(response.data.agents?.totalDocs ?? fetchedDocs.length);
                setTotalPages(response.data.agents?.totalPages ?? 1);

                // Compute summary stats dynamically based on fetched set
                const stats = fetchedDocs.reduce((acc, curr) => {
                    acc.totalEarned += curr.totalCommissionEarned ?? 0;
                    acc.availableBalance += curr.availableCommissionBalance ?? 0;
                    acc.pendingApprovals += curr.pendingCommission ?? 0;
                    if (curr.salaryActivated) acc.activatedSalaries += 1;
                    if (curr.isSalaryEligibleThisMonth) acc.eligibleThisMonth += 1;
                    return acc;
                }, {
                    totalEarned: 0,
                    availableBalance: 0,
                    pendingApprovals: 0,
                    activatedSalaries: 0,
                    eligibleThisMonth: 0
                });

                setSummaryStats(stats);
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
            toastError("Failed to fetch agents commissions statistics.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, levelFilter, salaryFilter, eligibilityFilter]);

    useEffect(() => {
        handleGetAgents();
    }, [handleGetAgents]);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const clearFilters = () => {
        setLevelFilter("all");
        setSalaryFilter("all");
        setEligibilityFilter("all");
        setSearchInput("");
        setPage(1);
    };

    return (
        <div className="w-full h-full flex flex-col space-y-6 p-1 text-foreground">
            <WorksSpaceHeader
                isButtonVisible={false}
                subHeading="Monitor partner commission tiers, wallet earnings, and monthly salary targets"
                heading="Agent Commissions & Salary Tracking"
                buttonText=""
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Earning Volume */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl border border-indigo-100">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-medium block">Total Commission Earned</span>
                        <span className="text-lg font-bold text-slate-800 block mt-0.5">
                            USD {summaryStats.totalEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Available & Pending balance */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl border border-emerald-100">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-medium block">Available / Pending Wallet</span>
                        <span className="text-sm font-semibold text-slate-700 block mt-0.5">
                            Avail: USD {summaryStats.availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
                            Pend: USD {summaryStats.pendingApprovals.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Lifetime Salary Activated Count */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                    <div className="bg-orange-50 text-orange-600 p-3 rounded-xl border border-orange-100">
                        <Award size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-medium block">Salary Activated Partners</span>
                        <span className="text-lg font-bold text-slate-800 block mt-0.5">
                            {summaryStats.activatedSalaries} Agents
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                            Reached lifetime target of ≥ 2 sales
                        </span>
                    </div>
                </div>

                {/* Salary Eligible This Month */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100">
                        <Activity size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-medium block">Salary Eligible (This Month)</span>
                        <span className="text-lg font-bold text-slate-800 block mt-0.5">
                            {summaryStats.eligibleThisMonth} Agents
                        </span>
                        <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                            Reached monthly target of ≥ 2 sales
                        </span>
                    </div>
                </div>
            </div>

            {/* Toolbar + Table container */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                
                {/* Custom Commissions Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <Search size={14} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, ID..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>

                        {/* Filters & Refresh */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Tier Levels */}
                            <Select
                                size="sm"
                                value={levelFilter}
                                onChange={setLevelFilter}
                                options={[
                                    { value: "all",     label: "All Levels" },
                                    { value: "basic",   label: "Basic Level" },
                                    { value: "silver",  label: "Silver Level" },
                                    { value: "gold",    label: "Gold Level" },
                                    { value: "diamond", label: "Diamond Level" },
                                ]}
                            />

                            {/* Salary Status */}
                            <Select
                                size="sm"
                                value={salaryFilter}
                                onChange={setSalaryFilter}
                                options={[
                                    { value: "all",       label: "All Salaries" },
                                    { value: "activated", label: "Salary Activated" },
                                    { value: "locked",    label: "Salary Locked" },
                                ]}
                            />

                            {/* Eligibility */}
                            <Select
                                size="sm"
                                value={eligibilityFilter}
                                onChange={setEligibilityFilter}
                                options={[
                                    { value: "all",        label: "All Eligibility" },
                                    { value: "eligible",   label: "Eligible This Month" },
                                    { value: "ineligible", label: "Ineligible This Month" },
                                ]}
                            />

                            {/* Clear Filters */}
                            {(levelFilter !== "all" || salaryFilter !== "all" || eligibilityFilter !== "all" || searchInput) && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-red-500 hover:text-red-700 underline font-medium px-2 py-2 cursor-pointer"
                                >
                                    Clear Filters
                                </button>
                            )}

                            {/* Refresh */}
                            <button
                                onClick={handleGetAgents}
                                className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                title="Refresh Data"
                            >
                                <RefreshCw size={13} className={`text-slate-500 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="text-left px-5 py-3.5 whitespace-nowrap">Agent Portal ID</th>
                                <th className="text-left px-5 py-3.5 whitespace-nowrap">Tier / Rates</th>
                                <th className="text-left px-5 py-3.5 whitespace-nowrap">Commissions Profile</th>
                                <th className="text-left px-5 py-3.5 whitespace-nowrap">Salary Activation</th>
                                <th className="text-left px-5 py-3.5 whitespace-nowrap">Monthly Progress</th>
                                <th className="text-left px-5 py-3.5 whitespace-nowrap">Network Stats</th>
                                <th className="text-center px-5 py-3.5 whitespace-nowrap w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[13px]">
                            {loading ? (
                                Array.from({ length: limit }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-50">
                                        <td colSpan={7} className="px-5 py-4">
                                            <div className="h-4 bg-slate-50 rounded animate-pulse w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : agents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Filter size={20} />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">No agents commissions records found</p>
                                            <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                agents.map((agent) => (
                                    <tr key={agent._id} className="hover:bg-slate-50/50 transition-colors group">
                                        {/* Agent ID & Name */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={agent.fullName || `${agent.firstName} ${agent.lastName}`}
                                                    src={agent.profileImage}
                                                />
                                                <div>
                                                    <p className="font-semibold text-slate-800 leading-tight">
                                                        {agent.firstName} {agent.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                        <span className="font-mono text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 leading-none">
                                                            {agent.agentId}
                                                        </span>
                                                        <span>·</span>
                                                        Joined {new Date(agent.joiningDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Tier & Rates */}
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <LevelBadge level={agent.agentLevel} />
                                                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                    <Percent size={10} />
                                                    {agent.commissionPercentage}% Base SIP
                                                </span>
                                            </div>
                                        </td>

                                        {/* Commissions Profile */}
                                        <td className="px-5 py-4 font-medium">
                                            <div className="space-y-1">
                                                <p className="text-slate-700">
                                                    Earned: <span className="font-bold text-slate-800">{agent.preferredCurrency} {(agent.totalCommissionEarned ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                                </p>
                                                <p className="text-[11px] text-emerald-600">
                                                    Balance: {agent.preferredCurrency} {(agent.availableCommissionBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                </p>
                                                {agent.pendingCommission > 0 && (
                                                    <p className="text-[11px] text-amber-600">
                                                        Pending: {agent.preferredCurrency} {(agent.pendingCommission ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Salary Activation */}
                                        <td className="px-5 py-4">
                                            {agent.salaryActivated ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                    <ShieldCheck size={12} />
                                                    Activated
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                                    <Lock size={11} />
                                                    Locked
                                                </span>
                                            )}
                                        </td>

                                        {/* Monthly Progress */}
                                        <td className="px-5 py-4">
                                            <div className="space-y-1.5">
                                                {/* Sales tracker */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] text-slate-500 font-medium">
                                                        Monthly Sales: {agent.salesThisMonth || 0} / 2
                                                    </span>
                                                    {/* Progress bar */}
                                                    <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${agent.isSalaryEligibleThisMonth ? "bg-emerald-500" : "bg-slate-300"}`}
                                                            style={{ width: `${Math.min(100, ((agent.salesThisMonth || 0) / 2) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Eligibility badge */}
                                                {agent.isSalaryEligibleThisMonth ? (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded">
                                                        Eligible for Salary
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded">
                                                        Not Eligible
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Network Stats */}
                                        <td className="px-5 py-4 text-slate-500 font-medium">
                                            <div className="space-y-1">
                                                <p className="text-slate-700 flex items-center gap-1 text-xs">
                                                    <Users size={12} className="text-slate-400" />
                                                    {agent.totalClients ?? 0} Client{(agent.totalClients ?? 0) !== 1 ? "s" : ""}
                                                </p>
                                                <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                                                    <TrendingUp size={11} className="text-slate-400" />
                                                    USD {(agent.totalInvestmentVolume ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Edit Action */}
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => router.push(`/agents/${agent._id}/edit?tab=financial`)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer mx-auto"
                                                title="Edit Commissions Settings"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                {agents.length > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        limit={limit}
                        totalDocs={totalDocs}
                        perPageOptions={perPageOptions}
                        onPageChange={setPage}
                        onLimitChange={(newLimit) => {
                            setLimit(newLimit);
                            setPage(1);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
