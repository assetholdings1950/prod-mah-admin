"use client";

import Link from "next/link";
import { useState } from "react";
import {
    CalendarClock,
    ClipboardCheck,
    FileUp,
    MonitorCheck,
    Send,
} from "lucide-react";
import {
    CandidateAssessment,
    getCandidateAssessments,
} from "./assessmentData";
import {
    toastInfo,
    toastSuccess,
} from "@/utils/toast-message/taost-message";

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

export default function CandidateAssessmentsPanel({
    candidateId,
}: {
    candidateId: string;
}) {
    const [assessments, setAssessments] = useState(() =>
        getCandidateAssessments(candidateId),
    );

    const updateStatus = (
        id: string,
        status: CandidateAssessment["status"],
    ) => {
        setAssessments(previous =>
            previous.map(assessment =>
                assessment.id === id ? { ...assessment, status } : assessment,
            ),
        );
        toastSuccess(`Assessment marked as ${status.toLowerCase()}.`, {
            description:
                "The candidate has not been contacted automatically.",
        });
    };

    if (assessments.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 px-5 py-14 text-center">
                <ClipboardCheck className="mx-auto h-6 w-6 text-slate-300" />
                <h2 className="mt-3 text-sm font-bold text-navy">
                    No assessment assigned
                </h2>
                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                    This vacancy may use an assignment, online exam, both, or no
                    assessment. The Hiring Admin decides manually.
                </p>
                <button
                    type="button"
                    onClick={() =>
                        toastInfo("Open Assessment Centre to create an assessment.")
                    }
                    className="mt-4 h-9 rounded-xl bg-navy px-4 text-[11px] font-bold text-white"
                >
                    Assign assessment
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-navy">
                        Assignments and online exams
                    </h2>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                        Publishing, deadline changes, marking, feedback, and the
                        final result are controlled manually.
                    </p>
                </div>
                <Link
                    href="/assessments"
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 px-4 text-[11px] font-bold text-navy hover:bg-slate-50"
                >
                    Open Assessment Centre
                </Link>
            </div>

            <div className="mt-5 space-y-4">
                {assessments.map(assessment => (
                    <article
                        key={assessment.id}
                        className="rounded-xl border border-slate-200 p-4"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    {assessment.kind === "Assignment" ? (
                                        <FileUp className="h-4 w-4" />
                                    ) : (
                                        <MonitorCheck className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                                        {assessment.kind}
                                    </p>
                                    <h3 className="mt-1 text-sm font-bold text-navy">
                                        {assessment.title}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarClock className="h-3 w-3" />
                                            Due {assessment.dueAt}
                                        </span>
                                        {assessment.submittedAt && (
                                            <span>
                                                Submitted {assessment.submittedAt}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span
                                className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses[assessment.status]}`}
                            >
                                {assessment.status}
                            </span>
                        </div>

                        {assessment.kind === "Assignment" &&
                            assessment.instructions && (
                                <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                    <summary className="cursor-pointer text-[11px] font-bold text-navy">
                                        View complete assignment brief
                                    </summary>
                                    <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                                        {assessment.background && (
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                    Background
                                                </p>
                                                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                                                    {assessment.background}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                Instructions
                                            </p>
                                            <div
                                                className="rich-text-preview mt-1 text-[11px] leading-5 text-slate-600"
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        assessment.instructions,
                                                }}
                                            />
                                        </div>
                                        {assessment.deliverables &&
                                            assessment.deliverables.length > 0 && (
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                        Required deliverables
                                                    </p>
                                                    <ul className="mt-2 space-y-1.5">
                                                        {assessment.deliverables.map(
                                                            deliverable => (
                                                                <li
                                                                    key={deliverable}
                                                                    className="flex gap-2 text-[11px] leading-5 text-slate-600"
                                                                >
                                                                    <span className="text-blue-600">
                                                                        •
                                                                    </span>
                                                                    {deliverable}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        {assessment.questions &&
                                            assessment.questions.length > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                            Assignment paper
                                                        </p>
                                                        <span className="text-[9px] font-bold text-blue-600">
                                                            {
                                                                assessment.questions
                                                                    .length
                                                            }{" "}
                                                            questions ·{" "}
                                                            {assessment.questions.reduce(
                                                                (
                                                                    total,
                                                                    question,
                                                                ) =>
                                                                    total +
                                                                    question.marks,
                                                                0,
                                                            )}{" "}
                                                            marks
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 space-y-2">
                                                        {assessment.questions.map(
                                                            (
                                                                question,
                                                                questionIndex,
                                                            ) => (
                                                                <div
                                                                    key={question.id}
                                                                    className="rounded-lg border border-slate-200 bg-white p-3"
                                                                >
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <p className="text-[10px] font-bold text-navy">
                                                                            {questionIndex +
                                                                                1}
                                                                            .{" "}
                                                                            {
                                                                                question.title
                                                                            }
                                                                        </p>
                                                                        <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">
                                                                            {
                                                                                question.marks
                                                                            }{" "}
                                                                            marks
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                                        {question.type ===
                                                                        "mcq"
                                                                            ? "Multiple choice"
                                                                            : question.type ===
                                                                                "explanation"
                                                                              ? "Written explanation"
                                                                              : question.type ===
                                                                                  "case-study"
                                                                                ? "Case study"
                                                                                : "Practical submission"}
                                                                    </p>
                                                                    {question.caseStudy && (
                                                                        <div
                                                                            className="rich-text-preview mt-2 rounded-md bg-slate-50 px-2.5 py-2 text-[10px] leading-4 text-slate-500"
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: question.caseStudy,
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <div
                                                                        className="rich-text-preview mt-2 text-[10px] leading-4 text-slate-600"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: question.prompt,
                                                                        }}
                                                                    />
                                                                    {question.options && (
                                                                        <div className="mt-2 grid gap-1 sm:grid-cols-2">
                                                                            {question.options.map(
                                                                                (
                                                                                    option,
                                                                                    optionIndex,
                                                                                ) => (
                                                                                    <span
                                                                                        key={`${question.id}-${optionIndex}`}
                                                                                        className="rounded-md bg-slate-50 px-2 py-1.5 text-[9px] text-slate-500"
                                                                                    >
                                                                                        {String.fromCharCode(
                                                                                            65 +
                                                                                                optionIndex,
                                                                                        )}
                                                                                        .{" "}
                                                                                        {
                                                                                            option
                                                                                        }
                                                                                    </span>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                    Allowed resources
                                                </p>
                                                <div
                                                    className="rich-text-preview mt-1 text-[11px] leading-5 text-slate-600"
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            assessment.allowedResources ??
                                                            "",
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                    Submission
                                                </p>
                                                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                                                    {assessment.estimatedMinutes} minutes
                                                    ·{" "}
                                                    {assessment.submissionFormats?.join(
                                                        ", ",
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {assessment.rubric &&
                                            assessment.rubric.length > 0 && (
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                        Evaluation rubric
                                                    </p>
                                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                        {assessment.rubric.map(
                                                            criterion => (
                                                                <div
                                                                    key={criterion.id}
                                                                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[10px]"
                                                                >
                                                                    <span className="text-slate-600">
                                                                        {
                                                                            criterion.label
                                                                        }
                                                                    </span>
                                                                    <span className="font-bold text-navy">
                                                                        {
                                                                            criterion.weight
                                                                        }
                                                                        %
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] leading-4 text-slate-600">
                                            <strong className="text-navy">
                                                Resubmission:
                                            </strong>{" "}
                                            {assessment.resubmissionPolicy}
                                            {assessment.candidateNotes && (
                                                <>
                                                    <br />
                                                    <strong className="text-navy">
                                                        Candidate note:
                                                    </strong>{" "}
                                                    <div
                                                        className="rich-text-preview mt-1"
                                                        dangerouslySetInnerHTML={{
                                                            __html:
                                                                assessment.candidateNotes,
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </details>
                            )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <p className="text-[10px] leading-4 text-slate-400">
                                Reviewer: {assessment.reviewer} · Maximum{" "}
                                {assessment.maximumScore} marks
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {assessment.status === "Draft" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updateStatus(assessment.id, "Published")
                                        }
                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-navy px-3 text-[10px] font-bold text-white"
                                    >
                                        <Send className="h-3 w-3" />
                                        Publish manually
                                    </button>
                                )}
                                {["Submitted", "Under review"].includes(
                                    assessment.status,
                                ) && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateStatus(
                                                    assessment.id,
                                                    "Revision requested",
                                                )
                                            }
                                            className="h-8 rounded-lg border border-slate-300 px-3 text-[10px] font-bold text-navy"
                                        >
                                            Request revision
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateStatus(
                                                    assessment.id,
                                                    "Passed",
                                                )
                                            }
                                            className="h-8 rounded-lg bg-navy px-3 text-[10px] font-bold text-white"
                                        >
                                            Mark and decide
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() =>
                                        toastInfo("Assessment deadline editor opened.")
                                    }
                                    className="h-8 rounded-lg border border-slate-300 px-3 text-[10px] font-bold text-navy"
                                >
                                    Change deadline
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[11px] leading-5 text-slate-600">
                Answers may be saved online, but they are not automatically
                scored. The Hiring Admin reviews every answer and records the
                result manually.
            </div>
        </div>
    );
}
