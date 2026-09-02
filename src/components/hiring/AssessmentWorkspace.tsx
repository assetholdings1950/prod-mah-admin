"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
    ArrowRight,
    BookOpenCheck,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    FileText,
    Plus,
    Search,
    Send,
    Users,
    X,
} from "lucide-react";
import {
    AssignmentTemplate,
    CandidateAssessment,
    candidateAssessments,
    getAssignmentTemplates,
} from "./assessmentData";
import { toastSuccess } from "@/utils/toast-message/taost-message";

type WorkspaceView = "library" | "assigned";

const statusClasses: Record<CandidateAssessment["status"], string> = {
    Draft: "border-slate-200 bg-slate-50 text-slate-600",
    Published: "border-blue-100 bg-blue-50 text-blue-700",
    "In progress": "border-violet-100 bg-violet-50 text-violet-700",
    Submitted: "border-amber-100 bg-amber-50 text-amber-700",
    "Under review": "border-amber-100 bg-amber-50 text-amber-700",
    Passed: "border-emerald-100 bg-emerald-50 text-emerald-700",
    "Revision requested": "border-orange-100 bg-orange-50 text-orange-700",
    "Not passed": "border-red-100 bg-red-50 text-red-700",
};

export default function AssessmentWorkspace() {
    const [view, setView] = useState<WorkspaceView>("library");
    const [templates] = useState<AssignmentTemplate[]>(() =>
        getAssignmentTemplates(),
    );
    const [assigned, setAssigned] =
        useState<CandidateAssessment[]>(candidateAssessments);
    const [query, setQuery] = useState("");
    const [showAssign, setShowAssign] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState(
        templates[0]?.id ?? "",
    );
    const [candidateName, setCandidateName] = useState("");
    const [candidateId, setCandidateId] = useState("");
    const [deadline, setDeadline] = useState("2026-08-06T17:00");
    const [candidateInstructions, setCandidateInstructions] = useState("");

    const visibleTemplates = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return templates;
        return templates.filter(
            template =>
                template.title.toLowerCase().includes(normalizedQuery) ||
                template.role.toLowerCase().includes(normalizedQuery) ||
                template.summary.toLowerCase().includes(normalizedQuery),
        );
    }, [query, templates]);

    const visibleAssignments = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return assigned;
        return assigned.filter(
            assessment =>
                assessment.candidateName
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                assessment.title.toLowerCase().includes(normalizedQuery) ||
                assessment.candidateId.toLowerCase().includes(normalizedQuery),
        );
    }, [assigned, query]);

    const openAssignment = (templateId: string) => {
        setSelectedTemplateId(templateId);
        setShowAssign(true);
    };

    const assignToCandidate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const template = templates.find(
            item => item.id === selectedTemplateId,
        );
        if (!template) return;
        const totalMarks = template.questions.reduce(
            (total, question) => total + question.marks,
            0,
        );
        const newAssignment: CandidateAssessment = {
            id: `assigned-${assigned.length + 1}`,
            templateId: template.id,
            candidateId: candidateId.trim(),
            candidateName: candidateName.trim(),
            role: template.role,
            kind: "Assignment",
            title: template.title,
            status: "Draft",
            dueAt: new Date(deadline).toLocaleString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
            }),
            maximumScore: totalMarks,
            reviewer: "Hiring Admin",
            instructions: template.instructions,
            allowedResources: template.allowedResources,
            estimatedMinutes: template.estimatedMinutes,
            questions: template.questions,
            resubmissionPolicy: template.resubmissionPolicy,
            candidateNotes:
                candidateInstructions.trim() || template.candidateNotes,
            attachmentNames: template.attachmentNames,
        };
        setAssigned(previous => [newAssignment, ...previous]);
        setShowAssign(false);
        setView("assigned");
        setCandidateName("");
        setCandidateId("");
        setCandidateInstructions("");
        toastSuccess("Assignment prepared for candidate.", {
            description:
                "It remains a private draft until the Hiring Admin publishes it manually.",
        });
    };

    const publishAssignment = (id: string) => {
        setAssigned(previous =>
            previous.map(assessment =>
                assessment.id === id
                    ? { ...assessment, status: "Published" }
                    : assessment,
            ),
        );
        toastSuccess("Assignment published manually.", {
            description:
                "The candidate can access the paper when the hiring API and candidate workspace are connected.",
        });
    };

    return (
        <div className="mx-auto w-full max-w-[1480px] pb-8">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <BookOpenCheck className="h-3.5 w-3.5" />
                        Hiring
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy">
                        Assignments
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        Create reusable papers once, then assign them to any
                        candidate.
                    </p>
                </div>
                {view === "library" ? (
                    <Link
                        href="/assessments/create"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-xs font-bold text-white hover:bg-navy-light"
                    >
                        <Plus className="h-4 w-4" />
                        Create assignment
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowAssign(true)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-xs font-bold text-white hover:bg-navy-light"
                    >
                        <Send className="h-4 w-4" />
                        Assign to candidate
                    </button>
                )}
            </header>

            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-xl border border-slate-200 p-1">
                    <button
                        type="button"
                        onClick={() => setView("library")}
                        className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[11px] font-bold ${
                            view === "library"
                                ? "bg-navy text-white"
                                : "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        <BookOpenCheck className="h-3.5 w-3.5" />
                        Assignment Library
                        <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px]">
                            {templates.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setView("assigned")}
                        className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-[11px] font-bold ${
                            view === "assigned"
                                ? "bg-navy text-white"
                                : "text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        <Users className="h-3.5 w-3.5" />
                        Candidate Assignments
                        <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px]">
                            {assigned.length}
                        </span>
                    </button>
                </div>
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder={
                            view === "library"
                                ? "Search assignment library"
                                : "Search candidate assignments"
                        }
                        className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-[11px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            {view === "library" ? (
                <section className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {visibleTemplates.map(template => {
                        const totalMarks = template.questions.reduce(
                            (total, question) => total + question.marks,
                            0,
                        );
                        const usageCount = assigned.filter(
                            assessment =>
                                assessment.templateId === template.id ||
                                assessment.title === template.title,
                        ).length;
                        return (
                            <article
                                key={template.id}
                                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span
                                        className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${
                                            template.status === "Published"
                                                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                                : "border-slate-200 bg-slate-50 text-slate-500"
                                        }`}
                                    >
                                        {template.status}
                                    </span>
                                </div>
                                <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-blue-600">
                                    {template.role}
                                </p>
                                <h2 className="mt-1 text-lg font-bold leading-6 text-navy">
                                    {template.title}
                                </h2>
                                <div
                                    className="rich-text-preview mt-2 line-clamp-3 flex-1 text-[11px] leading-5 text-slate-500"
                                    dangerouslySetInnerHTML={{
                                        __html: template.summary,
                                    }}
                                />

                                <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 text-center">
                                    <div className="p-2.5">
                                        <p className="text-sm font-bold text-navy">
                                            {template.questions.length}
                                        </p>
                                        <p className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-400">
                                            Questions
                                        </p>
                                    </div>
                                    <div className="border-x border-slate-200 p-2.5">
                                        <p className="text-sm font-bold text-navy">
                                            {totalMarks}
                                        </p>
                                        <p className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-400">
                                            Marks
                                        </p>
                                    </div>
                                    <div className="p-2.5">
                                        <p className="text-sm font-bold text-navy">
                                            {usageCount}
                                        </p>
                                        <p className="mt-0.5 text-[8px] uppercase tracking-wider text-slate-400">
                                            Assigned
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                    <span className="inline-flex items-center gap-1 text-[9px] text-slate-400">
                                        <CalendarClock className="h-3 w-3" />
                                        {template.estimatedMinutes} minutes
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openAssignment(template.id)
                                        }
                                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-navy px-4 text-[10px] font-bold text-white hover:bg-navy-light"
                                    >
                                        Assign to candidate
                                        <ArrowRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            ) : (
                <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <th className="px-5 py-3">Candidate</th>
                                    <th className="px-4 py-3">Assignment</th>
                                    <th className="px-4 py-3">Deadline</th>
                                    <th className="px-4 py-3">Score</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleAssignments.map(assessment => (
                                    <tr
                                        key={assessment.id}
                                        className="border-b border-slate-100"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-xs font-bold text-navy">
                                                {assessment.candidateName}
                                            </p>
                                            <p className="mt-1 text-[10px] text-slate-400">
                                                {assessment.candidateId}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-[11px] font-semibold text-navy">
                                                {assessment.title}
                                            </p>
                                            <p className="mt-1 text-[10px] text-blue-600">
                                                {assessment.kind}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-[10px] text-slate-500">
                                            {assessment.dueAt}
                                        </td>
                                        <td className="px-4 py-4 text-[11px] font-semibold text-navy">
                                            {assessment.score ?? "—"} /{" "}
                                            {assessment.maximumScore}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${statusClasses[assessment.status]}`}
                                            >
                                                {assessment.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {assessment.status === "Draft" ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        publishAssignment(
                                                            assessment.id,
                                                        )
                                                    }
                                                    className="h-8 rounded-lg bg-navy px-3 text-[10px] font-bold text-white"
                                                >
                                                    Publish manually
                                                </button>
                                            ) : (
                                                <Link
                                                    href={`/applications/${assessment.candidateId}`}
                                                    className="inline-flex h-8 items-center rounded-lg border border-slate-300 px-3 text-[10px] font-bold text-navy"
                                                >
                                                    Open candidate
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-[10px] leading-5 text-slate-500">
                    Creating an assignment never selects a candidate. Assigning
                    creates a candidate-specific draft, and publishing remains a
                    separate manual action.
                </p>
            </div>

            {showAssign && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="assign-library-paper-title"
                    onClick={() => setShowAssign(false)}
                >
                    <form
                        onSubmit={assignToCandidate}
                        onClick={event => event.stopPropagation()}
                        className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="assign-library-paper-title"
                                    className="text-xl font-bold text-navy"
                                >
                                    Assign to candidate
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Select a reusable paper and prepare a
                                    candidate-specific draft.
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close candidate assignment form"
                                onClick={() => setShowAssign(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Assignment paper
                                </span>
                                <select
                                    required
                                    value={selectedTemplateId}
                                    onChange={event =>
                                        setSelectedTemplateId(
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
                                >
                                    {templates.map(template => (
                                        <option
                                            key={template.id}
                                            value={template.id}
                                        >
                                            {template.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Candidate name
                                </span>
                                <input
                                    required
                                    value={candidateName}
                                    onChange={event =>
                                        setCandidateName(event.target.value)
                                    }
                                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                                />
                            </label>
                            <label>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Application ID
                                </span>
                                <input
                                    required
                                    value={candidateId}
                                    onChange={event =>
                                        setCandidateId(event.target.value)
                                    }
                                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                                />
                            </label>
                            <label className="sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Candidate deadline
                                </span>
                                <input
                                    type="datetime-local"
                                    required
                                    value={deadline}
                                    onChange={event =>
                                        setDeadline(event.target.value)
                                    }
                                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                                />
                            </label>
                            <label className="sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Candidate-specific instructions
                                </span>
                                <textarea
                                    value={candidateInstructions}
                                    onChange={event =>
                                        setCandidateInstructions(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Optional deadline clarification or candidate-specific guidance..."
                                    className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs leading-5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                        </div>

                        <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                            <ClipboardList className="h-4 w-4 shrink-0 text-blue-600" />
                            <p className="text-[10px] leading-4 text-slate-500">
                                This creates a private candidate assignment. It
                                will not publish or send anything automatically.
                            </p>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAssign(false)}
                                className="h-9 rounded-xl border border-slate-300 px-4 text-[11px] font-bold text-navy"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="h-9 rounded-xl bg-navy px-4 text-[11px] font-bold text-white"
                            >
                                Create candidate draft
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
