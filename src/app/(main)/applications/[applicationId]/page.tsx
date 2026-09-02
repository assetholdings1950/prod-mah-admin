"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, Download, FileText, Loader2, Mail, MapPin, Phone, Plus, Save, Video } from "lucide-react";
import { ApplicationDossier, CandidateEvaluation, HIRING_STAGES, HiringStage, hiringApi } from "@/lib/hiringApi";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

const REVIEW_FIELDS = [
    ["eligibilityConfirmed", "Eligibility confirmed"],
    ["experienceRelevant", "Experience is relevant"],
    ["documentsReviewed", "Resume and documents reviewed"],
    ["introductionVideoReviewed", "Introduction video reviewed"],
    ["conflictCheck", "Conflict check completed"],
] as const;

const dateTime = (value?: string) => value ? new Intl.DateTimeFormat("en-SG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default function CandidateApplicationPage({ params }: { params: Promise<{ applicationId: string }> }) {
    const { applicationId } = use(params);
    const reference = decodeURIComponent(applicationId);
    const [dossier, setDossier] = useState<ApplicationDossier | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState("");
    const [error, setError] = useState("");
    const [note, setNote] = useState("");
    const [downloadingResume, setDownloadingResume] = useState(false);

    const load = async () => {
        setLoading(true); setError("");
        try { setDossier(await hiringApi.application(reference)); }
        catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not load candidate."); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, [reference]);

    const updateStage = async (stage: HiringStage) => {
        if (!dossier) return;
        setSaving("stage");
        try { const application = await hiringApi.stage(reference, stage); setDossier({ ...dossier, application }); }
        catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Stage update failed."); }
        finally { setSaving(""); }
    };

    const toggleReview = async (field: string) => {
        if (!dossier) return;
        const review = { ...(dossier.application.review || {}), [field]: !dossier.application.review?.[field] };
        setSaving(field);
        try { const saved = await hiringApi.review(reference, review); setDossier({ ...dossier, application: { ...dossier.application, review: saved } }); }
        catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Review update failed."); }
        finally { setSaving(""); }
    };

    const addNote = async () => {
        if (!note.trim()) return;
        setSaving("note");
        try { await hiringApi.note(reference, note.trim()); setNote(""); await load(); }
        catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not save note."); }
        finally { setSaving(""); }
    };

    const downloadResume = async () => {
        if (!dossier?.application.resume) {
            toastError("This candidate does not have a downloadable resume.");
            return;
        }
        setDownloadingResume(true);
        try {
            const response = await fetch(`/api/hiring/applications/${encodeURIComponent(reference)}/resume`);
            if (!response.ok) throw new Error("Resume download failed.");
            const pdf = new Blob([await response.blob()], { type: "application/pdf" });
            const objectUrl = URL.createObjectURL(pdf);
            const anchor = document.createElement("a");
            const requestedName = dossier.application.resume.originalFilename || `${reference}-resume.pdf`;
            anchor.href = objectUrl;
            anchor.download = requestedName.toLowerCase().endsWith(".pdf") ? requestedName : `${requestedName}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
            toastSuccess("Resume downloaded successfully.");
        } catch {
            toastError("Resume download failed. Please try again.");
        } finally {
            setDownloadingResume(false);
        }
    };

    if (loading && !dossier) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
    if (!dossier) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error || "Application not found."}</div>;
    const { application, assignments, interviews } = dossier;

    return <div className="mx-auto w-full max-w-[1480px] space-y-5 pb-10">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
            <div><Link href="/applications" className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-navy"><ArrowLeft className="h-3.5 w-3.5" /> Applications</Link><h1 className="text-2xl font-extrabold text-navy">{application.firstName} {application.lastName}</h1><p className="mt-1 text-xs text-slate-500">{application.reference} · {application.jobSnapshot.title}</p></div>
            <div className="flex flex-wrap gap-2">{HIRING_STAGES.map((stage) => <button key={stage} disabled={saving === "stage"} onClick={() => updateStage(stage)} className={`rounded-lg border px-2.5 py-2 text-[10px] font-bold ${application.stage === stage ? "border-navy bg-navy text-white" : stage === "Rejected" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{stage}</button>)}</div>
        </header>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}

        <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-heading text-lg font-bold text-navy">Candidate profile</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <p className="flex items-center gap-2 text-xs text-slate-600"><Mail className="h-4 w-4 text-blue-600" />{application.email}</p><p className="flex items-center gap-2 text-xs text-slate-600"><Phone className="h-4 w-4 text-blue-600" />{application.countryCode} {application.phoneNumber}</p><p className="flex items-center gap-2 text-xs text-slate-600"><MapPin className="h-4 w-4 text-blue-600" />{application.city}, {application.country}</p><p className="flex items-center gap-2 text-xs text-slate-600"><CalendarDays className="h-4 w-4 text-blue-600" />Applied {dateTime(application.submittedAt)}</p>
                </div><div className="mt-5 grid gap-4 sm:grid-cols-3"><Info label="Qualification" value={application.highestQualification} /><Info label="Experience" value={`${application.yearsOfExperience} years`} /><Info label="Current role" value={[application.currentRole, application.currentCompany].filter(Boolean).join(" · ") || "—"} /></div><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Why Merlion</p><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">{application.motivation}</p></div></section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-heading text-lg font-bold text-navy">Documents</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Asset icon={FileText} label="Resume" asset={application.resume} download onDownload={() => void downloadResume()} downloading={downloadingResume} /><Asset icon={Video} label="Introduction video" asset={application.introductionVideo} /></div></section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-heading text-lg font-bold text-navy">Assignments</h2><Link href={`/assessments?candidate=${encodeURIComponent(application.reference)}`} className="text-[11px] font-bold text-blue-600">Manage assignments</Link></div><div className="mt-4 space-y-2">{assignments.length ? assignments.map((item) => {
                    const receivedMarks = typeof item.score === "number" ? item.score : item.questionReviews?.length ? item.questionReviews.reduce((total, review) => total + review.awardedMarks, 0) : null;
                    const totalMarks = item.maximumScore || item.templateSnapshot?.totalMarks || item.questionReviews?.reduce((total, review) => total + review.maximumMarks, 0) || 0;
                    const statusClass = item.status === "Passed"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : item.status === "Not passed"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : item.status === "Revision requested"
                                ? "border-orange-200 bg-orange-50 text-orange-700"
                                : "border-blue-100 bg-blue-50 text-blue-700";
                    return <div key={item._id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-navy">{item.title}</p><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]"><span className="text-slate-400">Due {dateTime(item.dueAt)}</span>{receivedMarks !== null && <><span aria-hidden="true" className="text-slate-300">•</span><span className="font-bold text-emerald-700">{receivedMarks} / {totalMarks} marks</span></>}</div></div><span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold ${statusClass}`}>{item.status}</span></div>;
                }) : <p className="text-xs text-slate-400">No assignment has been assigned.</p>}</div></section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-heading text-lg font-bold text-navy">Interviews</h2><Link href={`/interviews?candidate=${encodeURIComponent(application.reference)}`} className="text-[11px] font-bold text-blue-600">Schedule interview</Link></div><div className="mt-4 space-y-2">{interviews.length ? interviews.map((item) => <div key={item._id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between"><p className="text-xs font-bold text-navy">{item.type}</p><span className="text-[10px] font-bold text-blue-700">{item.status}</span></div><p className="mt-1 text-[10px] text-slate-500">{dateTime(item.startAt)} · {item.mode}</p></div>) : <p className="text-xs text-slate-400">No interviews scheduled.</p>}</div></section>
                <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-heading text-lg font-bold text-navy">Private notes</h2><div className="mt-4 space-y-3">{application.notes?.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-3"><p className="whitespace-pre-wrap text-xs text-slate-600">{item.body}</p><p className="mt-2 text-[9px] text-slate-400">{item.createdByLabel || "Hiring Admin"} · {dateTime(item.createdAt)}</p></div>)}</div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add an internal note…" className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500" /><button onClick={addNote} disabled={!note.trim() || saving === "note"} className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-navy px-3 text-[10px] font-bold text-white disabled:opacity-50">{saving === "note" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Save note</button></section>
                <section className="flex h-[460px] flex-col rounded-2xl border border-slate-200 bg-white p-5"><h2 className="shrink-0 font-heading text-lg font-bold text-navy">Activity</h2><div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-2">{application.activities?.map((item) => <div key={item._id} className="border-l-2 border-blue-200 pl-3"><p className="text-xs font-bold text-navy">{item.action}</p><p className="mt-1 text-[10px] text-slate-500">{item.detail}</p><p className="mt-1 text-[9px] text-slate-400">{dateTime(item.at)}</p></div>)}</div></section>
            </div>

            <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-heading text-lg font-bold text-navy">Manual review</h2><div className="mt-4 space-y-2">{REVIEW_FIELDS.map(([field, label]) => { const checked = Boolean(application.review?.[field]); return <button key={field} onClick={() => toggleReview(field)} disabled={saving === field} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"><span className={`flex h-5 w-5 items-center justify-center rounded border ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}>{checked && <Check className="h-3 w-3" />}</span><span className="text-xs font-semibold text-slate-600">{label}</span></button>; })}</div></section>
                <EvaluationPanel reference={reference} initial={dossier.evaluation} />
            </div>
        </div>
    </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xs font-semibold text-navy">{value}</p></div>; }
