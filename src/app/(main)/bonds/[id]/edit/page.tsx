"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import appClient from "@/lib/appClient";
import { BondInterface } from "@/interface/bond";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import BondForm from "../../_components/BondForm";
import { BondFormState, EMPTY_BOND_FORM, bondToForm, buildBondPayload, validateBondForm } from "../../_components/types";

export default function EditBondPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [form, setForm] = useState<BondFormState>(EMPTY_BOND_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof BondFormState>(key: K, value: BondFormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

    useEffect(() => {
        if (!id) return;
        appClient.get("/api/bonds/get", { params: { id } })
            .then((response) => {
                const bond = response.data?.bond ?? response.data?.data;
                if (!bond) throw new Error("Bond not found.");
                setForm(bondToForm(bond as BondInterface));
            })
            .catch(() => toastError("Failed to load bond."))
            .finally(() => setLoading(false));
    }, [id]);

    const save = async () => {
        if (form.offeringDocumentUploading || form.termSheetUploading) return toastError("Wait for document uploads to finish.");
        const error = validateBondForm(form);
        if (error) return toastError(error);
        setSaving(true);
        try {
            const response = await appClient.post("/api/bonds/update", { _id: id, ...buildBondPayload(form) });
            if (!response.data?.status) return toastError(response.data?.message || "Failed to update bond.");
            toastSuccess("Bond updated successfully.");
            router.push("/bonds/all");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            toastError(err.response?.data?.message || err.message || "Failed to update bond.");
        } finally { setSaving(false); }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-navy/40" /></div>;

    return (
        <div className="w-full flex flex-col gap-5 p-1 text-foreground">
            <WorksSpaceHeader isButtonVisible={false} subHeading="Bonds" heading="Edit Bond" />
            <BondForm form={form} set={set} slugEdited setSlugEdited={() => undefined} onBack={() => router.back()} footerActions={
                <button type="button" disabled={saving || form.offeringDocumentUploading || form.termSheetUploading} onClick={save} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold shadow-md shadow-navy/15 disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Update Bond
                </button>
            } />
        </div>
    );
}
