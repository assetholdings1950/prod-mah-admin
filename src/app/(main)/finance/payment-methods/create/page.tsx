"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import appClient from "@/lib/appClient";
import { uploadCoverPhoto } from "@/cloudionary-helpers/coverPhotoUpload";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { FormState, EMPTY_FORM, slugify } from "../_components/types";
import PaymentMethodForm from "../_components/PaymentMethodForm";

const CreatePaymentMethodPage = () => {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [slugEdited, setSlugEdited] = useState(false);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState("");
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!form.name.trim()) { toastError("Display name is required."); return; }
        if (!form.currency.trim()) { toastError("Currency is required."); return; }
        if (!form.network.trim()) { toastError("Network / channel is required."); return; }
        if (form.type === "crypto" && !form.walletAddress.trim()) { toastError("Wallet address is required for crypto methods."); return; }

        setSaving(true);
        try {
            let qrCodeUrl = "";
            if (qrFile) {
                qrCodeUrl = await uploadCoverPhoto(qrFile, form.slug || slugify(form.name), "payment-methods");
            }

            const payload = {
                name: form.name.trim(),
                slug: form.slug || slugify(form.name),
                type: form.type,
                currency: form.currency,
                network: form.network,
                walletAddress: form.type === "crypto" ? form.walletAddress.trim() : undefined,
                accountDetails: form.type === "fiat" ? form.accountDetails.trim() : undefined,
                instructions: form.instructions.trim() || undefined,
                processingTime: form.processingTime.trim(),
                status: form.status,
                sortOrder: Number(form.sortOrder),
                qrCodeUrl: qrCodeUrl || undefined,
            };

            const res = await appClient.post("/api/payment-methods/create", payload);
            if (res.data?.status) {
                toastSuccess("Payment method created successfully.");
                router.push("/finance/payment-methods/all");
            } else {
                toastError(res.data?.message ?? "Failed to create payment method.");
            }
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
                subHeading="Finance / Payment Methods"
                heading="Add Payment Method"
            />
            <PaymentMethodForm
                form={form}
                set={set}
                slugEdited={slugEdited}
                setSlugEdited={setSlugEdited}
                qrFile={qrFile}
                qrPreview={qrPreview}
                onQrFile={setQrFile}
                onQrPreview={setQrPreview}
                onBack={() => router.back()}
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
                        Save Method
                    </motion.button>
                }
            />
        </div>
    );
};

export default CreatePaymentMethodPage;
