"use client";

import { useRef } from "react";
import {
    ArrowDown,
    ArrowUp,
    CaseUpper,
    CheckSquare,
    Copy,
    FileSpreadsheet,
    MessageSquareText,
    Plus,
    Trash2,
} from "lucide-react";
import {
    AssignmentQuestion,
    AssignmentQuestionType,
} from "./assessmentData";
import RichTextEditor from "@/components/common/RichTextEditor";

const typeOptions: {
    type: AssignmentQuestionType;
    label: string;
    description: string;
    icon: typeof CheckSquare;
}[] = [
    {
        type: "mcq",
        label: "Multiple choice",
        description: "Options with a private answer key",
        icon: CheckSquare,
    },
    {
        type: "explanation",
        label: "Written explanation",
        description: "Long-form reasoning or analysis",
        icon: MessageSquareText,
    },
    {
        type: "case-study",
        label: "Case study",
        description: "Scenario followed by a written response",
        icon: CaseUpper,
    },
    {
        type: "practical",
        label: "Practical submission",
        description: "Spreadsheet, report, presentation, or file",
        icon: FileSpreadsheet,
    },
];

export const QUESTION_MARKS: Record<AssignmentQuestionType, number> = {
    mcq: 2,
    explanation: 2,
    "case-study": 5,
    practical: 5,
};

function createQuestion(
    type: AssignmentQuestionType,
    id: string,
): AssignmentQuestion {
    return {
        id,
        type,
        title: "",
        prompt: "",
        marks: QUESTION_MARKS[type],
        required: true,
        options:
            type === "mcq"
                ? ["Option 1", "Option 2", "Option 3", "Option 4"]
                : undefined,
        wordLimit:
            type === "explanation" || type === "case-study" ? 500 : undefined,
        caseStudy: type === "case-study" ? "" : undefined,
        acceptedFormats:
            type === "practical" ? ["PDF", "XLSX"] : undefined,
        referenceAnswer: "",
    };
}

