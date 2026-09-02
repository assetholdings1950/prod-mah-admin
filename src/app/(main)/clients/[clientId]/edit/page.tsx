"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { useAppSelector } from "@/store/hooks/hooks";
import { IClients } from "@/interface/client";
import appClient from "@/lib/appClient";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import { FormState, SetFormField, Tab } from "@/components/clients/types";
import { ImageModal, TABS } from "@/components/clients/primitives";
import { PersonalTab } from "@/components/clients/PersonalTab";
import { ContactTab } from "@/components/clients/ContactTab";
import { AccountTab } from "@/components/clients/AccountTab";
import { KycTab } from "@/components/clients/KycTab";
import { BankTab } from "@/components/clients/BankTab";
import { WalletsTab } from "@/components/clients/WalletsTab";
import { FinancialTab } from "@/components/clients/FinancialTab";
import { NotesTab } from "@/components/clients/NotesTab";
import TransactionHistoryTab from "@/components/clients/TransactionHistoryTab";
import BalanceTab from "@/components/clients/BalanceTab";
import ClientPortfolioTab from "@/components/clients/ClientPortfolioTab";
import ActivityTab from "@/components/clients/ActivityTab";
import AccountFormTab from "@/components/clients/AccountFormTab";
import AccountManagerTab from "@/components/clients/AccountManagerTab";

const VALID_TABS: Tab[] = [
    "personal", "contact", "account", "account-manager", "account-form", "kyc", "bank", "wallets", "financial", "notes", "transactions", "balance", "portfolio", "activity",
];
const SAVE_TABS = new Set<Tab>(["personal", "contact", "account", "kyc", "notes"]);

const EMPTY_FORM: FormState = {
    firstName: "", lastName: "", dateOfBirth: "", gender: "male",
    phoneNumber: "", countryCode: "", country: "", state: "", city: "", address: "", postalCode: "",
    preferredCurrency: "USD", riskProfile: "moderate", kycStatus: "pending", status: "pending",
    isKycRequired: false, kycRemarks: "",
    notes: "",
};

function buildForm(src: IClients): FormState {
    return {
        firstName: src.firstName ?? "",
        lastName: src.lastName ?? "",
        dateOfBirth: src.dateOfBirth ? src.dateOfBirth.slice(0, 10) : "",
        gender: src.gender ?? "male",
        phoneNumber: src.phoneNumber ?? "",
        countryCode: src.countryCode ?? "",
        country: src.country ?? "",
        state: src.state ?? "",
        city: src.city ?? "",
        address: src.address ?? "",
        postalCode: src.postalCode ?? "",
        preferredCurrency: src.preferredCurrency ?? "USD",
        riskProfile: src.riskProfile ?? "moderate",
        kycStatus: src.kycStatus ?? "pending",
        status: src.status ?? "pending",
        isKycRequired: src.isKycRequired ?? false,
        kycRemarks: src.kycVerification?.remarks ?? "",
        notes: src.notes ?? "",
    };
}

