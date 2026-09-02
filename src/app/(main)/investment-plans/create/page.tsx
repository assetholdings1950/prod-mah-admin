"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import appClient from "@/lib/appClient";
import { uploadCoverPhoto } from "@/cloudionary-helpers/coverPhotoUpload";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { Loader2, Save } from "lucide-react";
import { useAppSelector } from "@/store/hooks/hooks";
import { FormState, ChargeRow, EMPTY_FORM, slugify } from "../_components/types";
import InvestmentPlanForm from "../_components/InvestmentPlanForm";

const CreateInvestmentPlanPage = () => {
    const router = useRouter();
    const [form, setForm]       = useState<FormState>(EMPTY_FORM);
    const [charges, setCharges] = useState<ChargeRow[]>([]);
    const [photoFile, setPhotoFile]       = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [saving, setSaving]             = useState(false);
    const [slugEdited, setSlugEdited]     = useState(false);

    const admin = useAppSelector((store) => store.auth.user);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handlePhotoFile = (f: File) => {
        setPhotoFile(f);
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(f);
    };

    const handleSave = async (asDraft = false) => {
        if (!form.name.trim()) { toastError("Plan name is required."); return; }
        if (form.category !== "crypto") {
            if (!form.minAmount || Number(form.minAmount) <= 0) { toastError("Minimum investment amount must be greater than 0."); return; }
            if (Number(form.maxAmount) <= Number(form.minAmount)) { toastError("Maximum amount must be greater than minimum amount."); return; }
        }
        if (!form.roiMin || Number(form.roiMin) <= 0) { toastError("ROI must be greater than 0."); return; }
        if (form.roiType === "range" && Number(form.roiMax) <= Number(form.roiMin)) { toastError("ROI max must be greater than ROI min."); return; }

        setSaving(true);
        try {
            let coverPhotourl = "";
            if (photoFile) {
                coverPhotourl = await uploadCoverPhoto(photoFile, form.slug, "investments-plans");
            }

            const payload = {
                name:               form.name.trim(),
                slug:               form.slug || slugify(form.name),
                shortDescription:   form.shortDescription,
                description:        form.description,
                category:           form.category,
                minAmount:          form.category !== "crypto" ? Number(form.minAmount) : undefined,
                maxAmount:          form.category !== "crypto" ? Number(form.maxAmount) : undefined,
                currency:           form.currency,
                roiType:            form.roiType,
                roiMin:             Number(form.roiMin),
                roiMax:             form.roiType === "range" && form.roiMax ? Number(form.roiMax) : undefined,
                roiPeriod:          form.roiPeriod,
                payoutType:         form.payoutType,
                durationMinMonths:  Number(form.durationMinMonths),
                durationMaxMonths:  Number(form.durationMaxMonths),
                lockInMonths:       form.lockInMonths ? Number(form.lockInMonths) : undefined,
                exitPenaltyPercent: form.exitPenaltyPercent ? Number(form.exitPenaltyPercent) : undefined,
                riskLevel:          form.riskLevel,
                termsAndConditions: form.termsAndConditions,
                status:             asDraft ? "draft" : form.status,
                featured:           form.featured,
                sortOrder:          Number(form.sortOrder),
                photourl:           coverPhotourl,
                createdBy:          admin?._id,
            };

            const res = await appClient.post("/api/investment-plans/create", payload);
            if (!res.data?.status) {
                toastError(res.data?.message ?? "Failed to create plan.");
                return;
            }

            // Save charges if any were configured
            const planId = res.data.plan?._id;
            if (planId && charges.length > 0) {
                const validCharges = charges.filter(c => c.particular.trim() && Number(c.chargePercent) > 0);
                if (validCharges.length > 0) {
                    await appClient.post("/api/plan-charges", {
                        planId,
                        charges: validCharges.map(c => ({
                            particular:    c.particular.trim(),
                            chargePercent: Number(c.chargePercent),
                        })),
                        adminId: admin?._id,
                    });
                }
            }

            toastSuccess("Investment plan created successfully.");
            router.push("/investment-plans/all");
        } catch (err: unknown) {
            toastError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-5 p-1 text-foreground">
            <WorksSpaceHeader
                isButtonVisible={false}
                subHeading="Investment Plans"
                heading="Create Investment Plan"
            />
            <InvestmentPlanForm
                form={form}
                set={set}
                slugEdited={slugEdited}
                setSlugEdited={setSlugEdited}
                photoFile={photoFile}
                photoPreview={photoPreview}
                onPhotoFile={handlePhotoFile}
                onPhotoRemove={() => { setPhotoFile(null); setPhotoPreview(""); }}
                onBack={() => router.back()}
                charges={charges}
                onChargesChange={setCharges}
                footerActions={
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 disabled:opacity-50 px-4 py-2.5 rounded-xl transition-all"
                        >
                            Save as Draft
                        </button>
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 disabled:opacity-60 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-navy/15 transition-all"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Publish Plan
                        </motion.button>
                    </div>
                }
            />
        </div>
    );
};

export default CreateInvestmentPlanPage;
