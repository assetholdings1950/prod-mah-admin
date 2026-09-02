"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Headset,
    Search,
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye,
    Trash2,
    UserCheck,
    MessageSquare,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Shield,
    DollarSign,
    X,
    FileText,
    Send,
    Layers,
    User,
    TrendingUp,
    Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import appClient from "@/lib/appClient";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";

type ConsultationItem = {
    _id: string;
    client?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        avatar?: string;
    };
    name: string;
    email: string;
    phone?: string;
    preferredContactMethod: string;
    preferredTime: string;
    topic: string;
    investmentRange: string;
    riskTolerance: string;
    investmentHorizon: string;
    portfolioSnapshot?: {
        deployedCapital?: number;
        walletBalance?: number;
        activePortfolios?: number;
    };
    query: string;
    status: "Pending" | "In Review" | "Contacted" | "Resolved" | "Closed";
    assignedAdvisor?: string;
    adminNotes?: string;
    createdAt: string;
};

export default function ConsultationsAdminPage() {
    const [requests, setRequests] = useState<ConsultationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [topicFilter, setTopicFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Meta metrics
    const [metaStats, setMetaStats] = useState({
        totalCount: 0,
        pendingCount: 0,
        inReviewCount: 0,
        resolvedCount: 0,
    });

    // Detail & Reply Modal State
    const [selectedRequest, setSelectedRequest] = useState<ConsultationItem | null>(null);
    const [modalAdminNotes, setModalAdminNotes] = useState("");
    const [modalAdvisor, setModalAdvisor] = useState("");
    const [modalStatus, setModalStatus] = useState<ConsultationItem["status"]>("Pending");
    const [savingModal, setSavingModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchConsultations = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                status: statusFilter,
                topic: topicFilter,
            });

            const res = await appClient.get(`/api/consultations?${params.toString()}`);
            if (res.data?.status) {
                setRequests(res.data.data || []);
                if (res.data.meta) {
                    setTotalPages(res.data.meta.totalPages || 1);
                    setMetaStats({
                        totalCount: res.data.meta.totalCount || 0,
                        pendingCount: res.data.meta.pendingCount || 0,
                        inReviewCount: res.data.meta.inReviewCount || 0,
                        resolvedCount: res.data.meta.resolvedCount || 0,
                    });
                }
            }
        } catch (err) {
            console.error("Failed fetching consultations list:", err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter, topicFilter]);

    useEffect(() => {
        fetchConsultations();
    }, [fetchConsultations]);

    const handleQuickStatusChange = async (id: string, newStatus: ConsultationItem["status"]) => {
        try {
            const res = await appClient.patch(`/api/consultations/${id}`, { status: newStatus });
            if (res.data?.status) {
                setRequests((prev) =>
                    prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
                );
                fetchConsultations();
            }
        } catch (err) {
            console.error("Status update error:", err);
        }
    };

    const handleSaveModal = async () => {
        if (!selectedRequest) return;
        setSavingModal(true);
        try {
            const res = await appClient.patch(`/api/consultations/${selectedRequest._id}`, {
                status: modalStatus,
                adminNotes: modalAdminNotes,
                assignedAdvisor: modalAdvisor,
                sendEmail: true,
            });
            if (res.data?.status) {
                toastSuccess(`Response saved and email sent to ${selectedRequest.email}`);
                setSelectedRequest(null);
                fetchConsultations();
            } else {
                toastError(res.data?.message || "Failed to send response.");
            }
        } catch (err: any) {
            console.error("Failed updating consultation detail:", err);
            toastError(err.response?.data?.message || err.message || "Failed to update & send email.");
        } finally {
            setSavingModal(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await appClient.delete(`/api/consultations/${deleteId}`);
            if (res.data?.status) {
                setDeleteId(null);
                fetchConsultations();
            }
        } catch (err) {
            console.error("Failed deleting consultation:", err);
        } finally {
            setDeleting(false);
        }
    };

    const openDetailModal = (item: ConsultationItem) => {
        setSelectedRequest(item);
        setModalAdminNotes(item.adminNotes || "");
        setModalAdvisor(item.assignedAdvisor || "Senior Wealth Specialist");
        setModalStatus(item.status);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Pending":
                return "bg-amber-50 text-amber-700 border-amber-300/60 font-bold";
            case "In Review":
                return "bg-blue-50 text-blue-700 border-blue-300/60 font-bold";
            case "Contacted":
                return "bg-purple-50 text-purple-700 border-purple-300/60 font-bold";
            case "Resolved":
                return "bg-emerald-50 text-emerald-700 border-emerald-300/60 font-bold";
            case "Closed":
                return "bg-slate-100 text-slate-600 border-slate-300/60 font-bold";
            default:
                return "bg-amber-50 text-amber-700 border-amber-300/60 font-bold";
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case "Pending":
                return "bg-amber-500 animate-pulse";
            case "In Review":
                return "bg-blue-500";
            case "Contacted":
                return "bg-purple-500";
            case "Resolved":
                return "bg-emerald-500";
            case "Closed":
                return "bg-slate-400";
            default:
                return "bg-amber-500";
        }
    };

    const formatPhone = (phone?: string) => {
        if (!phone) return null;
        if (phone.length > 16) {
            return phone.substring(0, 16) + "...";
        }
        return phone;
    };

    return (
        <div className="space-y-6 pb-12 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Layers className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            USER MANAGEMENT / CONSULTATION DESK
                        </span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                        <Headset className="h-6 w-6 text-blue-600" />
                        Consultant Queries & Wealth Advisory
                    </h1>
                </div>

                <button
                    onClick={fetchConsultations}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                    Refresh List
                </button>
            </div>

            {/* Executive KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 border-t-4 border-t-blue-600 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Consultations</span>
                        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 border border-blue-100">
                            <Headset className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-3xl font-black text-slate-900">{metaStats.totalCount}</h3>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                            Active Desk
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 border-t-4 border-t-amber-500 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Review</span>
                        <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 border border-amber-100">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-3xl font-black text-amber-600">{metaStats.pendingCount}</h3>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            Action Needed
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 border-t-4 border-t-purple-500 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Review / Contacted</span>
                        <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 border border-purple-100">
                            <UserCheck className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-3xl font-black text-purple-600">{metaStats.inReviewCount}</h3>
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                            In Progress
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 border-t-4 border-t-emerald-500 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resolved Requests</span>
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 border border-emerald-100">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-3xl font-black text-emerald-600">{metaStats.resolvedCount}</h3>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Completed
                        </span>
                    </div>
                </div>
            </div>

            {/* Toolbar Filter & Search Container */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
                    {/* Search Input */}
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search client name, email, phone, topic..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 pl-10 pr-9 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Status Filter Tab Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                        {[
                            { id: "all", label: "All Requests", count: metaStats.totalCount },
                            { id: "Pending", label: "Pending", count: metaStats.pendingCount },
                            { id: "In Review", label: "In Review", count: metaStats.inReviewCount },
                            { id: "Contacted", label: "Contacted" },
                            { id: "Resolved", label: "Resolved", count: metaStats.resolvedCount },
                            { id: "Closed", label: "Closed" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setStatusFilter(tab.id);
                                    setPage(1);
                                }}
                                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    statusFilter === tab.id
                                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-extrabold ${
                                            statusFilter === tab.id
                                                ? "bg-white text-slate-900"
                                                : "bg-slate-200 text-slate-700"
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Premium Data Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50/90 text-slate-400 font-bold border-b border-slate-200 uppercase tracking-widest text-[9.5px]">
                            <tr>
                                <th className="px-5 py-4 min-w-[220px]">Client & Contact</th>
                                <th className="px-5 py-4 min-w-[180px]">Advisory Topic</th>
                                <th className="px-5 py-4 min-w-[260px]">Query Message Preview</th>
                                <th className="px-5 py-4 min-w-[140px]">Status</th>
                                <th className="px-5 py-4 min-w-[110px]">Submitted Date</th>
                                <th className="px-5 py-4 text-right min-w-[130px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-2 text-blue-600" />
                                        Fetching consultation requests...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400 space-y-2">
                                        <Headset className="h-10 w-10 text-slate-300 mx-auto" />
                                        <p className="font-semibold text-slate-600">No consultation requests found matching your filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Client & Contact */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60 shrink-0">
                                                    {item.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-900 text-xs truncate">{item.name}</div>
                                                    <div className="text-slate-500 text-[11px] truncate">{item.email}</div>
                                                    {item.phone && (
                                                        <div className="text-slate-400 text-[10px] font-mono mt-0.5">
                                                            {formatPhone(item.phone)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Topic */}
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50/80 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200/80">
                                                <Briefcase className="h-3 w-3 text-blue-600 shrink-0" />
                                                <span className="truncate max-w-[150px]">{item.topic}</span>
                                            </span>
                                        </td>

                                        {/* Query Snippet */}
                                        <td className="px-5 py-4">
                                            <p className="line-clamp-2 text-slate-600 leading-relaxed text-xs max-w-sm">{item.query}</p>
                                        </td>

                                        {/* Interactive Status Pill */}
                                        <td className="px-5 py-4">
                                            <div className="relative inline-flex items-center">
                                                <select
                                                    value={item.status}
                                                    onChange={(e) =>
                                                        handleQuickStatusChange(
                                                            item._id,
                                                            e.target.value as ConsultationItem["status"]
                                                        )
                                                    }
                                                    className={`rounded-xl border px-3 py-1.5 text-[11px] font-extrabold focus:outline-none cursor-pointer appearance-none pr-6 ${getStatusStyle(
                                                        item.status
                                                    )}`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Review">In Review</option>
                                                    <option value="Contacted">Contacted</option>
                                                    <option value="Resolved">Resolved</option>
                                                    <option value="Closed">Closed</option>
                                                </select>
                                                <div className={`absolute right-2.5 h-1.5 w-1.5 rounded-full pointer-events-none ${getStatusDot(item.status)}`} />
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-5 py-4 text-slate-400 text-[11px] font-semibold whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                                            <button
                                                onClick={() => openDetailModal(item)}
                                                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
                                                title="View Details & Write Response"
                                            >
                                                <Eye className="h-3.5 w-3.5 text-blue-400" />
                                                View
                                            </button>

                                            <button
                                                onClick={() => setDeleteId(item._id)}
                                                className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                                title="Delete Request"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 bg-slate-50/70">
                        <span className="text-xs font-semibold text-slate-500">
                            Showing Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Executive Detail & Response Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                                        <Headset className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900">Consultation Request Detail</h3>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">Ref ID: {selectedRequest._id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Client & Contact Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Client Credentials</span>
                                    <div className="space-y-1 text-xs">
                                        <p className="font-bold text-slate-900">{selectedRequest.name}</p>
                                        <p className="text-slate-600">{selectedRequest.email}</p>
                                        {selectedRequest.phone && <p className="text-slate-500 font-mono text-[11px]">{selectedRequest.phone}</p>}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Advisory Topic</span>
                                    <div className="space-y-1 text-xs">
                                        <p className="font-bold text-blue-700 text-sm">{selectedRequest.topic}</p>
                                        <p className="text-slate-500 text-[11px]">Submitted: {new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Full Query Text */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Client Inquiry Message:</label>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-800 leading-relaxed max-h-48 overflow-y-auto">
                                    {selectedRequest.query}
                                </div>
                            </div>

                            {/* Advisor Assignment & Status Editor */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Assigned Wealth Specialist</label>
                                    <input
                                        type="text"
                                        value={modalAdvisor}
                                        onChange={(e) => setModalAdvisor(e.target.value)}
                                        placeholder="e.g. Senior Wealth Director"
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Advisory Status</label>
                                    <select
                                        value={modalStatus}
                                        onChange={(e) => setModalStatus(e.target.value as ConsultationItem["status"])}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none cursor-pointer"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Review">In Review</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Internal Admin / Advisor Notes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">Advisor Response & Client Notes</label>
                                <textarea
                                    value={modalAdminNotes}
                                    onChange={(e) => setModalAdminNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Enter response notes, resolution summary, or call schedule to display to the client..."
                                    className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-medium text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none leading-relaxed"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveModal}
                                    disabled={savingModal}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {savingModal ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Send
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-center"
                        >
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">Delete Consultation Request?</h3>
                                <p className="text-xs text-slate-500 mt-1">This request will be permanently removed from the system.</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition-colors disabled:opacity-50"
                                >
                                    {deleting ? "Deleting..." : "Delete Permanently"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
