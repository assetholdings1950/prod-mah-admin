import { IAgents } from "@/interface/agent";
import { AlertTriangle, Eye, Pencil, Trash2, Users, Mail, Phone, Calendar } from "lucide-react";
import { useState } from "react";

// ---------- Agent Table ----------
interface AgentsTableProps {
    agents: IAgents[];
    loading: boolean;
    limit: number;
    search: string;
    onEdit?: (agent: IAgents) => void;
    onDelete?: (ids: string[]) => Promise<void>;
    onReviewKyc?: (agent: IAgents) => void;
}

// ─── Skeleton ─────────────────────────────────────────────────
const SkeletonRow = () => (
    <tr className="border-b border-slate-100">
        {/* Checkbox */}
        <td className="px-4 py-3.5 w-10">
            <div className="h-3.5 w-3.5 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Agent */}
        <td className="px-4 py-3.5">
            <div className="h-3.5 w-32 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* ID & Level */}
        <td className="px-4 py-3.5 hidden sm:table-cell">
            <div className="h-3.5 w-16 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Contact */}
        <td className="px-4 py-3.5 hidden md:table-cell">
            <div className="h-3.5 w-28 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* KYC Status */}
        <td className="px-4 py-3.5 hidden lg:table-cell">
            <div className="h-3.5 w-16 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Status */}
        <td className="px-4 py-3.5 hidden md:table-cell">
            <div className="h-3.5 w-16 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Commissions */}
        <td className="px-4 py-3.5">
            <div className="h-3.5 w-20 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Clients count */}
        <td className="px-4 py-3.5 hidden lg:table-cell">
            <div className="h-3.5 w-12 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Actions */}
        <td className="px-4 py-3.5">
            <div className="h-3.5 w-12 rounded bg-slate-100 animate-pulse" />
        </td>
    </tr>
);

// ─── Empty state ───────────────────────────────────────────────
const EmptyState = ({ search }: { search: string }) => (
    <tr>
        <td colSpan={9} className="py-20 text-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Users size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">No agents found</p>
                <p className="text-xs text-slate-400 max-w-xs">
                    {search
                        ? `No results for "${search}". Try adjusting your search or filters.`
                        : "No agents have registered yet."}
                </p>
            </div>
        </td>
    </tr>
);

// ─── Avatar ───────────────────────────────────────────────────
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

// ─── KYC Badge ────────────────────────────────────────────────
const KycBadge = ({ status }: { status: IAgents["kycStatus"] }) => {
    const map = {
        approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
        under_review: { label: "Under Review", cls: "bg-blue-50 text-blue-700 border-blue-200" },
        rejected: { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" },
    };
    const { label, cls } = map[status] ?? map.pending;
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cls}`}>
            {label}
        </span>
    );
};

// ─── Level Badge ──────────────────────────────────────────────
const LevelBadge = ({ level }: { level: IAgents["agentLevel"] }) => {
    const map = {
        basic: "bg-orange-50 text-orange-700 border-orange-200",
        silver: "bg-slate-100 text-slate-700 border-slate-200",
        gold: "bg-amber-50 text-amber-800 border-amber-200",
        diamond: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[level] ?? map.basic}`}>
            {level}
        </span>
    );
};