function Asset({ icon: Icon, label, asset, download = false, onDownload, downloading = false }: { icon: typeof FileText; label: string; asset?: { secureUrl: string; originalFilename: string; bytes?: number } | null; download?: boolean; onDownload?: () => void; downloading?: boolean }) {
    if (!asset) return <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">No {label.toLowerCase()} uploaded.</div>;
    const content = <><Icon className="h-5 w-5 shrink-0 text-blue-600" /><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="truncate text-xs font-semibold text-navy">{asset.originalFilename}</p></div>{download && <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold text-blue-600">{downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{downloading ? "Downloading…" : "Download PDF"}</span>}</>;
    return download ? <button type="button" onClick={onDownload} disabled={downloading} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-blue-200 hover:bg-blue-50/40 disabled:cursor-wait disabled:opacity-60">{content}</button> : <a href={asset.secureUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">{content}</a>;
}
function EvaluationPanel({ reference, initial }: { reference: string; initial: CandidateEvaluation | null }) {
    const defaultCriteria = ["Role expertise", "Analytical judgement", "Communication", "Merlion standards"].map((label, index) => ({ id: `criterion-${index + 1}`, label, weight: 25, score: 3 }));
    const [value, setValue] = useState<CandidateEvaluation>(initial || { criteria: defaultCriteria, evidence: "", strengths: "", concerns: "", recommendation: "Consider" });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState<{ evidence?: string; strengths?: string }>({});

    const updateTextField = (field: "evidence" | "strengths" | "concerns", text: string) => {
        setValue({ ...value, [field]: text });
        if (field !== "concerns" && text.trim()) {
            setFieldErrors((current) => ({ ...current, [field]: undefined }));
        }
        setMessage("");
    };

    const save = async () => {
        const errors = {
            evidence: value.evidence?.trim() ? undefined : "Add evidence supporting the scores.",
            strengths: value.strengths?.trim() ? undefined : "Describe the candidate's strengths.",
        };

        if (errors.evidence || errors.strengths) {
            setFieldErrors(errors);
            setMessage("");
            return;
        }

        setSaving(true);
        setFieldErrors({});
        setMessage("");
        try {
            const saved = await hiringApi.saveEvaluation(reference, {
                ...value,
                evidence: value.evidence?.trim(),
                strengths: value.strengths?.trim(),
                concerns: value.concerns?.trim(),
            });
            setValue(saved);
            setMessage("Evaluation saved.");
        } catch {
            setMessage("The evaluation could not be saved. Please review the fields and try again.");
        } finally {
            setSaving(false);
        }
    };

    const fieldClass = (invalid: boolean) => `min-h-20 w-full rounded-lg border p-3 text-xs outline-none transition focus:ring-2 ${invalid ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`;

    return <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-heading text-lg font-bold text-navy">Candidate evaluation</h2>
        <p className="mt-1 text-[10px] text-slate-400">All scores are entered and reviewed manually.</p>
        <div className="mt-4 space-y-2">{value.criteria?.map((criterion, index) => <div key={criterion.id} className="grid grid-cols-[1fr_70px] items-center gap-3 rounded-lg bg-slate-50 p-2.5"><span className="text-xs font-semibold text-slate-600">{criterion.label} ({criterion.weight}%)</span><select value={criterion.score} onChange={(event) => setValue({ ...value, criteria: value.criteria?.map((item, itemIndex) => itemIndex === index ? { ...item, score: Number(event.target.value) } : item) })} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option></select></div>)}</div>
        <div className="mt-3">
            <textarea aria-label="Evidence supporting the scores" aria-invalid={Boolean(fieldErrors.evidence)} aria-describedby={fieldErrors.evidence ? "evaluation-evidence-error" : undefined} value={value.evidence || ""} onChange={(event) => updateTextField("evidence", event.target.value)} placeholder="Evidence supporting the scores *" className={fieldClass(Boolean(fieldErrors.evidence))} />
            {fieldErrors.evidence && <p id="evaluation-evidence-error" role="alert" className="mt-1.5 text-[10px] font-medium text-red-600">{fieldErrors.evidence}</p>}
        </div>
        <div className="mt-2">
            <textarea aria-label="Candidate strengths" aria-invalid={Boolean(fieldErrors.strengths)} aria-describedby={fieldErrors.strengths ? "evaluation-strengths-error" : undefined} value={value.strengths || ""} onChange={(event) => updateTextField("strengths", event.target.value)} placeholder="Candidate strengths *" className={fieldClass(Boolean(fieldErrors.strengths))} />
            {fieldErrors.strengths && <p id="evaluation-strengths-error" role="alert" className="mt-1.5 text-[10px] font-medium text-red-600">{fieldErrors.strengths}</p>}
        </div>
        <textarea value={value.concerns || ""} onChange={(event) => updateTextField("concerns", event.target.value)} placeholder="Concerns (optional)" className="mt-2 min-h-16 w-full rounded-lg border border-slate-200 p-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <select value={value.recommendation || "Consider"} onChange={(event) => setValue({ ...value, recommendation: event.target.value })} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"><option>Strong recommendation</option><option>Consider</option><option>Hold</option><option>Reject</option></select>
        {message && <p role="status" className={`mt-2 text-[10px] ${message === "Evaluation saved." ? "text-emerald-600" : "text-red-600"}`}>{message}</p>}
        <button onClick={save} disabled={saving} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-navy px-3 text-[10px] font-bold text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" />{saving ? "Saving…" : "Save evaluation"}</button>
    </section>;
}
