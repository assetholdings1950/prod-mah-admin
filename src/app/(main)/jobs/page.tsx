"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    Briefcase,
    Clock,
    Loader2,
    MapPin,
    Pencil,
    RefreshCw,
    Search,
    Trash2,
    X,
} from "lucide-react";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import Select from "@/components/common/Select";
import RichTextEditor from "@/components/common/RichTextEditor";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

// ========================= TYPES =========================

interface Job {
    _id: string;
    title: string;
    description: string;
    location: string;
    type: "Full-time" | "Part-time" | "Contract" | "Internship";
    status: "Active" | "Closed";
    createdAt?: string;
    updatedAt?: string;
}

type JobFormState = {
    title: string;
    description: string;
    location: string;
    type: Job["type"];
    status: Job["status"];
};

const EMPTY_FORM: JobFormState = {
    title: "",
    description: "",
    location: "",
    type: "Full-time",
    status: "Active",
};

const JOB_TYPES: Job["type"][] = ["Full-time", "Part-time", "Contract", "Internship"];

const TYPE_BADGE: Record<Job["type"], string> = {
    "Full-time": "bg-sky-50 text-sky-700 border-sky-200",
    "Part-time": "bg-violet-50 text-violet-700 border-violet-200",
    "Contract": "bg-amber-50 text-amber-700 border-amber-200",
    "Internship": "bg-pink-50 text-pink-700 border-pink-200",
};

const stripHtml = (value: string) =>
    value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

// ========================= STATUS TOGGLE =========================

const StatusToggle = ({
    job,
    onToggled,
}: {
    job: Job;
    onToggled: (id: string, newStatus: Job["status"]) => void;
}) => {
    const [loading, setLoading] = useState(false);
    const isActive = job.status === "Active";

    const handle = async () => {
        setLoading(true);
        try {
            const newStatus: Job["status"] = isActive ? "Closed" : "Active";
            const res = await appClient.put(`/api/jobs/update?id=${job._id}`, { status: newStatus });
            if (res.data?.success) {
                onToggled(job._id, newStatus);
                toastSuccess(`Job ${newStatus === "Active" ? "reopened" : "closed"}.`);
            } else {
                toastError(res.data?.message ?? "Failed to update status.");
            }
        } catch {
            toastError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handle}
            disabled={loading}
            className="flex items-center gap-1.5 disabled:opacity-60"
        >
            {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            ) : (
                <div
                    className={`relative rounded-full transition-all duration-300 shadow-inner ${isActive ? "bg-emerald-500 shadow-emerald-500/30" : "bg-slate-300"}`}
                    style={{ width: 30, height: 17 }}
                >
                    <span className={`absolute top-[1.5px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-300 ${isActive ? "translate-x-[13px]" : "translate-x-0"}`} />
                </div>
            )}
            <span className={`text-[10px] font-bold tracking-wide ${isActive ? "text-emerald-500" : "text-slate-400"}`}>
                {isActive ? "OPEN" : "CLOSED"}
            </span>
        </button>
    );
};

// ========================= DELETE CONFIRM =========================

const DeleteConfirm = ({
    onConfirm,
    onCancel,
    loading,
}: {
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -6 }}
        transition={{ duration: 0.14, type: "spring", stiffness: 400 }}
        className="absolute right-0 top-10 z-30 w-52 bg-white border border-red-100 rounded-2xl shadow-2xl shadow-red-500/15 p-3.5"
    >
        <div className="flex items-start gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-800">Delete job?</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">This cannot be undone.</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-1.5 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
                Cancel
            </button>
            <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-1"
            >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Delete
            </button>
        </div>
    </motion.div>
);

// ========================= JOB FORM MODAL =========================

