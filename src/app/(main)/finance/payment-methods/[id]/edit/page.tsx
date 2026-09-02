"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import appClient from "@/lib/appClient";
import { uploadCoverPhoto } from "@/cloudionary-helpers/coverPhotoUpload";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";
import { FormState, EMPTY_FORM, slugify } from "../../_components/types";
import PaymentMethodForm from "../../_components/PaymentMethodForm";

const EditPaymentMethodPage = () => {
    const router = useRouter();
    const params = useParams();
    const methodId = params.id as string;

    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [slugEdited, setSlugEdited] = useState(false);
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState("");
    const [currentQrUrl, setCurrentQrUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    useEffect(() => {
        if (!methodId) return;
        setLoading(true);
        appClient
            .get(`/api/payment-methods/get?id=${methodId}`)
            .then((res) => {
                const m = res.data?.data ?? res.data?.paymentMethod ?? res.data;
                if (!m) return;
                setForm({
                    name: m.name ?? "",
                    slug: m.slug ?? "",
                    type: m.type ?? "fiat",
                    currency: m.currency ?? "USD",
                    network: m.network ?? "bank",
                    walletAddress: m.walletAddress ?? "",
                    accountDetails: m.accountDetails ?? "",
                    instructions: m.instructions ?? "",
                    processingTime: m.processingTime ?? "",
                    status: m.status ?? "active",
                    sortOrder: String(m.sortOrder ?? "1"),
                });
                if (m.qrCodeUrl) {
                    setCurrentQrUrl(m.qrCodeUrl);
                    setQrPreview(m.qrCodeUrl);
                }
                setSlugEdited(true);
            })
            .catch(() => toastError("Failed to load payment method data."))
            .finally(() => setLoading(false));
    }, [methodId]);

    const handleSave = async () => {
        if (!form.name.trim()) { toastError("Display name is required."); return; }
        if (!form.currency.trim()) { toastError("Currency is required."); return; }
        if (!form.network.trim()) { toastError("Network / channel is required."); return; }
        if (form.type === "crypto" && !form.walletAddress.trim()) { toastError("Wallet address is required for crypto methods."); return; }

        setSaving(true);
        try {
            let qrCodeUrl = currentQrUrl;
            if (qrFile) {
                qrCodeUrl = await uploadCoverPhoto(qrFile, form.slug || slugify(form.name), "payment-methods");
            }

            const payload = {
                _id: methodId,
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

            const res = await appClient.post("/api/payment-methods/update", payload);
            if (res.data?.status) {
                toastSuccess("Payment method updated successfully.");
                router.push("/finance/payment-methods/all");
            } else {
                toastError(res.data?.message ?? "Failed to update payment method.");
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
                <WorksSpaceHeader
                    isButtonVisible={false}
                    subHeading="Finance / Payment Methods"
                    heading="Edit Payment Method"
                />
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-7 w-7 animate-spin text-navy/40" />
                        <p className="text-xs text-slate-400 font-medium">Loading method data…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-5 p-1 text-foreground">
            <WorksSpaceHeader
                isButtonVisible={false}
                subHeading="Finance / Payment Methods"
                heading="Edit Payment Method"
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
                        Update Method
                    </motion.button>
                }
            />
        </div>
    );
};

export default EditPaymentMethodPage;
