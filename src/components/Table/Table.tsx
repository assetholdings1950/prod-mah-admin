import { IClients } from "@/interface/client";
import { AlertTriangle, MoreHorizontal, Pencil, Receipt, Trash2, Users, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ---------- Client Table ----------
type MoreAction = "transactions" | "balance";

interface ClientTableProps {
    clients: IClients[];
    loading: boolean;
    limit: number;
    search: string;
    onEdit?: (client: IClients) => void;
    onDelete?: (ids: string[]) => Promise<void>;
    onMore?: (client: IClients, action: MoreAction) => void;
    onAssignAccountManager?: (client: IClients) => void;
}

// ─── More dropdown ────────────────────────────────────────────
const MoreMenu = ({ client, onMore }: { client: IClients; onMore: (client: IClients, action: MoreAction) => void }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
                title="More options"
            >
                <MoreHorizontal size={13} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-44">
                    <button
                        onClick={(e) => { e.stopPropagation(); onMore(client, "transactions"); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        <Receipt size={13} className="text-slate-400" />
                        Transactions
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMore(client, "balance"); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        <Wallet size={13} className="text-slate-400" />
                        Fund Balance
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Skeleton ─────────────────────────────────────────────────
const SkeletonRow = () => (
    <tr className="border-b border-slate-100">
        {/* Checkbox */}
        <td className="px-4 py-3.5 w-10">
            <div className="h-3.5 w-3.5 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Client */}
        <td className="px-4 py-3.5">
            <div className="h-3.5 w-32 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Client ID */}
        <td className="px-4 py-3.5 hidden xl:table-cell">
            <div className="h-3.5 w-16 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Account Manager */}
        <td className="px-4 py-3.5 hidden sm:table-cell">
            <div className="h-3.5 w-24 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* KYC Status */}
        <td className="px-4 py-3.5">
            <div className="h-3.5 w-16 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Account Status */}
        <td className="px-4 py-3.5 hidden md:table-cell">
            <div className="h-3.5 w-16 rounded bg-slate-100 animate-pulse" />
        </td>
        {/* Balance */}
        <td className="px-4 py-3.5">
            <div className="h-3.5 w-20 rounded bg-slate-100 animate-pulse" />
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
        <td colSpan={8} className="py-20 text-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Users size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">No clients found</p>
                <p className="text-xs text-slate-400 max-w-xs">
                    {search
                        ? `No results for "${search}". Try adjusting your search or filters.`
                        : "No clients have been added yet."}
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
const KycBadge = ({ status }: { status: IClients["kycStatus"] }) => {
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

// ─── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }: { status: IClients["status"] }) => {
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
    clientName,
    onConfirm,
    onCancel,
    deleting,
}: {
    count: number;
    clientName?: string;
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
                        {count === 1 ? "Delete Client" : `Delete ${count} Clients`}
                    </p>
                    <p className="text-[13px] text-slate-500 mt-1">
                        {count === 1 && clientName
                            ? <>Are you sure you want to permanently delete <span className="font-medium text-slate-700">{clientName}</span>? This action cannot be undone.</>
                            : <>Are you sure you want to permanently delete <span className="font-medium text-slate-700">{count} clients</span>? This action cannot be undone.</>
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
const ClientTable: React.FC<ClientTableProps> = ({
    clients,
    loading,
    limit,
    search,
    onEdit = () => { },
    onDelete,
    onMore = () => { },
    onAssignAccountManager = () => { },
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);

    const allSelected = clients.length > 0 && clients.every((c) => selectedIds.has(c._id));
    const someSelected = clients.some((c) => selectedIds.has(c._id)) && !allSelected;

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(clients.map((c) => c._id)));
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

    const pendingClient = pendingDeleteIds.length === 1
        ? clients.find((c) => c._id === pendingDeleteIds[0])
        : undefined;

    return (
        <>
            {pendingDeleteIds.length > 0 && (
                <ConfirmDeleteModal
                    count={pendingDeleteIds.length}
                    clientName={pendingClient ? `${pendingClient.firstName} ${pendingClient.lastName}` : undefined}
                    onConfirm={handleConfirmDelete}
                    onCancel={closeDeleteModal}
                    deleting={deleting}
                />
            )}

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 border-b border-red-100">
                    <span className="text-[12px] font-medium text-red-700">
                        {selectedIds.size} client{selectedIds.size > 1 ? "s" : ""} selected
                    </span>
                    <button
                        onClick={() => openDeleteModal([...selectedIds])}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Trash2 size={12} />
                        Delete Selected
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-[12px] text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors ml-auto"
                    >
                        Clear selection
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr className="border-b border-slate-100 bg-slate-50">
                            {/* Select-all checkbox */}
                            <th className="px-4 py-3 w-10">
                                <Checkbox
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    onChange={toggleAll}
                                />
                            </th>
                            {[
                                { name: "Client", className: "" },
                                { name: "Client ID", className: "hidden xl:table-cell" },
                                { name: "Account Manager", className: "hidden sm:table-cell" },
                                { name: "KYC Status", className: "" },
                                { name: "Account Status", className: "hidden md:table-cell" },
                                { name: "Balance", className: "" },
                                { name: "Actions", className: "" },
                            ].map((h) => (
                                <th
                                    key={h.name}
                                    className={`text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap ${h.className}`}
                                >
                                    {h.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: limit }).map((_, i) => <SkeletonRow key={i} />)
                            : clients.length === 0
                                ? <EmptyState search={search} />
                                : clients.map((client) => (
                                    <tr
                                        key={client._id}
                                        className={`border-b border-slate-100 transition-colors group ${selectedIds.has(client._id) ? "bg-red-50/40" : "hover:bg-slate-50/70"}`}
                                    >
                                        {/* Checkbox */}
                                        <td className="px-4 py-3.5 w-10">
                                            <Checkbox
                                                checked={selectedIds.has(client._id)}
                                                onChange={() => toggleOne(client._id)}
                                            />
                                        </td>

                                        {/* Client */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar
                                                    name={`${client.firstName} ${client.lastName}`}
                                                    src={client.profileImage}
                                                />
                                                <div>
                                                    <p className="text-[13px] font-medium text-slate-800 leading-tight">
                                                        {client.firstName} {client.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">{client.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Client ID */}
                                        <td className="px-4 py-3.5 hidden xl:table-cell">
                                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                                                {client.clientId}
                                            </span>
                                        </td>
 
                                        {/* Account Manager */}
                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                            {client.accountManager ? (
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar
                                                        name={client.accountManager.fullName || `${client.accountManager.firstName || ""} ${client.accountManager.lastName || ""}`.trim()}
                                                        src={client.accountManager.profileImage}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="max-w-40 truncate text-[12px] font-semibold leading-tight text-slate-700">
                                                            {client.accountManager.fullName || `${client.accountManager.firstName || ""} ${client.accountManager.lastName || ""}`.trim()}
                                                        </p>
                                                        <p className="mt-0.5 text-[10px] font-mono text-slate-400">{client.accountManager.agentId}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => onAssignAccountManager(client)}
                                                    title="Assign an Account Manager"
                                                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    Not assigned
                                                </button>
                                            )}
                                        </td>
 
                                        {/* KYC */}
                                        <td className="px-4 py-3.5">
                                            <KycBadge status={client.kycStatus} />
                                        </td>
 
                                        {/* Account Status */}
                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                            <StatusBadge status={client.status} />
                                        </td>

                                        {/* Balance */}
                                        <td className="px-4 py-3.5">
                                            <p className="text-[13px] font-semibold text-slate-700">
                                                {client.preferredCurrency}{" "}
                                                {client.availableBalance.toLocaleString("en-US", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                Portfolio: {client.preferredCurrency}{" "}
                                                {client.portfolioValue.toLocaleString()}
                                            </p>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onEdit(client)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                                                    title="Edit client"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal([client._id])}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                                    title="Delete client"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                                {onMore && <MoreMenu client={client} onMore={onMore} />}
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

export default ClientTable;
