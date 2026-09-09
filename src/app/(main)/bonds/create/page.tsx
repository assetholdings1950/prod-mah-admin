"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import BondForm from "../_components/BondForm";
import { BondFormState, EMPTY_BOND_FORM, buildBondPayload, validateBondForm } from "../_components/types";

export default function CreateBondPage() {
    const router = useRouter();
    const [form, setForm] = useState<BondFormState>(EMPTY_BOND_FORM);
    const [slugEdited, setSlugEdited] = useState(false);
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof BondFormState>(key: K, value: BondFormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

    const save = async (asDraft: boolean) => {
        if (form.offeringDocumentUploading || form.termSheetUploading) return toastError("Wait for document uploads to finish.");
        const error = validateBondForm(form);
        if (error) return toastError(error);
        setSaving(true);
        try {
            const status = asDraft ? "draft" : (form.status === "draft" ? "active" : form.status);
            const payload = { ...buildBondPayload(form), status };
            const response = await appClient.post("/api/bonds/create", payload);
            if (!response.data?.status) return toastError(response.data?.message || "Failed to create bond.");
            toastSuccess("Bond created successfully.");
            router.push("/bonds/all");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            toastError(err.response?.data?.message || err.message || "Failed to create bond.");
        } finally { setSaving(false); }
    };

    return (
        <div className="w-full flex flex-col gap-5 p-1 text-foreground">
            <WorksSpaceHeader isButtonVisible={false} subHeading="Bonds" heading="Create Bond" />
            <BondForm form={form} set={set} slugEdited={slugEdited} setSlugEdited={setSlugEdited} onBack={() => router.back()} footerActions={<>
                <button type="button" disabled={saving || form.offeringDocumentUploading || form.termSheetUploading} onClick={() => save(true)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-50">Save as Draft</button>
                <button type="button" disabled={saving || form.offeringDocumentUploading || form.termSheetUploading} onClick={() => save(false)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold shadow-md shadow-navy/15 disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Publish Bond
                </button>
            </>} />
        </div>
    );
}
