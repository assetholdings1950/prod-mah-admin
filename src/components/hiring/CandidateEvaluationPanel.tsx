"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Save, ShieldAlert } from "lucide-react";
import { toastSuccess } from "@/utils/toast-message/taost-message";

const criteria = [
    { id: "expertise", label: "Role expertise", weight: 25 },
    { id: "problemSolving", label: "Problem-solving", weight: 20 },
    { id: "communication", label: "Communication", weight: 15 },
    { id: "integrity", label: "Integrity and compliance", weight: 20 },
    { id: "clientService", label: "Client-service mindset", weight: 10 },
    { id: "motivation", label: "Motivation and alignment", weight: 10 },
] as const;

type CriterionId = (typeof criteria)[number]["id"];

const initialScores: Record<CriterionId, number> = {
    expertise: 4,
    problemSolving: 4,
    communication: 3,
    integrity: 4,
    clientService: 3,
    motivation: 4,
};

export default function CandidateEvaluationPanel() {
    const [scores, setScores] =
        useState<Record<CriterionId, number>>(initialScores);
    const [evidence, setEvidence] = useState(
        "Candidate demonstrated dependable financial judgement and explained assumptions clearly.",
    );
    const [strengths, setStrengths] = useState(
        "Structured analysis, strong controls mindset, calm stakeholder communication.",
    );
    const [concerns, setConcerns] = useState(
        "Client-facing examples require deeper validation during the standards interview.",
    );
    const [recommendation, setRecommendation] = useState("Consider");

    const weightedScore = useMemo(
        () =>
            criteria.reduce(
                (total, criterion) =>
                    total + scores[criterion.id] * (criterion.weight / 100),
                0,
            ),
        [scores],
    );

    const scoreLabel =
        weightedScore >= 4
            ? "Strong recommendation"
            : weightedScore >= 3.2
              ? "Consider with documented concerns"
              : "Normally reject";

    const saveEvaluation = () => {
        toastSuccess("Candidate evaluation saved.", {
            description:
                "The score and written evidence remain an internal manual hiring record.",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-navy">
                        Candidate evaluation
                    </h2>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                        Score each area from 1–5 and support the decision with
                        written evidence. The score never advances or rejects a
                        candidate automatically.
                    </p>
                </div>
                <div className="min-w-48 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                        Weighted score
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-4">
                        <span className="font-heading text-3xl font-bold text-navy">
                            {weightedScore.toFixed(1)}
                            <span className="text-sm text-slate-400"> / 5</span>
                        </span>
                        <span className="text-right text-[10px] font-semibold leading-4 text-slate-500">
                            {scoreLabel}
                        </span>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-[minmax(180px,1fr)_70px_minmax(250px,1.4fr)] bg-slate-50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Evaluation area</span>
                    <span>Weight</span>
                    <span>Manual score</span>
                </div>
                {criteria.map(criterion => (
                    <div
                        key={criterion.id}
                        className="grid grid-cols-[minmax(180px,1fr)_70px_minmax(250px,1.4fr)] items-center border-t border-slate-100 px-4 py-3"
                    >
                        <span className="text-xs font-semibold text-navy">
                            {criterion.label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                            {criterion.weight}%
                        </span>
                        <div
                            className="flex gap-1.5"
                            aria-label={`${criterion.label} score`}
                        >
                            {[1, 2, 3, 4, 5].map(score => (
                                <button
                                    key={score}
                                    type="button"
                                    aria-label={`${criterion.label}: ${score} out of 5`}
                                    aria-pressed={scores[criterion.id] === score}
                                    onClick={() =>
                                        setScores(previous => ({
                                            ...previous,
                                            [criterion.id]: score,
                                        }))
                                    }
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-bold transition ${
                                        scores[criterion.id] === score
                                            ? "border-navy bg-navy text-white"
                                            : "border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50"
                                    }`}
                                >
                                    {score}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Evaluation evidence
                    </span>
                    <textarea
                        value={evidence}
                        onChange={event => setEvidence(event.target.value)}
                        className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                </label>
                <label>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Strengths
                    </span>
                    <textarea
                        value={strengths}
                        onChange={event => setStrengths(event.target.value)}
                        className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                </label>
                <label>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Concerns
                    </span>
                    <textarea
                        value={concerns}
                        onChange={event => setConcerns(event.target.value)}
                        className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                </label>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="max-w-xl text-[11px] leading-5 text-slate-500">
                        Any integrity, compliance, or confidentiality concern
                        requires an explicit Hiring Admin decision regardless of
                        the calculated score.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <select
                        aria-label="Evaluation recommendation"
                        value={recommendation}
                        onChange={event => setRecommendation(event.target.value)}
                        className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-[11px] font-semibold text-navy outline-none"
                    >
                        <option>Strong recommendation</option>
                        <option>Consider</option>
                        <option>Hold</option>
                        <option>Reject</option>
                    </select>
                    <button
                        type="button"
                        onClick={saveEvaluation}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-navy px-4 text-[11px] font-bold text-white hover:bg-navy-light"
                    >
                        <Save className="h-3.5 w-3.5" />
                        Save evaluation
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Evaluator: Hiring Admin · Scores and notes are never shown to
                the candidate.
            </div>
        </div>
    );
}