// ─── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }: { status: IAgents["status"] }) => {
    const map: Record<string, string> = {
        active: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pending: "bg-slate-100 text-slate-600 border-slate-200",
        inactive: "bg-slate-100 text-slate-500 border-slate-200",
        suspended: "bg-orange-50 text-orange-700 border-orange-200",
        blocked: "bg-red-50 text-red-700 border-red-200",
        closed: "bg-zinc-100 text-zinc-500 border-zinc-200",
    };
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${map[status] ?? map.pending}`}>
            {status}
        </span>
    );
};

// ─── Confirmation modal ───────────────────────────────────────
const ConfirmDeleteModal = ({
    count,
    agentName,
    onConfirm,
    onCancel,
    deleting,
}: {
    count: number;
    agentName?: string;
    onConfirm: () => void;
    onCancel: () => void;
    deleting: boolean;
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                    <AlertTriangle size={22} className="text-red-600" />
                </div>
                <div>
                    <p className="text-[15px] font-semibold text-slate-800">
                        {count === 1 ? "Delete Agent" : `Delete ${count} Agents`}
                    </p>
                    <p className="text-[13px] text-slate-500 mt-1">
                        {count === 1 && agentName
                            ? <>Are you sure you want to permanently delete agent <span className="font-medium text-slate-700">{agentName}</span>? This action cannot be undone.</>
                            : <>Are you sure you want to permanently delete <span className="font-medium text-slate-700">{count} agents</span>? This action cannot be undone.</>
                        }
                    </p>
                </div>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    disabled={deleting}
                    className="flex-1 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={deleting}
                    className="flex-1 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl py-2.5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {deleting ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                    ) : (
                        <Trash2 size={13} />
                    )}
                    {deleting ? "Deleting…" : "Delete"}
                </button>
            </div>
        </div>
    </div>
);

// ─── Checkbox ─────────────────────────────────────────────────
const Checkbox = ({ checked, indeterminate, onChange }: { checked: boolean; indeterminate?: boolean; onChange: () => void }) => (
    <input
        type="checkbox"
        checked={checked}
        ref={(el) => { if (el) el.indeterminate = !!indeterminate; }}
        onChange={onChange}
        className="w-3.5 h-3.5 rounded border-slate-300 text-primary accent-primary cursor-pointer"
    />
);

// ─── Main table ───────────────────────────────────────────────
const AgentsTable: React.FC<AgentsTableProps> = ({
    agents,
    loading,
    limit,
    search,
    onEdit = () => { },
    onDelete,
    onReviewKyc = () => { },
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);

    const allSelected = agents.length > 0 && agents.every((a) => selectedIds.has(a._id));
    const someSelected = agents.some((a) => selectedIds.has(a._id)) && !allSelected;

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(agents.map((a) => a._id)));
        }
    };

    const toggleOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const openDeleteModal = (ids: string[]) => setPendingDeleteIds(ids);
    const closeDeleteModal = () => setPendingDeleteIds([]);

    const handleConfirmDelete = async () => {
        if (!onDelete || pendingDeleteIds.length === 0) return;
        setDeleting(true);
        try {
            await onDelete(pendingDeleteIds);
            setSelectedIds((prev) => {
                const next = new Set(prev);
                pendingDeleteIds.forEach((id) => next.delete(id));
                return next;
            });
            closeDeleteModal();
        } finally {
            setDeleting(false);
        }
    };

    const pendingAgent = pendingDeleteIds.length === 1
        ? agents.find((a) => a._id === pendingDeleteIds[0])
        : undefined;

    return (
        <>
            {pendingDeleteIds.length > 0 && (
                <ConfirmDeleteModal
                    count={pendingDeleteIds.length}
                    agentName={pendingAgent ? `${pendingAgent.firstName} ${pendingAgent.lastName}` : undefined}
                    onConfirm={handleConfirmDelete}
                    onCancel={closeDeleteModal}
                    deleting={deleting}
                />
            )}

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 border-b border-red-100 animate-fade-in">
                    <span className="text-[12px] font-medium text-red-700">
                        {selectedIds.size} agent{selectedIds.size > 1 ? "s" : ""} selected
                    </span>
                    <button
                        onClick={() => openDeleteModal([...selectedIds])}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                        <Trash2 size={12} />
                        Delete Selected
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-[12px] text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors ml-auto cursor-pointer"
                    >
                        Clear selection
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {/* Select-all checkbox */}
                            <th className="px-4 py-3 w-10">
                                <Checkbox
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    onChange={toggleAll}
                                />
                            </th>
                            {[
                                { name: "Agent", className: "" },
                                { name: "ID & Level", className: "hidden sm:table-cell" },
                                { name: "Contact", className: "hidden md:table-cell" },
                                { name: "KYC Status", className: "hidden lg:table-cell" },
                                { name: "Status", className: "hidden md:table-cell" },
                                { name: "Commissions", className: "" },
                                { name: "Clients", className: "hidden lg:table-cell" },
                                { name: "Actions", className: "" },
                            ].map((h) => (
                                <th
                                    key={h.name}
                                    className={`text-left px-4 py-3 whitespace-nowrap ${h.className}`}
                                >
                                    {h.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: limit }).map((_, i) => <SkeletonRow key={i} />)
                            : agents.length === 0
                                ? <EmptyState search={search} />
                                : agents.map((agent) => (
                                    <tr
                                        key={agent._id}
                                        className={`border-b border-slate-100 transition-colors group ${selectedIds.has(agent._id) ? "bg-red-50/40" : "hover:bg-slate-50/70"}`}
                                    >
                                        {/* Checkbox */}
                                        <td className="px-4 py-3.5 w-10">
                                            <Checkbox
                                                checked={selectedIds.has(agent._id)}
                                                onChange={() => toggleOne(agent._id)}
                                            />
                                        </td>

                                        {/* Agent */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar
                                                    name={agent.fullName || `${agent.firstName} ${agent.lastName}`}
                                                    src={agent.profileImage}
                                                />
                                                <div>
                                                    <p className="text-[13px] font-semibold text-slate-800 leading-tight">
                                                        {agent.firstName} {agent.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                        <Calendar size={10} className="text-slate-400 shrink-0" />
                                                        Joined {new Date(agent.joiningDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </p>
                                                    {agent.sponsorAgent && (
                                                        <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                                                            Sponsor: {agent.sponsorAgent.firstName} {agent.sponsorAgent.lastName} ({agent.sponsorAgent.referralCode})
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Agent ID & Level */}
                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 leading-none">
                                                    {agent.agentId}
                                                </span>
                                                <LevelBadge level={agent.agentLevel} />
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                            <div className="flex flex-col gap-1 max-w-[180px]">
                                                <p className="text-[12px] font-medium text-slate-700 break-all select-all flex items-center gap-1.5" title={agent.email}>
                                                    <Mail size={12} className="text-slate-400 shrink-0" />
                                                    {agent.email}
                                                </p>
                                                {agent.phoneNumber && (
                                                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                                                        <Phone size={11} className="text-slate-400 shrink-0" />
                                                        {agent.countryCode ? `${agent.countryCode} ` : ""}{agent.phoneNumber}
                                                    </p>
                                                )}
                                                {agent.country && (
                                                    <p className="text-[10px] text-slate-400 ml-[18px]">
                                                        {agent.country}
                                                    </p>
                                                )}
                                            </div>
                                        </td>

                                        {/* KYC */}
                                        <td className="px-4 py-3.5 hidden lg:table-cell">
                                            <div className="flex flex-col items-start gap-1">
                                                <KycBadge status={agent.kycStatus} />
                                                {agent.kycStatus === "under_review" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onReviewKyc(agent)}
                                                        className="px-2.5 py-1 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/10 rounded-md transition-all cursor-pointer flex items-center gap-1 mt-1"
                                                        title="Review KYC Documents"
                                                    >
                                                        <Eye size={11} />
                                                        Review KYC
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Account Status */}
                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                            <StatusBadge status={agent.status} />
                                        </td>

                                        {/* Balance */}
                                        <td className="px-4 py-3.5">
                                            <p className="text-[13px] font-semibold text-slate-700 leading-tight">
                                                {agent.preferredCurrency}{" "}
                                                {(agent.totalCommissionEarned ?? 0).toLocaleString("en-US", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </p>
                                            <p className="text-[10px] text-emerald-600 mt-0.5">
                                                Available: {agent.preferredCurrency}{" "}
                                                {(agent.availableCommissionBalance ?? 0).toLocaleString("en-US", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </p>
                                        </td>

                                        {/* Clients Count */}
                                        <td className="px-4 py-3.5 hidden lg:table-cell">
                                            <span className="text-[12px] font-medium text-slate-700">
                                                {agent.totalClients ?? 0} client{(agent.totalClients ?? 0) !== 1 ? "s" : ""}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onReviewKyc(agent)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all cursor-pointer"
                                                    title="Review KYC Documents"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    onClick={() => onEdit(agent)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                                                    title="Edit settings"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal([agent._id])}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
                                                    title="Delete agent"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default AgentsTable;