export default function EditClientPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const admin = useAppSelector((s) => s.auth.user);

    const clientMongoId = params.clientId as string;
    const rawTab = searchParams.get("tab") as Tab | null;
    const initialTab: Tab = rawTab && VALID_TABS.includes(rawTab) ? rawTab : "personal";

    const [client, setClient] = useState<IClients | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [saving, setSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    const fetchClientDetails = useCallback(async () => {
        if (!clientMongoId) return;
        setLoading(true);
        try {
            const res = await appClient.get(`/api/clients/details?id=${clientMongoId}`);
            const data: IClients = res.data?.data ?? res.data?.client ?? res.data;
            setClient(data);
            setForm(buildForm(data));
        } catch {
            toastError("Failed to load client details.");
        } finally {
            setLoading(false);
        }
    }, [clientMongoId]);

    useEffect(() => { fetchClientDetails(); }, [fetchClientDetails]);

    useEffect(() => {
        router.replace(`?tab=${activeTab}`, { scroll: false } as Parameters<typeof router.replace>[1]);
    }, [activeTab]);

    useEffect(() => {
        if (!previewUrl) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewUrl(null); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [previewUrl]);

    const set: SetFormField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!client) return;
        setSaving(true);
        try {
            const { kycRemarks, ...rest } = form;
            const res = await appClient.post("/api/clients/update", {
                _id: client._id,
                ...rest,
                kycVerification: {
                    ...client.kycVerification,
                    remarks: kycRemarks,
                    verifiedAt: new Date().toISOString(),
                    verifiedBy: admin?._id,
                },
            });
            if (res.data?.status || res.status === 200) {
                const updated: IClients = res.data?.client ?? res.data?.data ?? client;
                setClient(updated);
                setForm(buildForm(updated));
                toastSuccess("Client updated successfully.");
            } else {
                toastError(res.data?.message ?? "Update failed.");
            }
        } catch {
            toastError("Something went wrong while saving.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full flex flex-col gap-5 p-1 text-foreground">
                <WorksSpaceHeader isButtonVisible={false} subHeading="Client Management Console" heading="Edit Client" />
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-7 w-7 animate-spin text-navy/40" />
                        <p className="text-xs text-slate-400 font-medium">Loading client data…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Client not found.
            </div>
        );
    }

    const initials = `${client.firstName} ${client.lastName}`
        .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <>
            {previewUrl && <ImageModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}

            <div className="w-full flex flex-col gap-5 p-1 text-foreground">
                <WorksSpaceHeader isButtonVisible={false} subHeading="Client Management Console" heading="Edit Client" />

                {/* Identity strip */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm px-5 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                        {client.profileImage
                            ? <img src={client.profileImage} alt={client.firstName} className="w-full h-full object-cover" />
                            : initials}
                    </div>
                    <div>
                        <p className="text-[15px] font-semibold text-slate-800 leading-tight">{client.firstName} {client.lastName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{client.email}</p>
                    </div>
                    <span className="ml-auto text-[11px] font-mono text-slate-500 bg-slate-100 rounded px-2 py-0.5">
                        {client.clientId}
                    </span>
                </div>

                {/* Tabs card */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm">

                    {/* Tab bar */}
                    <div className="flex border-b border-slate-100 overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-5 py-3 text-[12px] font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className={["transactions", "balance", "portfolio", "activity", "account-form"].includes(activeTab) ? "p-4" : "p-6"}>
                        {activeTab === "personal" && <PersonalTab form={form} set={set} client={client} />}
                        {activeTab === "contact" && <ContactTab form={form} set={set} />}
                        {activeTab === "account" && <AccountTab form={form} set={set} />}
                        {activeTab === "account-manager" && (
                            <AccountManagerTab client={client} onAssigned={fetchClientDetails} />
                        )}
                        {activeTab === "account-form" && <AccountFormTab clientId={client._id} />}
                        {activeTab === "kyc" && (
                            <KycTab form={form} set={set} kyc={client.kycVerification} onPreview={setPreviewUrl} />
                        )}
                        {activeTab === "bank" && <BankTab clientId={client._id} userModel="Client" />}
                        {activeTab === "wallets" && <WalletsTab clientId={client._id} userModel="Client" />}
                        {activeTab === "financial" && <FinancialTab client={client} />}
                        {activeTab === "notes" && <NotesTab notes={form.notes} set={set} />}
                        {activeTab === "transactions" && <TransactionHistoryTab clientId={client._id} />}
                        {activeTab === "balance" && <BalanceTab clientId={client._id} client={client} onRefreshClient={fetchClientDetails} />}
                        {activeTab === "portfolio" && <ClientPortfolioTab clientId={client._id} userModel="Client" />}
                        {activeTab === "activity" && <ActivityTab userId={client._id} userModel="Client" />}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ChevronLeft size={15} />
                            Back to Clients
                        </button>
                        {SAVE_TABS.has(activeTab) && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 disabled:opacity-60 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-primary/10 transition-all"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
