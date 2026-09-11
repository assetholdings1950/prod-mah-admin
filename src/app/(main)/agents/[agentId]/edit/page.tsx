"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { useAppSelector } from "@/store/hooks/hooks";
import { IAgents } from "@/interface/agent";
import appClient from "@/lib/appClient";
import { toastSuccess, toastError } from "@/utils/toast-message/taost-message";
import WorksSpaceHeader from "@/components/common/WorksSpaceHeader";
import { FormState, SetFormField, Tab } from "@/components/agents/types";
import { ImageModal, TABS } from "@/components/clients/primitives";
import { PersonalTab } from "@/components/agents/PersonalTab";
import { ContactTab } from "@/components/agents/ContactTab";
import { AccountTab } from "@/components/agents/AccountTab";
import { KycTab } from "@/components/agents/KycTab";
import { BankTab } from "@/components/clients/BankTab";
import { WalletsTab } from "@/components/clients/WalletsTab";
import { FinancialTab } from "@/components/agents/FinancialTab";
import { NotesTab } from "@/components/agents/NotesTab";
import TransactionHistoryTab from "@/components/clients/TransactionHistoryTab";
import BalanceTab from "@/components/clients/BalanceTab";
import ActivityTab from "@/components/clients/ActivityTab";

const VALID_TABS: Tab[] = [
    "personal", "contact", "account", "kyc", "bank", "wallets", "financial", "notes", "transactions", "balance", "activity",
];
const SAVE_TABS = new Set<Tab>(["personal", "contact", "account", "kyc", "notes"]);

const EMPTY_FORM: FormState = {
    firstName: "", lastName: "", dateOfBirth: "", gender: "male",
    phoneNumber: "", countryCode: "", country: "", state: "", city: "", address: "", postalCode: "",
    preferredCurrency: "USD", agentLevel: "basic", commissionPercentage: 2, isCommissionEligible: true,
    salaryActivated: false, isSalaryEligibleThisMonth: false, salesThisMonth: 0,
    kycStatus: "pending", status: "pending",
    isKycRequired: false, kycRemarks: "",
    notes: "",
};

function buildForm(src: IAgents): FormState {
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
        agentLevel: src.agentLevel ?? "basic",
        commissionPercentage: src.commissionPercentage ?? 2,
        isCommissionEligible: src.isCommissionEligible ?? true,
        salaryActivated: src.salaryActivated ?? false,
        isSalaryEligibleThisMonth: src.isSalaryEligibleThisMonth ?? false,
        salesThisMonth: src.salesThisMonth ?? 0,
        kycStatus: src.kycStatus ?? "pending",
        status: src.status ?? "pending",
        isKycRequired: src.isKycRequired ?? false,
        kycRemarks: src.kycVerification?.remarks ?? "",
        notes: src.notes ?? "",
    };
}

export default function EditAgentPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const admin = useAppSelector((s) => s.auth.user);

    const agentMongoId = params.agentId as string;
    const rawTab = searchParams.get("tab") as Tab | null;
    const initialTab: Tab = rawTab && VALID_TABS.includes(rawTab) ? rawTab : "personal";

    const [agent, setAgent] = useState<IAgents | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [saving, setSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    const fetchAgentDetails = useCallback(async () => {
        if (!agentMongoId) return;
        setLoading(true);
        try {
            const res = await appClient.get(`/api/agents/details?id=${agentMongoId}`);
            const data: IAgents = res.data?.data ?? res.data?.agent ?? res.data;
            setAgent(data);
            setForm(buildForm(data));
        } catch {
            toastError("Failed to load agent details.");
        } finally {
            setLoading(false);
        }
    }, [agentMongoId]);

    useEffect(() => { fetchAgentDetails(); }, [fetchAgentDetails]);

    useEffect(() => {
        if (!previewUrl) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewUrl(null); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [previewUrl]);

    const set: SetFormField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!agent) return;
        setSaving(true);
        try {
            const { kycRemarks, ...rest } = form;
            const res = await appClient.post("/api/agents/update", {
                _id: agent._id,
                ...rest,
                kycVerification: {
                    ...agent.kycVerification,
                    remarks: kycRemarks,
                    verifiedAt: new Date().toISOString(),
                    verifiedBy: admin?._id,
                },
            });
            if (res.data?.status || res.status === 200) {
                const updated: IAgents = res.data?.agent ?? res.data?.data ?? agent;
                setAgent(updated);
                setForm(buildForm(updated));
                toastSuccess("Agent updated successfully.");
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
                <WorksSpaceHeader isButtonVisible={false} subHeading="Agent Management Console" heading="Edit Agent" />
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-7 w-7 animate-spin text-navy/40" />
                        <p className="text-xs text-slate-400 font-medium">Loading agent data…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Agent not found.
            </div>
        );
    }

    const initials = `${agent.firstName} ${agent.lastName}`
        .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <>
            {previewUrl && <ImageModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}

            <div className="w-full flex flex-col gap-5 p-1 text-foreground">
                <WorksSpaceHeader isButtonVisible={false} subHeading="Agent Management Console" heading="Edit Agent" />

                {/* Identity strip */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm px-5 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                        {agent.profileImage
                            ? <img src={agent.profileImage} alt={agent.firstName} className="w-full h-full object-cover" />
                            : initials}
                    </div>
                    <div>
                        <p className="text-[15px] font-semibold text-slate-800 leading-tight">{agent.firstName} {agent.lastName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{agent.email}</p>
                    </div>
                    <span className="ml-auto text-[11px] font-mono text-slate-500 bg-slate-100 rounded px-2 py-0.5">
                        {agent.agentId}
                    </span>
                </div>

                {/* Tabs card */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm">

                    {/* Tab bar */}
                    <div className="flex border-b border-slate-100 overflow-x-auto">
                        {TABS.filter(t => (VALID_TABS as string[]).includes(t.key)).map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as Tab)}
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
                    <div className={["transactions", "balance", "activity"].includes(activeTab) ? "p-4" : "p-6"}>
                        {activeTab === "personal" && <PersonalTab form={form} set={set} agent={agent} />}
                        {activeTab === "contact" && <ContactTab form={form} set={set} />}
                        {activeTab === "account" && <AccountTab form={form} set={set} agent={agent} />}
                        {activeTab === "kyc" && (
                            <KycTab form={form} set={set} kyc={agent.kycVerification} onPreview={setPreviewUrl} />
                        )}
                        {activeTab === "bank" && <BankTab clientId={agent._id} userModel="Agent" />}
                        {activeTab === "wallets" && <WalletsTab clientId={agent._id} userModel="Agent" />}
                        {activeTab === "financial" && <FinancialTab agent={agent} />}
                        {activeTab === "notes" && <NotesTab notes={form.notes} set={set} />}
                        {activeTab === "transactions" && <TransactionHistoryTab clientId={agent._id} userModel="Agent" />}
                        {activeTab === "balance" && <BalanceTab clientId={agent._id} client={agent} userModel="Agent" />}
                        {activeTab === "activity" && <ActivityTab userId={agent._id} userModel="Agent" />}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            <ChevronLeft size={15} />
                            Back to Agents
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
