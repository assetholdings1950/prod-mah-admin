"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import appClient from "@/lib/appClient";
import { uploadCoverPhoto } from "@/cloudionary-helpers/coverPhotoUpload";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { Loader2, Save } from "lucide-react";
import { useAppSelector } from "@/store/hooks/hooks";
import { FormState, ChargeRow, EMPTY_FORM, slugify } from "../../_components/types";
import InvestmentPlanForm from "../../_components/InvestmentPlanForm";

const EditInvestmentPlanPage = () => {
    const router  = useRouter();
    const params  = useParams();
    const planId  = params.id as string;

    const [form, setForm]             = useState<FormState>(EMPTY_FORM);
    const [charges, setCharges]       = useState<ChargeRow[]>([]);
    const [photoFile, setPhotoFile]   = useState<File | null>(null);
    const [photoPreview, setPhotoPreview]   = useState("");
    const [currentLogoUrl, setCurrentLogoUrl] = useState("");
    const [saving, setSaving]         = useState(false);
    const [loading, setLoading]       = useState(true);
    const [slugEdited, setSlugEdited] = useState(false);

    const admin = useAppSelector((store) => store.auth.user);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    useEffect(() => {
        if (!planId) return;
        setLoading(true);

        Promise.all([
            appClient.get(`/api/investment-plans/get?id=${planId}`),
            appClient.get(`/api/plan-charges/${planId}`),
        ])
            .then(([planRes, chargesRes]) => {
                const plan = planRes.data?.data ?? planRes.data?.plan ?? planRes.data;
                if (plan) {
                    setForm({
                        name:               plan.name ?? "",
                        slug:               plan.slug ?? "",
                        shortDescription:   plan.shortDescription ?? "",
                        description:        plan.description ?? "",
                        category:           plan.category ?? "monthly",
                        minAmount:          String(plan.minAmount ?? ""),
                        maxAmount:          String(plan.maxAmount ?? ""),
                        currency:           plan.currency ?? "USD",
                        roiType:            plan.roiType ?? "fixed",
                        roiMin:             String(plan.roiMin ?? ""),
                        roiMax:             String(plan.roiMax ?? ""),
                        roiPeriod:          plan.roiPeriod ?? "annum",
                        payoutType:         plan.payoutType ?? "monthly",
                        durationMinMonths:  String(plan.durationMinMonths ?? "12"),
                        durationMaxMonths:  String(plan.durationMaxMonths ?? "60"),
                        lockInMonths:       String(plan.lockInMonths ?? ""),
                        exitPenaltyPercent: String(plan.exitPenaltyPercent ?? ""),
                        riskLevel:          plan.riskLevel ?? "medium",
                        termsAndConditions: plan.termsAndConditions ?? "",
                        status:             plan.status ?? "draft",
                        featured:           plan.featured ?? false,
                        sortOrder:          String(plan.sortOrder ?? "0"),
                        charges:            [],
                    });
                    if (plan.photourl) {
                        setCurrentLogoUrl(plan.photourl);
                        setPhotoPreview(plan.photourl);
                    }
                    setSlugEdited(true);
                }

                const rawCharges = chargesRes.data?.charges ?? [];
                setCharges(
                    (rawCharges as Array<{ particular: string; chargePercent: number }>).map(c => ({
                        particular:    c.particular,
                        chargePercent: String(c.chargePercent),
                    }))
                );
            })
            .catch(() => toastError("Failed to load plan data."))
            .finally(() => setLoading(false));
    }, [planId]);

    const handleSave = async () => {
        if (!form.name.trim()) { toastError("Plan name is required."); return; }
        if (form.category !== "crypto") {
            if (!form.minAmount || Number(form.minAmount) <= 0) { toastError("Minimum investment amount must be greater than 0."); return; }
            if (Number(form.maxAmount) <= Number(form.minAmount)) { toastError("Maximum amount must be greater than minimum amount."); return; }
        }
        if (!form.roiMin || Number(form.roiMin) <= 0) { toastError("ROI must be greater than 0."); return; }
        if (form.roiType === "range" && Number(form.roiMax) <= Number(form.roiMin)) { toastError("ROI max must be greater than ROI min."); return; }

        setSaving(true);
        try {
            let coverPhotourl = currentLogoUrl;
            if (photoFile) {
                coverPhotourl = await uploadCoverPhoto(photoFile, form.slug, "investments-plans");
            }

            const payload = {
                _id:                planId,
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
                status:             form.status,
                featured:           form.featured,
                sortOrder:          Number(form.sortOrder),
                photourl:           coverPhotourl,
                updatedBy:          admin?._id,
            };

            const [planRes] = await Promise.all([
                appClient.post("/api/investment-plans/update", payload),
                appClient.post("/api/plan-charges", {
                    planId,
                    charges: charges
                        .filter(c => c.particular.trim() && Number(c.chargePercent) >= 0)
                        .map(c => ({
                            particular:    c.particular.trim(),
                            chargePercent: Number(c.chargePercent),
                        })),
                    adminId: admin?._id,
                }),
            ]);

            if (planRes.data?.status) {
                toastSuccess("Investment plan updated successfully.");
                router.push("/investment-plans/all");
            } else {
                toastError(planRes.data?.message ?? "Failed to update plan.");
            }
        } catch (err: unknown) {
            toastError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full flex flex-col gap-5 p-1 text-foreground">
                <WorksSpaceHeader isButtonVisible={false} subHeading="Investment Plans" heading="Edit Investment Plan" />
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-7 w-7 animate-spin text-navy/40" />
                        <p className="text-xs text-slate-400 font-medium">Loading plan data…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-5 p-1 text-foreground">
            <WorksSpaceHeader isButtonVisible={false} subHeading="Investment Plans" heading="Edit Investment Plan" />
            <InvestmentPlanForm
                form={form}
                set={set}
                slugEdited={slugEdited}
                setSlugEdited={setSlugEdited}
                photoFile={photoFile}
                photoPreview={photoPreview}
                onPhotoFile={(f) => {
                    setPhotoFile(f);
                    const reader = new FileReader();
                    reader.onloadend = () => setPhotoPreview(reader.result as string);
                    reader.readAsDataURL(f);
                }}
                onPhotoRemove={() => { setPhotoFile(null); setPhotoPreview(""); setCurrentLogoUrl(""); }}
                onBack={() => router.back()}
                charges={charges}
                onChargesChange={setCharges}
                footerActions={
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 disabled:opacity-60 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-navy/15 transition-all"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Update Plan
                    </motion.button>
                }
            />
        </div>
    );
};

export default EditInvestmentPlanPage;