export default function AssignmentPaperBuilder({
    questions,
    onChange,
}: {
    questions: AssignmentQuestion[];
    onChange: (questions: AssignmentQuestion[]) => void;
}) {
    const questionSequence = useRef(questions.length);
    const totalMarks = questions.reduce(
        (total, question) => total + question.marks,
        0,
    );

    const updateQuestion = (
        id: string,
        patch: Partial<AssignmentQuestion>,
    ) => {
        onChange(
            questions.map(question =>
                question.id === id ? { ...question, ...patch } : question,
            ),
        );
    };

    const nextQuestionId = () => {
        questionSequence.current += 1;
        return `question-created-${questionSequence.current}`;
    };

    const addQuestion = (type: AssignmentQuestionType) => {
        onChange([...questions, createQuestion(type, nextQuestionId())]);
    };

    const duplicateQuestion = (question: AssignmentQuestion) => {
        const duplicate = {
            ...question,
            id: nextQuestionId(),
            title: question.title
                ? `${question.title} (copy)`
                : "Untitled question (copy)",
            options: question.options ? [...question.options] : undefined,
            acceptedFormats: question.acceptedFormats
                ? [...question.acceptedFormats]
                : undefined,
        };
        const index = questions.findIndex(item => item.id === question.id);
        const next = [...questions];
        next.splice(index + 1, 0, duplicate);
        onChange(next);
    };

    const moveQuestion = (index: number, direction: -1 | 1) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= questions.length) return;
        const next = [...questions];
        [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
        onChange(next);
    };

    const updateOption = (
        question: AssignmentQuestion,
        optionIndex: number,
        value: string,
    ) => {
        const options = [...(question.options ?? [])];
        options[optionIndex] = value;
        updateQuestion(question.id, { options });
    };

    return (
        <section className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-sm font-bold text-navy">
                        Dynamic assignment paper
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-400">
                        Build the paper question by question. All answers are
                        reviewed manually.
                    </p>
                </div>
                <div className="flex gap-2 text-[10px] font-bold">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-500">
                        {questions.length} questions
                    </span>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-blue-700">
                        {totalMarks} marks
                    </span>
                </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {typeOptions.map(option => (
                    <button
                        key={option.type}
                        type="button"
                        onClick={() => addQuestion(option.type)}
                        className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <option.icon className="h-3.5 w-3.5" />
                        </span>
                        <span>
                            <span className="block text-[10px] font-bold text-navy">
                                {option.label}
                            </span>
                            <span className="mt-0.5 block text-[9px] leading-4 text-slate-400">
                                {option.description}
                            </span>
                        </span>
                        <Plus className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </button>
                ))}
            </div>

            {questions.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
                    <p className="text-xs font-bold text-navy">
                        Start building the assignment paper
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                        Add at least one question type above.
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    {questions.map((question, index) => {
                        const typeConfig = typeOptions.find(
                            option => option.type === question.type,
                        )!;
                        return (
                            <article
                                key={question.id}
                                className="overflow-hidden rounded-xl border border-slate-200"
                            >
                                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-[10px] font-bold text-white">
                                        {index + 1}
                                    </span>
                                    <typeConfig.icon className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-[10px] font-bold text-navy">
                                        {typeConfig.label}
                                    </span>
                                    <div className="ml-auto flex items-center gap-1">
                                        <button
                                            type="button"
                                            aria-label={`Move question ${index + 1} up`}
                                            disabled={index === 0}
                                            onClick={() =>
                                                moveQuestion(index, -1)
                                            }
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white disabled:opacity-30"
                                        >
                                            <ArrowUp className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Move question ${index + 1} down`}
                                            disabled={
                                                index === questions.length - 1
                                            }
                                            onClick={() =>
                                                moveQuestion(index, 1)
                                            }
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white disabled:opacity-30"
                                        >
                                            <ArrowDown className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Duplicate question ${index + 1}`}
                                            onClick={() =>
                                                duplicateQuestion(question)
                                            }
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Delete question ${index + 1}`}
                                            onClick={() =>
                                                onChange(
                                                    questions.filter(
                                                        item =>
                                                            item.id !==
                                                            question.id,
                                                    ),
                                                )
                                            }
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                                    <label>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                            Question title
                                        </span>
                                        <input
                                            required
                                            value={question.title}
                                            onChange={event =>
                                                updateQuestion(question.id, {
                                                    title: event.target.value,
                                                })
                                            }
                                            placeholder="Enter a clear question title"
                                            className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                                        />
                                    </label>
                                    <label>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                            Marks
                                        </span>
                                        <input
                                            type="number"
                                            required
                                            readOnly
                                            value={question.marks}
                                            className="mt-2 h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-navy/60 outline-none"
                                        />
                                        <span className="mt-1 block text-[9px] text-slate-400">
                                            Fixed for this question type
                                        </span>
                                    </label>

                                    {question.type === "case-study" && (
                                        <div className="sm:col-span-2">
                                            <RichTextEditor
                                                label="Case-Study Material"
                                                value={question.caseStudy ?? ""}
                                                onChange={value =>
                                                    updateQuestion(question.id, {
                                                        caseStudy: value,
                                                    })
                                                }
                                                placeholder="Provide the scenario, fictional evidence, figures, or situation the candidate must analyse..."
                                                minHeight="160px"
                                            />
                                        </div>
                                    )}

                                    <div className="sm:col-span-2">
                                        <RichTextEditor
                                            label={
                                                question.type === "practical"
                                                    ? "Task Instructions"
                                                    : "Question Prompt"
                                            }
                                            value={question.prompt}
                                            onChange={value =>
                                                updateQuestion(question.id, {
                                                    prompt: value,
                                                })
                                            }
                                            placeholder="Write exactly what the candidate must answer or submit..."
                                            minHeight="120px"
                                        />
                                    </div>

                                    {question.type === "mcq" && (
                                        <div className="sm:col-span-2">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                                Answer options and private answer key
                                            </span>
                                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                {question.options?.map(
                                                    (option, optionIndex) => (
                                                        <div
                                                            key={`${question.id}-${optionIndex}`}
                                                            className="flex items-center gap-2 rounded-xl border border-slate-200 p-2"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`${question.id}-answer`}
                                                                checked={
                                                                    question.referenceAnswer ===
                                                                    option
                                                                }
                                                                onChange={() =>
                                                                    updateQuestion(
                                                                        question.id,
                                                                        {
                                                                            referenceAnswer:
                                                                                option,
                                                                        },
                                                                    )
                                                                }
                                                                className="h-4 w-4 accent-navy"
                                                            />
                                                            <input
                                                                required
                                                                aria-label={`Question ${index + 1} option ${optionIndex + 1}`}
                                                                value={option}
                                                                onChange={event =>
                                                                    updateOption(
                                                                        question,
                                                                        optionIndex,
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                aria-label={`Remove option ${optionIndex + 1} from question ${index + 1}`}
                                                                disabled={
                                                                    (question.options
                                                                        ?.length ??
                                                                        0) <= 2
                                                                }
                                                                onClick={() => {
                                                                    const options =
                                                                        (
                                                                            question.options ??
                                                                            []
                                                                        ).filter(
                                                                            (
                                                                                _,
                                                                                indexToKeep,
                                                                            ) =>
                                                                                indexToKeep !==
                                                                                optionIndex,
                                                                        );
                                                                    updateQuestion(
                                                                        question.id,
                                                                        {
                                                                            options,
                                                                            referenceAnswer:
                                                                                question.referenceAnswer ===
                                                                                option
                                                                                    ? ""
                                                                                    : question.referenceAnswer,
                                                                        },
                                                                    );
                                                                }}
                                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-25"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateQuestion(question.id, {
                                                        options: [
                                                            ...(question.options ??
                                                                []),
                                                            `Option ${(question.options?.length ?? 0) + 1}`,
                                                        ],
                                                    })
                                                }
                                                className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[9px] font-bold text-navy hover:bg-slate-50"
                                            >
                                                <Plus className="h-3 w-3" />
                                                Add option
                                            </button>
                                            <p className="mt-1 text-[9px] text-slate-400">
                                                Select the preferred answer for the
                                                private marking guide. It will not
                                                be scored automatically.
                                            </p>
                                        </div>
                                    )}

                                    {(question.type === "explanation" ||
                                        question.type === "case-study") && (
                                        <label>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                                Suggested word limit
                                            </span>
                                            <input
                                                type="number"
                                                min={50}
                                                max={5000}
                                                step={50}
                                                value={question.wordLimit ?? 500}
                                                onChange={event =>
                                                    updateQuestion(question.id, {
                                                        wordLimit: Number(
                                                            event.target.value,
                                                        ),
                                                    })
                                                }
                                                className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                                            />
                                        </label>
                                    )}

                                    {(question.type === "explanation" ||
                                        question.type === "case-study") && (
                                        <div className="sm:col-span-2">
                                            <RichTextEditor
                                                label="Private Marking Guide"
                                                value={
                                                    question.referenceAnswer ?? ""
                                                }
                                                onChange={value =>
                                                    updateQuestion(question.id, {
                                                        referenceAnswer:
                                                            value,
                                                    })
                                                }
                                                placeholder="Describe the evidence, reasoning, or qualities the reviewer should look for..."
                                                minHeight="120px"
                                            />
                                        </div>
                                    )}

                                    {question.type === "practical" && (
                                        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[minmax(180px,0.65fr)_minmax(0,2fr)]">
                                            <label>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                                    Accepted file formats
                                                </span>
                                                <input
                                                    value={
                                                        question.acceptedFormats?.join(
                                                            ", ",
                                                        ) ?? ""
                                                    }
                                                    onChange={event =>
                                                        updateQuestion(
                                                            question.id,
                                                            {
                                                                acceptedFormats:
                                                                    event.target.value
                                                                        .split(
                                                                            ",",
                                                                        )
                                                                        .map(
                                                                            item =>
                                                                                item
                                                                                    .trim()
                                                                                    .toUpperCase(),
                                                                        )
                                                                        .filter(
                                                                            Boolean,
                                                                        ),
                                                            },
                                                        )
                                                    }
                                                    placeholder="XLSX, PDF, PPTX"
                                                    className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
                                                />
                                                <p className="mt-1.5 text-[9px] leading-4 text-slate-400">
                                                    Separate formats with commas.
                                                </p>
                                            </label>
                                            <RichTextEditor
                                                label="Private Marking Guide"
                                                value={
                                                    question.referenceAnswer ?? ""
                                                }
                                                onChange={value =>
                                                    updateQuestion(question.id, {
                                                        referenceAnswer: value,
                                                    })
                                                }
                                                placeholder="Describe the evidence, reasoning, or qualities the reviewer should look for..."
                                                minHeight="120px"
                                            />
                                        </div>
                                    )}

                                    <label className="flex items-center gap-2 sm:col-span-2">
                                        <input
                                            type="checkbox"
                                            checked={question.required}
                                            onChange={event =>
                                                updateQuestion(question.id, {
                                                    required:
                                                        event.target.checked,
                                                })
                                            }
                                            className="h-4 w-4 rounded border-slate-300 accent-navy"
                                        />
                                        <span className="text-[10px] font-semibold text-slate-600">
                                            Candidate must answer this question
                                        </span>
                                    </label>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