const JobFormModal = ({
    job,
    onClose,
    onSaved,
}: {
    job: Job | null;
    onClose: () => void;
    onSaved: () => void;
}) => {
    const isEdit = !!job;
    const [form, setForm] = useState<JobFormState>(
        job
            ? { title: job.title, description: job.description, location: job.location, type: job.type, status: job.status }
            : EMPTY_FORM
    );
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !stripHtml(form.description) || !form.location.trim()) {
            toastError("Title, description and location are required.");
            return;
        }
        setSaving(true);
        try {
            const res = isEdit
                ? await appClient.put(`/api/jobs/update?id=${job._id}`, form)
                : await appClient.post("/api/jobs/create", form);
            if (res.data?.success) {
                toastSuccess(isEdit ? "Job updated." : "Job published. It is now live on the client hiring page.");
                onSaved();
                onClose();
            } else {
                toastError(res.data?.message ?? "Failed to save job.");
            }
        } catch (err) {
            toastError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
                className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-navy" />
                        </div>
                        <div>
                            <h2 className="text-sm font-extrabold text-navy tracking-tight">
                                {isEdit ? "Edit Job Opening" : "New Job Opening"}
                            </h2>
                            <p className="text-[11px] text-foreground/40 font-medium">
                                {isEdit ? "Changes reflect instantly on the client hiring page." : "Published jobs appear on the client hiring page."}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4 overflow-y-auto p-6">
                    <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-widest text-foreground/40 mb-1.5">
                            Job Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            placeholder="e.g. Senior Financial Analyst"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                        />
                    </div>

                    <div>
                        <RichTextEditor
                            label="Description *"
                            value={form.description}
                            onChange={(value) => set("description", value)}
                            placeholder="Role summary, responsibilities, requirements…"
                            minHeight="220px"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-widest text-foreground/40 mb-1.5">
                            Location <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) => set("location", e.target.value)}
                            placeholder="e.g. Singapore · Hybrid"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-foreground/40 mb-1.5">
                                Employment Type
                            </label>
                            <Select
                                fullWidth
                                value={form.type}
                                onChange={(v) => set("type", v as Job["type"])}
                                options={JOB_TYPES.map((t) => ({ value: t, label: t }))}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-foreground/40 mb-1.5">
                                Status
                            </label>
                            <Select
                                fullWidth
                                value={form.status}
                                onChange={(v) => set("status", v as Job["status"])}
                                options={[
                                    { value: "Active", label: "Active (visible to clients)" },
                                    { value: "Closed", label: "Closed (hidden)" },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-navy hover:bg-navy/95 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {isEdit ? "Save Changes" : "Publish Job"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// ========================= JOB ROW =========================

const JobRow = ({
    job,
    index,
    isDeleting,
    onEdit,
    onDelete,
    onStatusToggled,
}: {
    job: Job;
    index: number;
    isDeleting: boolean;
    onEdit: (job: Job) => void;
    onDelete: (id: string) => void;
    onStatusToggled: (id: string, newStatus: Job["status"]) => void;
}) => {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className={`group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 p-5 ${isDeleting ? "opacity-30 pointer-events-none" : ""}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-navy tracking-tight truncate">{job.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${TYPE_BADGE[job.type]}`}>
                            {job.type}
                        </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-foreground/45">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                        {job.createdAt && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Posted {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                        )}
                    </div>
                    <div
                        className="rich-text-preview mt-2.5 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-foreground/55"
                        dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 flex-shrink-0">
                    <StatusToggle job={job} onToggled={onStatusToggled} />
                    <div className="flex items-center gap-1 relative">
                        <button
                            onClick={() => onEdit(job)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-navy hover:bg-navy/6 border border-transparent hover:border-navy/12 transition-all duration-200"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100/70 transition-all duration-200"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <AnimatePresence>
                                {confirmDelete && (
                                    <DeleteConfirm
                                        loading={isDeleting}
                                        onConfirm={() => {
                                            onDelete(job._id);
                                            setConfirmDelete(false);
                                        }}
                                        onCancel={() => setConfirmDelete(false)}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ========================= SKELETON / EMPTY =========================

const RowSkeleton = () => (
    <div className="animate-pulse bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="h-4 bg-slate-100 rounded-full w-1/3 mb-3" />
        <div className="h-3 bg-slate-100 rounded-full w-1/4 mb-3" />
        <div className="h-3 bg-slate-100 rounded-full w-3/4" />
    </div>
);

const EmptyState = ({ hasFilters }: { hasFilters: boolean }) => (
    <div className="flex flex-col items-center justify-center py-24 gap-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)" }}
        >
            <Briefcase className="h-7 w-7 text-navy/25" />
        </div>
        <div className="text-center">
            <p className="font-black text-navy text-sm tracking-tight">No job openings found</p>
            <p className="text-xs text-foreground/40 mt-1.5">
                {hasFilters ? "Adjust your filters or search." : "Publish your first opening — it will appear on the client hiring page."}
            </p>
        </div>
    </div>
);

// ========================= MAIN PAGE =========================

const JobsPage = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [modalJob, setModalJob] = useState<Job | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await appClient.get("/api/jobs/list");
            if (res.data?.success) {
                setJobs(res.data.data ?? []);
            } else {
                toastError(res.data?.message ?? "Failed to load jobs.");
            }
        } catch {
            toastError("Failed to load jobs.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await appClient.delete(`/api/jobs/delete?id=${id}`);
            if (res.data?.success) {
                toastSuccess("Job deleted.");
                setJobs((prev) => prev.filter((j) => j._id !== id));
            } else {
                toastError(res.data?.message ?? "Delete failed.");
            }
        } catch {
            toastError("Something went wrong.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleStatusToggled = (id: string, newStatus: Job["status"]) => {
        setJobs((prev) => prev.map((j) => (j._id === id ? { ...j, status: newStatus } : j)));
    };

    const search = searchInput.trim().toLowerCase();
    const filtered = jobs.filter((job) => {
        if (statusFilter !== "all" && job.status !== statusFilter) return false;
        if (typeFilter !== "all" && job.type !== typeFilter) return false;
        if (search && !`${job.title} ${job.location} ${stripHtml(job.description)}`.toLowerCase().includes(search)) return false;
        return true;
    });

    const hasFilters = statusFilter !== "all" || typeFilter !== "all" || !!search;
    const activeCount = jobs.filter((j) => j.status === "Active").length;

    return (
        <div className="w-full flex flex-col gap-5 p-1 text-foreground">
            <WorksSpaceHeader
                isButtonVisible
                subHeading="Hiring"
                heading="Job Openings"
                buttonText="Add Job"
                handleOpenCreate={() => { setModalJob(null); setModalOpen(true); }}
            />

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/35 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search jobs…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
                    />
                </div>

                <Select
                    size="sm"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[
                        { value: "all", label: "All Types" },
                        ...JOB_TYPES.map((t) => ({ value: t, label: t })),
                    ]}
                />

                <Select
                    size="sm"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: "all", label: "All Status" },
                        { value: "Active", label: "Active" },
                        { value: "Closed", label: "Closed" },
                    ]}
                />

                {hasFilters && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => { setStatusFilter("all"); setTypeFilter("all"); setSearchInput(""); }}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground/60 hover:text-foreground border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Clear
                    </motion.button>
                )}

                <button
                    onClick={fetchJobs}
                    disabled={loading}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-navy border border-slate-200 hover:border-navy/30 hover:bg-navy/5 transition-all disabled:opacity-40"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>

                <span className="text-xs font-bold text-foreground/35 ml-auto tabular-nums">
                    {activeCount} open · {jobs.length} total
                </span>
            </div>

            {/* ── Job list ── */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    [...Array(4)].map((_, i) => <RowSkeleton key={i} />)
                ) : filtered.length === 0 ? (
                    <EmptyState hasFilters={hasFilters} />
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filtered.map((job, i) => (
                            <JobRow
                                key={job._id}
                                job={job}
                                index={i}
                                isDeleting={deletingId === job._id}
                                onEdit={(j) => { setModalJob(j); setModalOpen(true); }}
                                onDelete={handleDelete}
                                onStatusToggled={handleStatusToggled}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* ── Add / Edit modal ── */}
            <AnimatePresence>
                {modalOpen && (
                    <JobFormModal
                        job={modalJob}
                        onClose={() => setModalOpen(false)}
                        onSaved={fetchJobs}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default JobsPage;
