import { IAgents } from "@/interface/agent";
import Select from "@/components/common/Select";
import { Field, ImageThumbnail, ReadonlyField, SectionHeading, inputCls } from "../clients/primitives";
import { FormState, SetFormField } from "./types";

interface Props {
    form: FormState;
    set: SetFormField;
    kyc: IAgents["kycVerification"];
    onPreview: (url: string) => void;
}

export const KycTab = ({ form, set, kyc, onPreview }: Props) => (
    <div className="flex flex-col gap-8">

        {/* Admin remarks */}
        <div>
            <SectionHeading>Admin Remarks</SectionHeading>
            <Field label="Remarks / Review Notes">
                <textarea
                    rows={4}
                    className={`${inputCls} resize-none`}
                    value={form.kycRemarks}
                    onChange={(e) => set("kycRemarks", e.target.value)}
                    placeholder="Add remarks about this agent's KYC submission..."
                />
            </Field>
        </div>

        {/* Government ID */}
        <div>
            <SectionHeading>Government ID</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ReadonlyField label="ID Type" value={kyc?.governmentIdType?.toLocaleLowerCase()} />
                <ReadonlyField label="ID Number" value={kyc?.governmentIdNumber} />
                <ImageThumbnail label="ID Front" url={kyc?.governmentIdFront ?? null} onPreview={onPreview} />
                <ImageThumbnail label="ID Back" url={kyc?.governmentIdBack ?? null} onPreview={onPreview} />
            </div>
        </div>

        {/* Verification media */}
        <div>
            <SectionHeading>Verification Media</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ImageThumbnail label="Live Selfie" url={kyc?.liveSelfie ?? null} onPreview={onPreview} />
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Self-Declaration Video
                    </label>
                    {kyc?.selfDeclarationVideo ? (
                        <video
                            src={kyc.selfDeclarationVideo}
                            controls
                            className="w-full h-40 rounded-lg border border-slate-200 bg-black object-contain"
                        />
                    ) : (
                        <div className="h-40 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-300 italic">
                            Not uploaded
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Timeline */}
        <div>
            <SectionHeading>Timeline</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ReadonlyField
                    label="Submitted At"
                    value={kyc?.submittedAt ? new Date(kyc.submittedAt).toLocaleString() : null}
                />
                <ReadonlyField
                    label="Verified At"
                    value={kyc?.verifiedAt ? new Date(kyc.verifiedAt).toLocaleString() : null}
                />
                <ReadonlyField
                    label="Verified By"
                    value={kyc?.verifiedBy ? kyc.verifiedBy.fullName || kyc.verifiedBy.email : null}
                />
                <Field label="KYC Status">
                    <Select
                        fullWidth
                        value={form.kycStatus}
                        onChange={(v) => set("kycStatus", v as FormState["kycStatus"])}
                        options={[
                            { value: "pending",      label: "Pending" },
                            { value: "under_review", label: "Under Review" },
                            { value: "approved",     label: "Approved" },
                            { value: "rejected",     label: "Rejected" },
                        ]}
                    />
                </Field>
            </div>
        </div>
    </div>
);
