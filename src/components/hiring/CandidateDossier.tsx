"use client";

import { useMemo, useState } from "react";
import {
    BadgeCheck,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    CheckCircle2,
    Download,
    ExternalLink,
    FileText,
    Mail,
    MapPin,
    MoreHorizontal,
    Phone,
    PlaySquare,
    Save,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";
import {
    CandidateApplication,
    HIRING_STAGES,
    HiringStage,
} from "./candidateData";
import CandidateAssessmentsPanel from "./CandidateAssessmentsPanel";
import CandidateEvaluationPanel from "./CandidateEvaluationPanel";
import {
    toastInfo,
    toastSuccess,
    toastWarning,
} from "@/utils/toast-message/taost-message";

type DossierTab =
    | "personal"
    | "professional"
    | "documents"
    | "assessments"
    | "evaluation"
    | "notes"
    | "activity";

const dossierTabs: { id: DossierTab; label: string }[] = [
    { id: "personal", label: "Personal details" },
    { id: "professional", label: "Professional background" },
    { id: "documents", label: "Documents" },
    { id: "assessments", label: "Assessments" },
    { id: "evaluation", label: "Evaluation" },
    { id: "notes", label: "Notes" },
    { id: "activity", label: "Activity" },
];

const reviewItems = [
    "Eligibility confirmed",
    "Experience relevant",
    "Documents reviewed",
    "Introduction video reviewed",
    "Conflict check",
    "Notes added",
] as const;

type ReviewItem = (typeof reviewItems)[number];

const initialReviewState: Record<ReviewItem, boolean> = {
    "Eligibility confirmed": true,
    "Experience relevant": true,
    "Documents reviewed": true,
    "Introduction video reviewed": true,
    "Conflict check": false,
    "Notes added": false,
};

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[145px_minmax(0,1fr)] gap-5 border-b border-slate-100 py-2.5 last:border-b-0">
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd className="min-w-0 text-xs font-semibold text-navy">{value}</dd>
        </div>
    );
}

