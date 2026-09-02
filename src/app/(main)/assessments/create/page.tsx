"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    FileText,
    Loader2,
    Paperclip,
    Save,
    Trash2,
} from "lucide-react";
import AssignmentPaperBuilder, {
    QUESTION_MARKS,
} from "@/components/hiring/AssignmentPaperBuilder";
import RichTextEditor from "@/components/common/RichTextEditor";
import {
    AssignmentQuestion,
} from "@/components/hiring/assessmentData";
import { hiringApi } from "@/lib/hiringApi";
import {
    toastSuccess,
    toastWarning,
} from "@/utils/toast-message/taost-message";

function hasRichTextContent(value: string) {
    return value
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .trim().length > 0;
}

export function AssignmentFormPage({ assignmentId }: { assignmentId?: string }) {
    const router = useRouter();
    const isEditing = Boolean(assignmentId);
    const [title, setTitle] = useState("");
    const [role, setRole] = useState("All hiring roles");
    const [summary, setSummary] = useState("");
    const [instructions, setInstructions] = useState("");
    const [allowedResources, setAllowedResources] = useState("");
    const [estimatedMinutes, setEstimatedMinutes] = useState("120");
    const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
    const [resubmissionPolicy, setResubmissionPolicy] = useState(
        "One resubmission with Hiring Admin approval",
    );
    const [candidateNotes, setCandidateNotes] = useState("");
    const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEditing);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        if (!assignmentId) return;

        let active = true;
        const loadAssignment = async () => {
            setLoading(true);
            setLoadError("");
            try {
                const assignment = await hiringApi.template(assignmentId);
                if (!active) return;
                setTitle(assignment.title);
                setRole(assignment.role);
                setSummary(assignment.summary);
                setInstructions(assignment.instructions);
                setAllowedResources(assignment.allowedResources);
                setEstimatedMinutes(String(assignment.estimatedMinutes));
                setQuestions(
                    assignment.questions.map((question, index) => ({
                        id: question._id ?? `question-loaded-${index + 1}`,
                        type: question.type,
                        title: question.title,
                        prompt: question.prompt,
                        marks: QUESTION_MARKS[question.type],
                        required: question.required,
                        options: question.options,
                        referenceAnswer: question.referenceAnswer,
                        wordLimit: question.wordLimit,
                        caseStudy: question.caseStudy,
                        acceptedFormats: question.acceptedFormats,
                    })),
                );
                setResubmissionPolicy(assignment.resubmissionPolicy);
                setCandidateNotes(assignment.candidateNotes ?? "");
                setAttachmentNames(assignment.attachmentNames ?? []);
            } catch (error) {
                if (active) {
                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : "Could not load the assignment.",
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadAssignment();
        return () => {
            active = false;
        };
    }, [assignmentId]);

    const totalMarks = questions.reduce(
        (total, question) => total + question.marks,
        0,
    );

    const saveAssignment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (
            !hasRichTextContent(summary) ||
            !hasRichTextContent(instructions) ||
            !hasRichTextContent(allowedResources)
        ) {
            toastWarning(
                "Complete the summary, instructions, and allowed resources.",
            );
            return;
        }
        if (questions.length === 0) {
            toastWarning("Add at least one question to the assignment paper.");
            return;
        }
        if (questions.some(question => !hasRichTextContent(question.prompt))) {
            toastWarning("Complete the prompt for every assignment question.");
            return;
        }
        if (
            questions.some(
                question =>
                    question.type === "case-study" &&
                    !hasRichTextContent(question.caseStudy ?? ""),
            )
        ) {
            toastWarning("Complete the material for every case-study question.");
            return;
        }
        if (totalMarks === 0) {
            toastWarning("The assignment paper must contain marks.");
            return;
        }

        const assignment = {
            title: title.trim(),
            role,
            summary: summary.trim(),
            instructions: instructions.trim(),
            allowedResources: allowedResources.trim(),
            estimatedMinutes: Number(estimatedMinutes),
            questions: questions.map(({ id: _id, ...question }) => ({
                ...question,
                marks: QUESTION_MARKS[question.type],
            })),
            resubmissionPolicy,
            candidateNotes: candidateNotes.trim(),
            attachmentNames,
            status: "Published",
        };
        setSaving(true);
        try {
            if (assignmentId) {
                await hiringApi.updateTemplate(assignmentId, assignment);
            } else {
                await hiringApi.createTemplate(assignment);
            }
            toastSuccess(
                isEditing
                    ? "Assignment updated successfully."
                    : "Assignment added to the library.",
                {
                    description: "It can now be assigned manually to any candidate.",
                },
            );
            router.push("/assessments");
        } catch (error) {
            toastWarning(error instanceof Error ? error.message : "Could not save the assignment.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm font-bold text-red-700">Assignment could not be opened</p>
                <p className="mt-2 text-xs text-red-600">{loadError}</p>
                <Link href="/assessments" className="mt-5 inline-flex h-10 items-center rounded-xl bg-navy px-4 text-xs font-bold text-white">
                    Return to assignment library
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1180px] pb-10">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <Link
                        href="/assessments"
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-navy"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Assignment Library
                    </Link>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy">
                        {isEditing ? "Edit assignment" : "Create assignment"}
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        {isEditing
                            ? "Update this reusable paper for future candidate assignments."
                            : "Build one reusable assignment paper, then assign it to any candidate."}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-500">
                        {questions.length} questions
                    </span>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-700">
                        {totalMarks} marks
                    </span>
                </div>
            </header>

            <form onSubmit={saveAssignment} className="mt-5 space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileText className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-navy">
                                Assignment identity
                            </h2>
                            <p className="mt-1 text-[10px] text-slate-400">
                                This identifies the reusable paper in the
                                assignment library.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <label className="sm:col-span-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Assignment title
                            </span>
                            <input
                                required
                                value={title}
                                onChange={event => setTitle(event.target.value)}
                                placeholder="e.g. Financial analysis and investment judgement"
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                        <label>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Recommended role
                            </span>
                            <select
                                value={role}
                                onChange={event => setRole(event.target.value)}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
                            >
                                <option>All hiring roles</option>
                                <option>Senior Financial Analyst</option>
                                <option>Relationship Manager</option>
                                <option>Compliance Associate</option>
                                <option>Investment Operations Analyst</option>
                            </select>
                        </label>
                        <label>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Expected completion time
                            </span>
                            <div className="relative mt-2">
                                <input
                                    type="number"
                                    required
                                    min={15}
                                    max={480}
                                    step={15}
                                    value={estimatedMinutes}
                                    onChange={event =>
                                        setEstimatedMinutes(event.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-20 text-xs outline-none focus:border-blue-400"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                    minutes
                                </span>
                            </div>
                        </label>
                        <div className="sm:col-span-2">
                            <RichTextEditor
                                label="Library Summary"
                                value={summary}
                                onChange={setSummary}
                                placeholder="Explain what this assignment evaluates and when the Hiring Admin should use it..."
                                minHeight="120px"
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-lg font-bold text-navy">
                        Candidate instructions
                    </h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                        Shared whenever this assignment is assigned to a candidate.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <RichTextEditor
                            label="General Instructions"
                            value={instructions}
                            onChange={setInstructions}
                            placeholder="State how the candidate should complete and submit the paper..."
                            minHeight="160px"
                        />
                        <RichTextEditor
                            label="Allowed Tools and Resources"
                            value={allowedResources}
                            onChange={setAllowedResources}
                            placeholder="Spreadsheet software, calculator, and public reference material..."
                            minHeight="160px"
                        />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <AssignmentPaperBuilder
                        questions={questions}
                        onChange={setQuestions}
                    />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="text-lg font-bold text-navy">
                        Files and candidate conditions
                    </h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Reusable case-study files
                            </span>
                            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 p-3">
                                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-blue-50 px-4 text-[11px] font-bold text-blue-700 hover:bg-blue-100">
                                    <Paperclip className="h-3.5 w-3.5" />
                                    Add files
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.ppt,.pptx,.zip"
                                        className="sr-only"
                                        onChange={event =>
                                            setAttachmentNames(
                                                Array.from(
                                                    event.target.files ?? [],
                                                ).map(file => file.name),
                                            )
                                        }
                                    />
                                </label>
                                {attachmentNames.length === 0 && (
                                    <span className="text-[10px] text-slate-400">
                                        PDF, Office files, CSV, or ZIP
                                    </span>
                                )}
                                {attachmentNames.map(name => (
                                    <span
                                        key={name}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-navy"
                                    >
                                        {name}
                                        <button
                                            type="button"
                                            aria-label={`Remove ${name}`}
                                            onClick={() =>
                                                setAttachmentNames(previous =>
                                                    previous.filter(
                                                        item => item !== name,
                                                    ),
                                                )
                                            }
                                            className="text-red-400"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <label>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                Resubmission policy
                            </span>
                            <select
                                value={resubmissionPolicy}
                                onChange={event =>
                                    setResubmissionPolicy(event.target.value)
                                }
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"
                            >
                                <option>No resubmission allowed</option>
                                <option>
                                    One resubmission with Hiring Admin approval
                                </option>
                                <option>
                                    Resubmission only for documented technical
                                    issues
                                </option>
                            </select>
                        </label>
                        <RichTextEditor
                            label="Candidate-Visible Notes"
                            value={candidateNotes}
                            onChange={setCandidateNotes}
                            placeholder="Confidentiality instructions or additional guidance..."
                            minHeight="140px"
                        />
                    </div>
                </section>

                <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <p className="text-[10px] leading-5 text-slate-500">
                            Saving creates a reusable library paper. It does not
                            assign or notify any candidate.
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Link
                            href="/assessments"
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-[11px] font-bold text-navy"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-[11px] font-bold text-white hover:bg-navy-light"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {saving
                                ? "Saving…"
                                : isEditing
                                  ? "Save changes"
                                  : "Save to library"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function CreateAssignmentPage() {
    return <AssignmentFormPage />;
}
