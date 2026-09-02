"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Check,
    ClipboardCheck,
    ExternalLink,
    Eye,
    FilePlus2,
    Loader2,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Save,
    Trash2,
    X,
    XCircle,
} from "lucide-react";
import {
    AssignmentTemplate,
    CandidateAssignment,
    HiringCandidateOption,
    hiringApi,
} from "@/lib/hiringApi";
import {
    toastSuccess,
    toastWarning,
} from "@/utils/toast-message/taost-message";
import CandidateSelect from "@/components/hiring/CandidateSelect";

const formatDate = (value?: string) =>
    value
        ? new Intl.DateTimeFormat("en-SG", {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "—";

const toDateTimeLocal = (value: string) => {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

type CandidateAssignmentAction =
    | { type: "delete"; assignment: CandidateAssignment }
    | { type: "reset"; assignment: CandidateAssignment }
    | { type: "bulk-delete"; ids: string[] };

export default function AssessmentsPage() {
    const [templates, setTemplates] = useState<AssignmentTemplate[]>([]);
    const [assignments, setAssignments] = useState<CandidateAssignment[]>([]);
    const [candidates, setCandidates] = useState<HiringCandidateOption[]>([]);
    const [candidateFromUrl, setCandidateFromUrl] = useState("");
    const [tab, setTab] = useState<"library" | "assigned">("library");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [assignOpen, setAssignOpen] = useState<string | null>(null);
    const [reviewOpen, setReviewOpen] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AssignmentTemplate | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
    const [candidateAction, setCandidateAction] =
        useState<CandidateAssignmentAction | null>(null);
    const [candidateActionBusy, setCandidateActionBusy] = useState(false);
    const [resetDueAt, setResetDueAt] = useState("");

    const load = async (requestedReference = candidateFromUrl) => {
        setLoading(true);
        setError("");
        try {
            const [templateData, assignmentData, candidateData, requestedCandidate] =
                await Promise.all([
                    hiringApi.templates(),
                    hiringApi.assignments({ limit: 100 }),
                    hiringApi.candidateOptions({ limit: 100 }),
                    requestedReference
                        ? hiringApi
                              .application(requestedReference)
                              .then(dossier => dossier.application)
                              .catch(() => null)
                        : Promise.resolve(null),
                ]);
            setTemplates(templateData);
            setAssignments(assignmentData);
            setCandidates(
                requestedCandidate &&
                    !candidateData.some(item => item._id === requestedCandidate._id)
                    ? [requestedCandidate, ...candidateData]
                    : candidateData,
            );
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Could not load assessments.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const reference = searchParams.get("candidate") ?? "";
        setTab(searchParams.get("tab") === "assigned" ? "assigned" : "library");
        setCandidateFromUrl(reference);
        void load(reference);

        const syncTabFromUrl = () => {
            const currentTab = new URLSearchParams(window.location.search).get(
                "tab",
            );
            setTab(currentTab === "assigned" ? "assigned" : "library");
            setSelectedAssignmentIds([]);
        };
        window.addEventListener("popstate", syncTabFromUrl);
        return () => window.removeEventListener("popstate", syncTabFromUrl);
    }, []);

    const changeTab = (nextTab: "library" | "assigned") => {
        setTab(nextTab);
        setSelectedAssignmentIds([]);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", nextTab);
        window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    };

    const visibleTemplates = useMemo(
        () =>
            templates.filter(item =>
                `${item.title} ${item.role}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
            ),
        [templates, query],
    );

    const deleteTemplate = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await hiringApi.deleteTemplate(deleteTarget._id);
            setTemplates(previous =>
                previous.filter(item => item._id !== deleteTarget._id),
            );
            setAssignOpen(current =>
                current === deleteTarget._id ? null : current,
            );
            toastSuccess("Assignment deleted from the library.", {
                description:
                    "Previously assigned candidate papers keep their saved snapshot.",
            });
            setDeleteTarget(null);
        } catch (requestError) {
            toastWarning(
                requestError instanceof Error
                    ? requestError.message
                    : "Could not delete the assignment.",
            );
        } finally {
            setDeleting(false);
        }
    };

    const toggleCandidateAssignment = (id: string) => {
        setSelectedAssignmentIds(current =>
            current.includes(id)
                ? current.filter(item => item !== id)
                : [...current, id],
        );
    };

    const toggleAllCandidateAssignments = () => {
        setSelectedAssignmentIds(current =>
            current.length === assignments.length
                ? []
                : assignments.map(item => item._id),
        );
    };

    const runCandidateAssignmentAction = async () => {
        if (!candidateAction) return;
        setCandidateActionBusy(true);
        try {
            if (candidateAction.type === "delete") {
                await hiringApi.deleteAssignment(candidateAction.assignment._id);
                toastSuccess("Candidate assignment deleted.", {
                    description: "No candidate notification was sent.",
                });
            } else if (candidateAction.type === "bulk-delete") {
                await hiringApi.bulkDeleteAssignments(candidateAction.ids);
                toastSuccess(
                    `${candidateAction.ids.length} candidate assignment${candidateAction.ids.length === 1 ? "" : "s"} deleted.`,
                    { description: "No candidate notifications were sent." },
                );
            } else {
                await hiringApi.resetAssignment(candidateAction.assignment._id, {
                    dueAt: new Date(resetDueAt).toISOString(),
                });
                toastSuccess("Candidate submission reset.", {
                    description:
                        "Answers and review data were cleared. No notification was sent.",
                });
            }
            setCandidateAction(null);
            setSelectedAssignmentIds([]);
            setReviewOpen(null);
            await load();
        } catch (requestError) {
            toastWarning(
                requestError instanceof Error
                    ? requestError.message
                    : "Could not complete the assignment action.",
            );
        } finally {
            setCandidateActionBusy(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-10">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        <ClipboardCheck className="h-3.5 w-3.5 text-navy" />
                        Hiring
                    </div>
                    <h1 className="mt-1 text-2xl font-extrabold text-navy">
                        Assessments
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        Reusable assignment papers and candidate submissions.
                    </p>
                </div>
                <Link
                    href="/assessments/create"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-xs font-bold text-white"
                >
                    <FilePlus2 className="h-4 w-4" />
                    Create assignment
                </Link>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                    <button
                        onClick={() => changeTab("library")}
                        className={`rounded-lg px-4 py-2 text-xs font-bold ${tab === "library" ? "bg-navy text-white" : "text-slate-500"}`}
                    >
                        Assignment library ({templates.length})
                    </button>
                    <button
                        onClick={() => changeTab("assigned")}
                        className={`rounded-lg px-4 py-2 text-xs font-bold ${tab === "assigned" ? "bg-navy text-white" : "text-slate-500"}`}
                    >
                        Candidate assignments ({assignments.length})
                    </button>
                </div>
                {tab === "library" && (
                    <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            placeholder="Search library"
                            className="bg-transparent text-xs outline-none"
                        />
                    </label>
                )}
            </div>

            {tab === "assigned" && assignments.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-[10px] font-bold text-navy">
                        <input
                            type="checkbox"
                            checked={
                                assignments.length > 0 &&
                                selectedAssignmentIds.length === assignments.length
                            }
                            onChange={toggleAllCandidateAssignments}
                            className="h-4 w-4 rounded border-slate-300 accent-navy"
                        />
                        Select all candidate assignments
                    </label>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold text-slate-400">
                            {selectedAssignmentIds.length} selected
                        </span>
                        {selectedAssignmentIds.length > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setCandidateAction({
                                        type: "bulk-delete",
                                        ids: selectedAssignmentIds,
                                    })
                                }
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-[10px] font-bold text-white"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete selected
                            </button>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="flex min-h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
            ) : tab === "library" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {visibleTemplates.map(item => (
                        <article
                            key={item._id}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                        {item.role}
                                    </p>
                                    <h2 className="mt-1 font-heading text-lg font-bold text-navy">
                                        {item.title}
                                    </h2>
                                </div>
                                <span
                                    className={`rounded-md px-2 py-1 text-[10px] font-bold ${item.status === "Published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                                >
                                    {item.status}
                                </span>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                                <Metric label="Questions" value={item.questions.length} />
                                <Metric label="Marks" value={item.totalMarks} />
                                <Metric label="Minutes" value={item.estimatedMinutes} />
                            </div>
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <Link
                                    href={`/assessments/${item._id}/edit`}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-navy hover:border-blue-200 hover:bg-blue-50"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(item)}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-[10px] font-bold text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                                <button
                                    onClick={() => setAssignOpen(item._id)}
                                    disabled={item.status !== "Published"}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy px-3 text-[10px] font-bold text-white disabled:opacity-40"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Assign to candidate
                                </button>
                            </div>
                            {assignOpen === item._id && (
                                <AssignForm
                                    template={item}
                                    candidates={candidates}
                                    initialReference={candidateFromUrl}
                                    onClose={() => setAssignOpen(null)}
                                    onSaved={async () => {
                                        setAssignOpen(null);
                                        changeTab("assigned");
                                        await load();
                                    }}
                                />
                            )}
                        </article>
                    ))}
                    {visibleTemplates.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center lg:col-span-2">
                            <p className="text-sm font-bold text-navy">
                                No assignments found
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Try a different search or create a new assignment paper.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {assignments.map(item => (
                        <article
                            key={item._id}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedAssignmentIds.includes(item._id)}
                                        onChange={() => toggleCandidateAssignment(item._id)}
                                        aria-label={`Select ${item.candidateName} assignment`}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-navy"
                                    />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                            {item.applicationReference}
                                        </p>
                                        <h2 className="mt-1 text-sm font-bold text-navy">
                                            {item.candidateName} · {item.title}
                                        </h2>
                                        <p className="mt-1 text-[10px] text-slate-400">
                                            {item.role} · Due {formatDate(item.dueAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                                        {item.status}
                                    </span>
                                    {["Submitted", "Under review"].includes(item.status) && (
                                        <button
                                            onClick={() =>
                                                setReviewOpen(current =>
                                                    current === item._id
                                                        ? null
                                                        : item._id,
                                                )
                                            }
                                            className="inline-flex h-8 items-center gap-2 rounded-lg bg-navy px-3 text-[10px] font-bold text-white"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            {reviewOpen === item._id
                                                ? "Close review"
                                                : item.status === "Under review"
                                                  ? "Continue review"
                                                  : "Review submission"}
                                        </button>
                                    )}
                                    {[
                                        "Submitted",
                                        "Under review",
                                        "Passed",
                                        "Revision requested",
                                        "Not passed",
                                    ].includes(item.status) && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                {
                                                    setResetDueAt(
                                                        toDateTimeLocal(item.dueAt),
                                                    );
                                                    setCandidateAction({
                                                    type: "reset",
                                                    assignment: item,
                                                    });
                                                }
                                            }
                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-200 px-2.5 text-[10px] font-bold text-amber-700 hover:bg-amber-50"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Reset
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCandidateAction({
                                                type: "delete",
                                                assignment: item,
                                            })
                                        }
                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-[10px] font-bold text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                            {item.answers?.length ? (
                                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-[10px] text-slate-500">
                                    {item.answers.length} answer(s) submitted{" "}
                                    {item.submittedAt
                                        ? `on ${formatDate(item.submittedAt)}`
                                        : ""}
                                    .
                                </p>
                            ) : null}
                            {reviewOpen === item._id && (
                                <AssignmentReviewPanel
                                    assignment={item}
                                    onClose={() => setReviewOpen(null)}
                                    onSaved={async () => {
                                        setReviewOpen(null);
                                        await load();
                                    }}
                                />
                            )}
                        </article>
                    ))}
                </div>
            )}

            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-assignment-title"
                >
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                aria-label="Close delete confirmation"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <h2
                            id="delete-assignment-title"
                            className="mt-5 text-lg font-bold text-navy"
                        >
                            Delete assignment?
                        </h2>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                            “{deleteTarget.title}” will be permanently removed from
                            the reusable library. Candidate papers already assigned
                            from it will keep their saved snapshot.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-navy"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void deleteTemplate()}
                                disabled={deleting}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white disabled:opacity-60"
                            >
                                {deleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                {deleting ? "Deleting…" : "Delete assignment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {candidateAction && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="candidate-assignment-action-title"
                >
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div
                                className={`flex h-11 w-11 items-center justify-center rounded-xl ${candidateAction.type === "reset" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}
                            >
                                {candidateAction.type === "reset" ? (
                                    <RotateCcw className="h-5 w-5" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5" />
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setCandidateAction(null)}
                                disabled={candidateActionBusy}
                                aria-label="Close confirmation"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <h2
                            id="candidate-assignment-action-title"
                            className="mt-5 text-lg font-bold text-navy"
                        >
                            {candidateAction.type === "reset"
                                ? "Reset submitted assignment?"
                                : candidateAction.type === "bulk-delete"
                                  ? `Delete ${candidateAction.ids.length} candidate assignments?`
                                  : "Delete candidate assignment?"}
                        </h2>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                            {candidateAction.type === "reset"
                                ? `All submitted answers, marks, feedback, and review history for “${candidateAction.assignment.title}” will be cleared. The candidate can start the assignment again.`
                                : candidateAction.type === "bulk-delete"
                                  ? "The selected candidate assignments and their submissions will be permanently removed."
                                  : `“${candidateAction.assignment.title}” for ${candidateAction.assignment.candidateName} will be permanently removed.`}
                        </p>
                        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-[10px] font-semibold text-slate-500">
                            This administrative action is silent. No candidate email or
                            notification will be sent.
                        </p>

                        {candidateAction.type === "reset" && (
                            <label className="mt-4 block">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                    New submission deadline
                                </span>
                                <input
                                    type="datetime-local"
                                    required
                                    value={resetDueAt}
                                    onChange={event => setResetDueAt(event.target.value)}
                                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setCandidateAction(null)}
                                disabled={candidateActionBusy}
                                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-navy"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void runCandidateAssignmentAction()}
                                disabled={
                                    candidateActionBusy ||
                                    (candidateAction.type === "reset" && !resetDueAt)
                                }
                                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white disabled:opacity-50 ${candidateAction.type === "reset" ? "bg-amber-600" : "bg-red-600"}`}
                            >
                                {candidateActionBusy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : candidateAction.type === "reset" ? (
                                    <RotateCcw className="h-4 w-4" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                {candidateActionBusy
                                    ? "Working…"
                                    : candidateAction.type === "reset"
                                      ? "Reset submission"
                                      : candidateAction.type === "bulk-delete"
                                        ? "Delete selected"
                                        : "Delete assignment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AssignmentReviewPanel({
    assignment,
    onClose,
    onSaved,
}: {
    assignment: CandidateAssignment;
    onClose: () => void;
    onSaved: () => void;
}) {
    const questions = assignment.templateSnapshot?.questions ?? [];
    const answerByQuestion = new Map(
        (assignment.answers ?? []).map(answer => [answer.questionId, answer]),
    );
    const existingReviewByQuestion = new Map(
        (assignment.questionReviews ?? []).map(review => [
            review.questionId,
            review,
        ]),
    );
    const [marks, setMarks] = useState<Record<string, string>>(() =>
        questions.reduce<Record<string, string>>((result, question) => {
            const id = String(question._id);
            const existing = existingReviewByQuestion.get(id);
            if (question.type !== "mcq" && existing) {
                result[id] = String(existing.awardedMarks);
            }
            return result;
        }, {}),
    );
    const [questionFeedback, setQuestionFeedback] = useState<
        Record<string, string>
    >(() =>
        questions.reduce<Record<string, string>>((result, question) => {
            const id = String(question._id);
            result[id] = existingReviewByQuestion.get(id)?.feedback ?? "";
            return result;
        }, {}),
    );
    const [overallFeedback, setOverallFeedback] = useState(
        assignment.feedback ?? "",
    );
    const [saving, setSaving] = useState("");
    const [error, setError] = useState("");

    const scoreForQuestion = (question: AssignmentTemplate["questions"][number]) => {
        const id = String(question._id);
        const answer = answerByQuestion.get(id);
        if (question.type === "mcq") {
            return answer?.selectedOption === question.referenceAnswer
                ? question.marks
                : 0;
        }
        return marks[id] === "" || marks[id] === undefined
            ? null
            : Number(marks[id]);
    };

    const reviewComplete = questions.every(
        question => question.type === "mcq" || scoreForQuestion(question) !== null,
    );
    const totalScore = questions.reduce(
        (total, question) => total + (scoreForQuestion(question) ?? 0),
        0,
    );

    const saveReview = async (
        status: "Under review" | "Passed" | "Revision requested" | "Not passed",
    ) => {
        setSaving(status);
        setError("");
        try {
            await hiringApi.reviewAssignment(assignment._id, {
                status,
                feedback: overallFeedback.trim(),
                questionReviews: questions
                    .filter(question => question.type !== "mcq")
                    .filter(question => scoreForQuestion(question) !== null)
                    .map(question => ({
                        questionId: String(question._id),
                        awardedMarks: scoreForQuestion(question),
                        maximumMarks: question.marks,
                        autoScored: false,
                        feedback: questionFeedback[String(question._id)] ?? "",
                    })),
            });
            toastSuccess(
                status === "Under review"
                    ? "Assignment review saved."
                    : `Assignment marked ${status.toLowerCase()}.`,
            );
            onSaved();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Could not save the assignment review.",
            );
        } finally {
            setSaving("");
        }
    };

    return (
        <section className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-blue-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-bold text-navy">Review submission</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                        MCQs are scored automatically. Enter marks for every manual
                        question before recording a final result.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-navy shadow-sm">
                        {totalScore} / {assignment.maximumScore}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close assignment review"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-4 p-4">
                {questions.map((question, index) => {
                    const id = String(question._id);
                    const answer = answerByQuestion.get(id);
                    const questionScore = scoreForQuestion(question);
                    const isCorrect =
                        question.type === "mcq" &&
                        answer?.selectedOption === question.referenceAnswer;

                    return (
                        <article
                            key={id}
                            className="rounded-xl border border-slate-200 p-4"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600">
                                        Question {index + 1} · {question.type.replace("-", " ")}
                                    </p>
                                    <h3 className="mt-1 text-sm font-bold text-navy">
                                        {question.title}
                                    </h3>
                                </div>
                                <span className="shrink-0 rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-navy">
                                    {questionScore ?? "—"} / {question.marks} marks
                                </span>
                            </div>

                            <div
                                className="rich-text-preview mt-3 text-xs leading-6 text-slate-600"
                                dangerouslySetInnerHTML={{ __html: question.prompt }}
                            />

                            {question.type === "mcq" ? (
                                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500">
                                            Candidate answer:
                                        </span>
                                        <span className="text-xs font-bold text-navy">
                                            {answer?.selectedOption || "No answer"}
                                        </span>
                                        <span
                                            className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                                        >
                                            {isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                            {isCorrect ? "Correct" : "Incorrect"}
                                        </span>
                                    </div>
                                    {!isCorrect && (
                                        <p className="mt-2 text-[10px] text-slate-500">
                                            Correct answer: <strong>{question.referenceAnswer}</strong>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div
                                        className={`mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 ${question.type === "practical" ? "" : "h-52 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"}`}
                                    >
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                            Candidate response
                                        </p>
                                        {question.type === "practical" ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {answer?.attachments?.length ? (
                                                    answer.attachments.map(attachment => (
                                                        <a
                                                            key={attachment.secureUrl}
                                                            href={attachment.secureUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[10px] font-bold text-blue-600 shadow-sm"
                                                        >
                                                            {attachment.originalFilename}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-red-600">
                                                        No file was submitted.
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-navy/70">
                                                {answer?.textAnswer || "No written answer."}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]">
                                        <label>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                                Awarded marks
                                            </span>
                                            <input
                                                type="number"
                                                required
                                                min={0}
                                                max={question.marks}
                                                step={0.5}
                                                value={marks[id] ?? ""}
                                                onChange={event =>
                                                    setMarks(current => ({
                                                        ...current,
                                                        [id]: event.target.value,
                                                    }))
                                                }
                                                placeholder={`0–${question.marks}`}
                                                className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </label>
                                        <label>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                                Question feedback
                                            </span>
                                            <input
                                                value={questionFeedback[id] ?? ""}
                                                onChange={event =>
                                                    setQuestionFeedback(current => ({
                                                        ...current,
                                                        [id]: event.target.value,
                                                    }))
                                                }
                                                placeholder="Internal marking note or evidence observed"
                                                className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            />
                                        </label>
                                    </div>
                                </>
                            )}
                        </article>
                    );
                })}

                <label className="block">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        Candidate-visible overall feedback
                    </span>
                    <textarea
                        value={overallFeedback}
                        onChange={event => setOverallFeedback(event.target.value)}
                        placeholder="Summarise the result and provide constructive feedback to the candidate."
                        className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                </label>

                {!reviewComplete && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[10px] font-semibold text-amber-700">
                        Complete the marks for every written, case-study, and practical
                        question before Pass or Not passed becomes available.
                    </p>
                )}
                {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {error}
                    </p>
                )}

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                    <button
                        type="button"
                        onClick={() => void saveReview("Under review")}
                        disabled={Boolean(saving)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-bold text-navy disabled:opacity-50"
                    >
                        <Save className="h-3.5 w-3.5" />
                        Save review
                    </button>
                    <button
                        type="button"
                        onClick={() => void saveReview("Revision requested")}
                        disabled={Boolean(saving)}
                        className="h-10 rounded-xl border border-amber-200 px-4 text-[10px] font-bold text-amber-700 disabled:opacity-50"
                    >
                        Request revision
                    </button>
                    {reviewComplete && (
                        <>
                            <button
                                type="button"
                                onClick={() => void saveReview("Not passed")}
                                disabled={Boolean(saving)}
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-[10px] font-bold text-red-600 disabled:opacity-50"
                            >
                                <XCircle className="h-3.5 w-3.5" />
                                Not passed
                            </button>
                            <button
                                type="button"
                                onClick={() => void saveReview("Passed")}
                                disabled={Boolean(saving)}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-[10px] font-bold text-white disabled:opacity-50"
                            >
                                <Check className="h-3.5 w-3.5" />
                                Pass assignment
                            </button>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <p className="text-base font-bold text-navy">{value}</p>
            <p className="text-[9px] uppercase text-slate-400">{label}</p>
        </div>
    );
}

function AssignForm({
    template,
    candidates,
    initialReference,
    onClose,
    onSaved,
}: {
    template: AssignmentTemplate;
    candidates: HiringCandidateOption[];
    initialReference?: string;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [reference, setReference] = useState(initialReference ?? "");
    const [dueAt, setDueAt] = useState("");
    const [instructions, setInstructions] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!reference) {
            setError("Select a candidate before publishing the assignment.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await hiringApi.createAssignment({
                applicationReference: reference.trim(),
                templateId: template._id,
                kind: "Assignment",
                dueAt: new Date(dueAt).toISOString(),
                candidateInstructions: instructions,
                status: "Published",
            });
            onSaved();
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Could not assign paper.",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="mt-4 space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4"
        >
            <p className="text-xs font-bold text-navy">
                Assign “{template.title}”
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        Candidate
                    </span>
                    <CandidateSelect
                        candidates={candidates}
                        value={reference}
                        onChange={setReference}
                    />
                    {reference && (
                        <span className="mt-1.5 block text-[9px] text-slate-400">
                            Application: {reference}
                        </span>
                    )}
                </div>
                <label>
                    <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        Submission deadline
                    </span>
                    <input
                    required
                        type="datetime-local"
                        value={dueAt}
                        onChange={event => setDueAt(event.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                </label>
            </div>
            <textarea
                value={instructions}
                onChange={event => setInstructions(event.target.value)}
                placeholder="Candidate-specific instructions (optional)"
                className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-xs outline-none"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="h-9 px-3 text-[10px] font-bold text-slate-500"
                >
                    Cancel
                </button>
                <button
                    disabled={saving}
                    className="h-9 rounded-lg bg-navy px-3 text-[10px] font-bold text-white"
                >
                    {saving ? "Assigning…" : "Publish assignment"}
                </button>
            </div>
        </form>
    );
}