function DocumentRows({
    candidate,
    expanded = false,
}: {
    candidate: CandidateApplication;
    expanded?: boolean;
}) {
    if (candidate.documents.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-xs text-slate-400">
                No supporting documents are attached to this application.
            </div>
        );
    }

    const openDocument = (name: string) => {
        toastInfo(`${name} selected.`, {
            description:
                "The live Cloudinary document URL will open here when the hiring API is connected.",
        });
    };

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200">
            {candidate.documents.map((document, index) => (
                <div
                    key={document.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                        index > 0 ? "border-t border-slate-100" : ""
                    }`}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-navy">
                        {document.type === "PDF" ? (
                            <FileText className="h-4 w-4" />
                        ) : (
                            <PlaySquare className="h-4 w-4" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-navy">
                            {document.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                            {document.size}
                            {expanded ? ` · Uploaded ${document.uploadedAt}` : ""}
                        </p>
                    </div>
                    {!expanded && (
                        <span className="hidden text-[10px] text-slate-400 sm:block">
                            {document.uploadedAt}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => openDocument(document.name)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                    >
                        {expanded ? (
                            <>
                                Open <ExternalLink className="h-3 w-3" />
                            </>
                        ) : (
                            <>
                                <Download className="h-3.5 w-3.5" /> Download
                            </>
                        )}
                    </button>
                </div>
            ))}
        </div>
    );
}

function ActivityList({ candidate }: { candidate: CandidateApplication }) {
    if (candidate.activities.length === 0) {
        return (
            <p className="py-6 text-center text-xs text-slate-400">
                No activity has been recorded yet.
            </p>
        );
    }

    return (
        <div className="space-y-0">
            {candidate.activities.map((activity, index) => (
                <div
                    key={activity.id}
                    className="relative flex gap-3 pb-5 last:pb-0"
                >
                    {index < candidate.activities.length - 1 && (
                        <span className="absolute left-[15px] top-7 h-[calc(100%-1rem)] w-px bg-slate-200" />
                    )}
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy">
                        {index === 0 ? (
                            <FileText className="h-3.5 w-3.5" />
                        ) : index === 1 ? (
                            <ExternalLink className="h-3.5 w-3.5" />
                        ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                        )}
                    </div>
                    <div className="min-w-0 pt-0.5">
                        <p className="text-[11px] font-semibold text-navy">
                            {activity.action}
                        </p>
                        <p className="text-[10px] leading-4 text-slate-400">
                            {activity.at} · Hiring Admin
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">
                            {activity.detail}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function CandidateDossier({
    candidate,
}: {
    candidate: CandidateApplication;
}) {
    const [activeTab, setActiveTab] = useState<DossierTab>("personal");
    const [stage, setStage] = useState<HiringStage>(candidate.stage);
    const [review, setReview] =
        useState<Record<ReviewItem, boolean>>(initialReviewState);
    const [notes, setNotes] = useState("");
    const [savedNotes, setSavedNotes] = useState("");
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const fullName = `${candidate.firstName} ${candidate.lastName}`;
    const initials = `${candidate.firstName[0]}${candidate.lastName[0]}`;
    const currentStageIndex = HIRING_STAGES.findIndex(item => item === stage);

    const nextStage = useMemo(() => {
        if (stage === "Rejected" || stage === "Hired") return null;
        return HIRING_STAGES[Math.min(currentStageIndex + 1, HIRING_STAGES.length - 1)];
    }, [currentStageIndex, stage]);

    const advanceStage = () => {
        if (!nextStage || nextStage === stage) return;
        setStage(nextStage);
        toastSuccess(`Application advanced to ${nextStage}.`, {
            description: "This manual action has been added to the review history.",
        });
    };

    const saveReview = () => {
        setSavedNotes(notes.trim());
        if (notes.trim()) {
            setReview(previous => ({ ...previous, "Notes added": true }));
        }
        toastSuccess("Manual review saved.");
    };

    const rejectApplication = () => {
        setStage("Rejected");
        setShowRejectConfirm(false);
        toastWarning("Application marked as rejected.", {
            description: "No message has been sent to the candidate.",
        });
    };

    return (
        <div className="mx-auto w-full max-w-[1480px] pb-8">
            <section className="border-b border-slate-200 bg-white px-1 pb-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-50 font-heading text-3xl font-bold text-navy">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-3xl font-bold tracking-tight text-navy">
                                {fullName}
                            </h1>
                            <p className="mt-0.5 text-sm font-semibold text-navy">
                                {candidate.role}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {candidate.city}, {candidate.country}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5" />
                                    {candidate.countryCode} {candidate.phone}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5" />
                                    {candidate.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="min-w-[185px] border-l border-slate-200 pl-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Application ID
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-navy">
                                {candidate.id}
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-400">Received</p>
                                    <p className="text-[11px] font-semibold text-navy">
                                        {candidate.receivedAt}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400">
                                        Current stage
                                    </p>
                                    <p
                                        className={`text-[11px] font-bold ${
                                            stage === "Rejected"
                                                ? "text-red-600"
                                                : "text-blue-600"
                                        }`}
                                    >
                                        {stage}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex items-center gap-2">
                            <button
                                type="button"
                                onClick={advanceStage}
                                disabled={!nextStage || stage === "Rejected"}
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-navy px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {nextStage ? `Advance to ${nextStage.toLowerCase()}` : stage}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowRejectConfirm(true)}
                                disabled={stage === "Rejected"}
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-xs font-bold text-navy transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                                Reject
                            </button>
                            <button
                                type="button"
                                aria-label="More application actions"
                                aria-expanded={showMenu}
                                onClick={() => setShowMenu(value => !value)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMenu(false);
                                            toastInfo("Application ID copied.");
                                        }}
                                        className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Copy application ID
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMenu(false);
                                            toastInfo("Application export prepared.");
                                        }}
                                        className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Export application
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="overflow-x-auto border-b border-slate-200 bg-white px-1 py-5">
                <ol className="grid min-w-[760px] grid-cols-8">
                    {HIRING_STAGES.map((item, index) => {
                        const isComplete =
                            stage !== "Rejected" && index < currentStageIndex;
                        const isCurrent = item === stage;
                        return (
                            <li key={item} className="relative flex flex-col items-center">
                                {index > 0 && (
                                    <span
                                        className={`absolute right-1/2 top-4 h-px w-full ${
                                            index <= currentStageIndex &&
                                            stage !== "Rejected"
                                                ? "bg-navy"
                                                : "bg-slate-200"
                                        }`}
                                    />
                                )}
                                <span
                                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold ${
                                        isComplete || isCurrent
                                            ? "border-navy bg-navy text-white"
                                            : "border-slate-300 bg-white text-slate-500"
                                    }`}
                                >
                                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                                </span>
                                <span
                                    className={`mt-2 text-center text-[10px] font-semibold ${
                                        isCurrent ? "text-navy" : "text-slate-500"
                                    }`}
                                >
                                    {item}
                                </span>
                            </li>
                        );
                    })}
                </ol>
                {stage === "Rejected" && (
                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-center text-[11px] font-semibold text-red-600">
                        This application has been rejected. No candidate message was sent automatically.
                    </div>
                )}
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
                <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto border-b border-slate-200">
                        <nav className="flex min-w-max px-4" aria-label="Candidate dossier">
                            {dossierTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative px-4 py-4 text-[11px] font-semibold transition-colors ${
                                        activeTab === tab.id
                                            ? "text-blue-600"
                                            : "text-slate-500 hover:text-navy"
                                    }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-5">
                        {activeTab === "personal" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-navy">
                                        Contact details
                                    </h2>
                                    <dl className="mt-2">
                                        <DetailRow label="Email" value={candidate.email} />
                                        <DetailRow
                                            label="Phone"
                                            value={`${candidate.countryCode} ${candidate.phone}`}
                                        />
                                        <DetailRow
                                            label="Country"
                                            value={`${candidate.country} (${candidate.countryCode})`}
                                        />
                                        <DetailRow label="City" value={candidate.city} />
                                    </dl>
                                </div>

                                <div className="border-t border-slate-200 pt-5">
                                    <h2 className="text-lg font-bold text-navy">
                                        Professional summary
                                    </h2>
                                    <dl className="mt-2">
                                        <DetailRow
                                            label="Current role"
                                            value={`${candidate.currentRole} at ${candidate.currentCompany}`}
                                        />
                                        <DetailRow
                                            label="Total experience"
                                            value={`${candidate.yearsExperience} years`}
                                        />
                                        <DetailRow
                                            label="Highest qualification"
                                            value={candidate.highestQualification}
                                        />
                                    </dl>
                                </div>

                                <div className="border-t border-slate-200 pt-5">
                                    <h2 className="text-lg font-bold text-navy">
                                        Why Merlion
                                    </h2>
                                    <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-600">
                                        {candidate.whyMerlion}
                                    </p>
                                </div>

                                <div className="border-t border-slate-200 pt-5">
                                    <h2 className="mb-3 text-lg font-bold text-navy">
                                        Documents
                                    </h2>
                                    <DocumentRows candidate={candidate} />
                                </div>
                            </div>
                        )}

                        {activeTab === "professional" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-navy">
                                        Candidate profile
                                    </h2>
                                    <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-600">
                                        {candidate.professionalSummary}
                                    </p>
                                </div>
                                <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                                        <p className="mt-3 text-xs font-bold text-navy">
                                            {candidate.currentRole}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {candidate.currentCompany} · {candidate.yearsExperience} years total experience
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <BadgeCheck className="h-4 w-4 text-blue-600" />
                                        <p className="mt-3 text-xs font-bold text-navy">
                                            {candidate.highestQualification}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Highest qualification declared by the candidate
                                        </p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-200 pt-5">
                                    <h2 className="text-lg font-bold text-navy">
                                        Relevant strengths
                                    </h2>
                                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {candidate.strengths.map(strength => (
                                            <li
                                                key={strength}
                                                className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === "documents" && (
                            <div>
                                <h2 className="text-lg font-bold text-navy">
                                    Supporting documents
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Files supplied with the candidate&apos;s application.
                                </p>
                                <div className="mt-4">
                                    <DocumentRows candidate={candidate} expanded />
                                </div>
                            </div>
                        )}

                        {activeTab === "assessments" && (
                            <CandidateAssessmentsPanel candidateId={candidate.id} />
                        )}

                        {activeTab === "evaluation" && (
                            <CandidateEvaluationPanel />
                        )}

                        {activeTab === "notes" && (
                            <div>
                                <h2 className="text-lg font-bold text-navy">
                                    Hiring notes
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Notes are internal and are never visible to the candidate.
                                </p>
                                {savedNotes ? (
                                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                                        <p className="text-xs leading-6 text-slate-600">
                                            {savedNotes}
                                        </p>
                                        <p className="mt-2 text-[10px] font-medium text-slate-400">
                                            Saved by Hiring Admin · just now
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-xs text-slate-400">
                                        No private notes have been saved yet.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "activity" && (
                            <div>
                                <h2 className="mb-4 text-lg font-bold text-navy">
                                    Application activity
                                </h2>
                                <ActivityList candidate={candidate} />
                            </div>
                        )}
                    </div>
                </section>

                <aside className="self-start rounded-2xl border border-slate-200 bg-white p-5 xl:sticky xl:top-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-navy">Manual review</h2>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                                Completed only by the Hiring Admin
                            </p>
                        </div>
                        <UserRound className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="mt-5 space-y-2.5">
                        {reviewItems.map(item => (
                            <label
                                key={item}
                                className="flex cursor-pointer items-center gap-2.5 text-[11px] font-medium text-slate-600"
                            >
                                <input
                                    type="checkbox"
                                    checked={review[item]}
                                    onChange={() =>
                                        setReview(previous => ({
                                            ...previous,
                                            [item]: !previous[item],
                                        }))
                                    }
                                    className="h-4 w-4 rounded border-slate-300 accent-navy"
                                />
                                {item}
                            </label>
                        ))}
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-4">
                        <label
                            htmlFor="private-hiring-notes"
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                        >
                            Private hiring notes
                        </label>
                        <textarea
                            id="private-hiring-notes"
                            value={notes}
                            maxLength={1000}
                            onChange={event => setNotes(event.target.value)}
                            placeholder="Enter your notes here..."
                            className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        <p className="mt-1 text-right text-[10px] text-slate-400">
                            {notes.length} / 1000
                        </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-b border-slate-200 pb-4">
                        <span className="text-[10px] font-bold text-slate-500">
                            Next review due
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-navy">
                            <CalendarDays className="h-3.5 w-3.5" />
                            31 July 2026
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={saveReview}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-[11px] font-bold text-navy transition-colors hover:bg-slate-50"
                        >
                            <Save className="h-3.5 w-3.5" />
                            Save review
                        </button>
                        <button
                            type="button"
                            onClick={advanceStage}
                            disabled={!nextStage || stage === "Rejected"}
                            className="inline-flex h-9 items-center justify-center rounded-xl bg-navy px-2 text-[11px] font-bold text-white transition-colors hover:bg-navy-light disabled:opacity-40"
                        >
                            {nextStage ? `Advance to ${nextStage.toLowerCase()}` : stage}
                        </button>
                    </div>

                    <div className="mt-5 border-t border-slate-200 pt-4">
                        <h3 className="text-xs font-bold text-navy">Review activity</h3>
                        <div className="mt-3">
                            <ActivityList candidate={candidate} />
                        </div>
                    </div>
                </aside>
            </div>

            {showRejectConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reject-dialog-title"
                    onClick={() => setShowRejectConfirm(false)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="reject-dialog-title"
                                    className="text-xl font-bold text-navy"
                                >
                                    Reject this application?
                                </h2>
                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    This records a manual rejection. The candidate will not
                                    be contacted automatically.
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close rejection confirmation"
                                onClick={() => setShowRejectConfirm(false)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowRejectConfirm(false)}
                                className="h-9 rounded-xl border border-slate-300 px-4 text-xs font-bold text-navy hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={rejectApplication}
                                className="h-9 rounded-xl bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700"
                            >
                                Reject application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
