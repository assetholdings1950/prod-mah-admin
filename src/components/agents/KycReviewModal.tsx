"use client";

import { IAgents } from "@/interface/agent";
import { Check, X, ShieldAlert, Calendar, User, Mail, ShieldCheck, ZoomIn } from "lucide-react";
import { useState } from "react";
import appClient from "@/lib/appClient";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";

interface Props {
    agent: IAgents;
    onClose: () => void;
    onStatusUpdated: () => void;
}

export default function KycReviewModal({ agent, onClose, onStatusUpdated }: Props) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [remarks, setRemarks] = useState("");

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            const res = await appClient.post("/api/agents/approve-kyc", { userId: agent._id });
            if (res.data?.status || res.status === 200) {
                toastSuccess("Agent KYC approved successfully. Account is now active!");
                onStatusUpdated();
                onClose();
            } else {
                toastError(res.data?.message ?? "KYC approval failed.");
            }
        } catch (error) {
            console.error("KYC approve error:", error);
            toastError("Something went wrong while approving KYC.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (remarks: string) => {
        setSubmitting(true);
        try {
            const res = await appClient.post("/api/agents/update", {
                _id: agent._id,
                kycStatus: "rejected",
                kycVerification: {
                    ...agent.kycVerification,
                    remarks: remarks || "KYC verification documents rejected by administrator.",
                }
            });
            if (res.data?.status || res.status === 200) {
                toastSuccess("Agent KYC rejected successfully.");
                onStatusUpdated();
                onClose();
            } else {
                toastError(res.data?.message ?? "Failed to reject KYC.");
            }
        } catch (error) {
            console.error("KYC reject error:", error);
            toastError("Something went wrong while rejecting KYC.");
        } finally {
            setSubmitting(false);
        }
    };



    const kyc = agent.kycVerification;

    return (
        <>
            {/* Main overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                <div
                    className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-navy/5 text-navy rounded-xl border border-navy/10 flex items-center justify-center">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800">Review KYC Verification Documents</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Agent Onboarding Audit</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Agent identity overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-150 rounded-2xl p-4 text-[12px] font-medium text-slate-600">
                            <div className="flex items-center gap-2.5">
                                <User size={15} className="text-slate-400 shrink-0" />
                                <div>
                                    <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Agent Name</span>
                                    <span className="text-slate-700 font-bold">{agent.firstName} {agent.lastName}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Mail size={15} className="text-slate-400 shrink-0" />
                                <div>
                                    <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Email Address</span>
                                    <span className="text-slate-700 truncate max-w-[200px] inline-block">{agent.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Calendar size={15} className="text-slate-400 shrink-0" />
                                <div>
                                    <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Submitted Date</span>
                                    <span className="text-slate-700 font-bold">
                                        {kyc?.submittedAt ? new Date(kyc.submittedAt).toLocaleString() : "Not submitted"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Government ID & documents review */}
                        <div className="space-y-4">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Government ID Verification</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">ID Front Side</span>
                                    {kyc?.governmentIdFront ? (
                                        <button
                                            onClick={() => setPreviewUrl(kyc.governmentIdFront)}
                                            className="group relative block w-full rounded-2xl overflow-hidden border border-slate-200 aspect-[1.6/1] bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <img src={kyc.governmentIdFront} alt="ID Front Side" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-[12px] font-semibold">
                                                <ZoomIn size={16} /> Preview ID Front
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="aspect-[1.6/1] rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400 italic">Not Uploaded</div>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">ID Back Side</span>
                                    {kyc?.governmentIdBack ? (
                                        <button
                                            onClick={() => setPreviewUrl(kyc.governmentIdBack)}
                                            className="group relative block w-full rounded-2xl overflow-hidden border border-slate-200 aspect-[1.6/1] bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <img src={kyc.governmentIdBack} alt="ID Back Side" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-[12px] font-semibold">
                                                <ZoomIn size={16} /> Preview ID Back
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="aspect-[1.6/1] rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400 italic">Not Uploaded</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Media verification */}
                        <div className="space-y-4">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Biometric & Declaration Media</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">Live Selfie</span>
                                    {kyc?.liveSelfie ? (
                                        <button
                                            onClick={() => setPreviewUrl(kyc.liveSelfie)}
                                            className="group relative block w-full rounded-2xl overflow-hidden border border-slate-200 aspect-[1.6/1] bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <img src={kyc.liveSelfie} alt="Live Selfie" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-[12px] font-semibold">
                                                <ZoomIn size={16} /> Preview Selfie
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="aspect-[1.6/1] rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400 italic">Not Uploaded</div>
                                    )}
                                </div>
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">Self-Declaration Video</span>
                                    {kyc?.selfDeclarationVideo ? (
                                        <div className="w-full rounded-2xl overflow-hidden border border-slate-200 aspect-[1.6/1] bg-black flex items-center justify-center shadow-sm">
                                            <video
                                                src={kyc.selfDeclarationVideo}
                                                controls
                                                playsInline
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-[1.6/1] rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400 italic">Not Uploaded</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Audit Details */}
                        {kyc?.remarks && (
                            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                                <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Previous Rejection / Remarks</span>
                                    <p className="text-[12px] text-amber-700 mt-0.5">{kyc.remarks}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        {showRejectForm ? (
                            <div className="w-full flex flex-col gap-3">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Reason for Rejection
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Enter the reason why these documents are being rejected..."
                                    className="w-full h-20 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none text-slate-700"
                                    disabled={submitting}
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowRejectForm(false)}
                                        disabled={submitting}
                                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleReject(remarks)}
                                        disabled={submitting || !remarks.trim()}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                    >
                                        <X size={13} />
                                        {submitting ? "Rejecting..." : "Confirm Rejection"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-end gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 cursor-pointer"
                                >
                                    Close Audit
                                </button>
                                {agent.kycStatus === "under_review" && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowRejectForm(true)}
                                            disabled={submitting}
                                            className="px-4 py-2 border border-red-200 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                        >
                                            <X size={13} />
                                            Reject Documents
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleApprove}
                                            disabled={submitting}
                                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                                        >
                                            <Check size={13} />
                                            {submitting ? "Approving..." : "Approve KYC"}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Preview Modal */}
            {previewUrl && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
                    onClick={() => setPreviewUrl(null)}
                >
                    <button
                        onClick={() => setPreviewUrl(null)}
                        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                    <img
                        src={previewUrl}
                        alt="Zoomed Review"
                        className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
