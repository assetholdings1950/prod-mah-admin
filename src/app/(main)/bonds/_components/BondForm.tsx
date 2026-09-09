"use client";

import React from "react";
import {
    ArrowLeft, Banknote, CalendarClock, Coins, FileText, Percent,
    ShieldCheck, Tag,
} from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";
import Select from "@/components/common/Select";
import BondDocumentUpload from "./BondDocumentUpload";
import { BondFormState, slugifyBond } from "./types";

type Props = {
    form: BondFormState;
    set: <K extends keyof BondFormState>(key: K, value: BondFormState[K]) => void;
    slugEdited: boolean;
    setSlugEdited: (value: boolean) => void;
    onBack: () => void;
    footerActions: React.ReactNode;
};

const inputClass = "w-full h-[42px] text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 outline-none focus:border-navy/40 focus:ring-2 focus:ring-navy/[0.08] transition-all placeholder:text-slate-300";

const Field = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
);

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <section className="py-6 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-navy/[0.06] flex items-center justify-center text-navy/50">{icon}</div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
        </div>
        {children}
    </section>
);

const Toggle = ({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description?: string }) => (
    <button type="button" onClick={() => onChange(!checked)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${checked ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
        <span className={`relative w-[38px] h-[21px] rounded-full shrink-0 transition-colors ${checked ? "bg-emerald-500" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 left-0.5 w-[17px] h-[17px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[17px]" : ""}`} />
        </span>
        <span>
            <span className="block text-xs font-bold text-navy">{label}</span>
            {description && <span className="block text-[11px] text-slate-400 mt-0.5">{description}</span>}
        </span>
    </button>
);

const percentInput = (value: string, onChange: (value: string) => void) => (
    <div className="relative">
        <input type="number" min="0" max="100" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} pr-8`} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
    </div>
);

export default function BondForm({ form, set, slugEdited, setSlugEdited, onBack, footerActions }: Props) {
    const onName = (name: string) => {
        set("name", name);
        if (!slugEdited) set("slug", slugifyBond(name));
    };

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 px-6 border-r border-slate-100">
                    <Section icon={<Tag size={14} />} title="Bond Identity">
                        <div className="grid grid-cols-1 gap-4">
                            <Field label="Bond Name" required>
                                <input value={form.name} onChange={(e) => onName(e.target.value)} placeholder="Merlion Premium Bond" className={inputClass} />
                            </Field>
                            <div>
                                <Field label="URL Slug" required>
                                    <div className="flex">
                                        <span className="h-[42px] flex items-center px-3 text-xs text-slate-400 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg">/bonds/</span>
                                        <input value={form.slug} onChange={(e) => { setSlugEdited(true); set("slug", slugifyBond(e.target.value)); }} className={`${inputClass} rounded-l-none font-mono text-xs`} />
                                    </div>
                                </Field>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<FileText size={14} />} title="Description">
                        <div className="space-y-5">
                            <RichTextEditor label="Short Description" value={form.shortDescription} onChange={(value) => set("shortDescription", value)} placeholder="Short summary shown on bond cards…" minHeight="100px" />
                            <RichTextEditor label="Full Description" value={form.description} onChange={(value) => set("description", value)} placeholder="Explain the bond, its purpose, and investor proposition…" minHeight="170px" />
                        </div>
                    </Section>

                    <Section icon={<Banknote size={14} />} title="Investment & Term">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="Minimum Investment" required>
                                <input type="number" min="0" value={form.minInvestment} onChange={(e) => set("minInvestment", e.target.value)} placeholder="Enter minimum investment value" className={inputClass} />
                            </Field>
                            <Field label="Maximum Investment" hint="Optional">
                                <input type="number" min="0" value={form.maxInvestment} onChange={(e) => set("maxInvestment", e.target.value)} className={inputClass} />
                            </Field>
                            <Field label="Term" required>
                                <input type="number" min="1" value={form.termValue} onChange={(e) => set("termValue", e.target.value)} placeholder="5" className={inputClass} />
                            </Field>
                            <Field label="Term Unit">
                                <Select fullWidth value={form.termUnit} onChange={(value) => set("termUnit", value as BondFormState["termUnit"])} options={[{ value: "years", label: "Years" }, { value: "months", label: "Months" }]} />
                            </Field>
                            <Field label="Currency">
                                <input value="USD" disabled className={`${inputClass} opacity-70`} />
                            </Field>
                        </div>
                    </Section>

                    <Section icon={<Percent size={14} />} title="Coupon">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Annual Coupon Rate" required>{percentInput(form.couponRateAnnual, (value) => set("couponRateAnnual", value))}</Field>
                            <Field label="Coupon Frequency">
                                <Select fullWidth value={form.couponFrequency} onChange={(value) => set("couponFrequency", value as BondFormState["couponFrequency"])} options={[
                                    { value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" },
                                    { value: "semiannual", label: "Semi-annually" }, { value: "annual", label: "Annually" },
                                    { value: "maturity", label: "At Maturity" },
                                ]} />
                            </Field>
                        </div>
                        <div className="mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                            Coupon accrues from each client’s bond activation date. The first full coupon is due after one complete payout period.
                        </div>
                    </Section>

                    <Section icon={<Coins size={14} />} title="USDT Benefit">
                        <div className="space-y-4">
                            <Toggle checked={form.usdtBenefitEnabled} onChange={(value) => set("usdtBenefitEnabled", value)} label="Enable USDT benefit" description="Calculated from the client’s original bond principal." />
                            {form.usdtBenefitEnabled && <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="USDT Benefit" required>{percentInput(form.usdtBenefitPercent, (value) => set("usdtBenefitPercent", value))}</Field>
                                    <Field label="Lock Period">
                                        <Select fullWidth value={form.usdtLockType} onChange={(value) => set("usdtLockType", value as BondFormState["usdtLockType"])} options={[{ value: "same_as_bond", label: "Same as Bond Term" }, { value: "custom", label: "Custom Lock Period" }]} />
                                    </Field>
                                    {form.usdtLockType === "custom" && <Field label="Custom Lock Period" required>
                                        <div className="relative"><input type="number" min="1" value={form.usdtLockMonths} onChange={(e) => set("usdtLockMonths", e.target.value)} className={`${inputClass} pr-16`} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">months</span></div>
                                    </Field>}
                                    <Field label="Unlock Method">
                                        <Select fullWidth value={form.usdtUnlockMethod} onChange={(value) => set("usdtUnlockMethod", value as BondFormState["usdtUnlockMethod"])} options={[{ value: "automatic", label: "Eligible Automatically at Maturity" }, { value: "admin_approval", label: "Requires Admin Approval" }]} />
                                    </Field>
                                </div>
                                <RichTextEditor label="USDT Benefit Description" value={form.usdtDescription} onChange={(value) => set("usdtDescription", value)} minHeight="120px" />
                            </>}
                        </div>
                    </Section>

                    <Section icon={<CalendarClock size={14} />} title="Early Redemption">
                        <div className="space-y-4">
                            <Toggle checked={form.earlyRedemptionAllowed} onChange={(value) => set("earlyRedemptionAllowed", value)} label="Allow early redemption" />
                            {form.earlyRedemptionAllowed && <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Field label="Minimum Holding"><input type="number" min="0" value={form.minHoldingMonths} onChange={(e) => set("minHoldingMonths", e.target.value)} className={inputClass} /></Field>
                                    <Field label="Notice Period (Days)"><input type="number" min="0" value={form.noticeDays} onChange={(e) => set("noticeDays", e.target.value)} className={inputClass} /></Field>
                                    <Field label="Principal Penalty">{percentInput(form.principalPenaltyPercent, (value) => set("principalPenaltyPercent", value))}</Field>
                                    <Field label="USDT Treatment">
                                        <Select fullWidth value={form.usdtEarlyExitTreatment} onChange={(value) => set("usdtEarlyExitTreatment", value as BondFormState["usdtEarlyExitTreatment"])} options={[{ value: "full_forfeit", label: "Full Benefit Forfeited" }, { value: "partial_forfeit", label: "Partial Benefit Forfeited" }, { value: "retain", label: "Benefit Retained" }, { value: "admin_review", label: "Admin Review" }]} />
                                    </Field>
                                    {form.usdtEarlyExitTreatment === "partial_forfeit" && <Field label="USDT Forfeiture">{percentInput(form.usdtPartialForfeitPercent, (value) => set("usdtPartialForfeitPercent", value))}</Field>}
                                    <Field label="Unpaid Coupon">
                                        <Select fullWidth value={form.unpaidCouponTreatment} onChange={(value) => set("unpaidCouponTreatment", value as BondFormState["unpaidCouponTreatment"])} options={[{ value: "forfeit", label: "Forfeit" }, { value: "pay_accrued", label: "Pay Accrued Amount" }, { value: "admin_review", label: "Admin Review" }]} />
                                    </Field>
                                    <Field label="Previously Paid Coupon">
                                        <Select fullWidth value={form.paidCouponTreatment} onChange={(value) => set("paidCouponTreatment", value as BondFormState["paidCouponTreatment"])} options={[{ value: "no_clawback", label: "No Clawback" }, { value: "full_clawback", label: "Full Clawback" }, { value: "partial_clawback", label: "Partial Clawback" }]} />
                                    </Field>
                                    {form.paidCouponTreatment === "partial_clawback" && <Field label="Coupon Clawback">{percentInput(form.paidCouponClawbackPercent, (value) => set("paidCouponClawbackPercent", value))}</Field>}
                                    <Field label="Additional Redemption Fee">{percentInput(form.redemptionFeePercent, (value) => set("redemptionFeePercent", value))}</Field>
                                </div>
                                <RichTextEditor label="Early Redemption Terms" value={form.earlyRedemptionTerms} onChange={(value) => set("earlyRedemptionTerms", value)} minHeight="130px" />
                            </>}
                        </div>
                    </Section>

                    <Section icon={<ShieldCheck size={14} />} title="Terms & Disclosures">
                        <div className="space-y-5">
                            <RichTextEditor label="Terms & Conditions" value={form.termsAndConditions} onChange={(value) => set("termsAndConditions", value)} minHeight="150px" />
                            <RichTextEditor label="Risk Disclosure" value={form.riskDisclosure} onChange={(value) => set("riskDisclosure", value)} minHeight="120px" />
                            <RichTextEditor label="USDT Disclosure" value={form.usdtDisclosure} onChange={(value) => set("usdtDisclosure", value)} minHeight="120px" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <BondDocumentUpload
                                    label="Offering Document"
                                    value={form.offeringDocumentUrl}
                                    documentKey="offering-document"
                                    bondSlug={form.slug}
                                    uploading={form.offeringDocumentUploading}
                                    onUploadingChange={(value) => set("offeringDocumentUploading", value)}
                                    onChange={(value) => set("offeringDocumentUrl", value)}
                                />
                                <BondDocumentUpload
                                    label="Term Sheet"
                                    value={form.termSheetUrl}
                                    documentKey="term-sheet"
                                    bondSlug={form.slug}
                                    uploading={form.termSheetUploading}
                                    onUploadingChange={(value) => set("termSheetUploading", value)}
                                    onChange={(value) => set("termSheetUrl", value)}
                                />
                            </div>
                        </div>
                    </Section>
                </div>

                <aside className="px-6 py-6 flex flex-col gap-6">
                    <div className="rounded-2xl bg-gradient-to-br from-navy to-blue-900 p-5 text-white">
                        <Coins className="h-6 w-6 text-cyan-300 mb-4" />
                        <p className="text-[10px] uppercase tracking-widest text-white/55 font-bold">USDT Benefit Preview</p>
                        <p className="text-3xl font-extrabold mt-1">{form.usdtBenefitEnabled ? `${form.usdtBenefitPercent || 0}%` : "Off"}</p>
                        <p className="text-xs text-white/55 mt-2">of original bond principal, locked according to the selected terms.</p>
                    </div>

                    <Field label="Risk Level">
                        <Select fullWidth value={form.riskLevel} onChange={(value) => set("riskLevel", value as BondFormState["riskLevel"])} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "very_high", label: "Very High" }]} />
                    </Field>
                    <Field label="Status">
                        <Select fullWidth value={form.status} onChange={(value) => set("status", value as BondFormState["status"])} options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "matured", label: "Matured" }, { value: "archived", label: "Archived" }]} />
                    </Field>
                    <Toggle checked={form.featured} onChange={(value) => set("featured", value)} label="Featured bond" description="Show this bond prominently in customer-facing lists." />
                    <Field label="Sort Order"><input type="number" min="0" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className={inputClass} /></Field>
                    <Field label="Internal Notes"><textarea value={form.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} rows={6} className={`${inputClass} h-auto py-3 resize-y`} placeholder="Visible to administrators only…" /></Field>
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-700">
                        Existing client subscriptions must retain a snapshot of these terms when subscription functionality is added.
                    </div>
                </aside>
            </div>

            <footer className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                <button type="button" onClick={onBack} className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-navy px-4 py-2.5 rounded-xl">
                    <ArrowLeft size={14} /> Back
                </button>
                <div className="flex justify-end gap-3">{footerActions}</div>
            </footer>
        </div>
    );
}
