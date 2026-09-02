"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
    AlertTriangle,
    ChevronLeft,
    Clock,
    DollarSign,
    FileText,
    ShieldCheck,
    Star,
    Tag,
    TrendingUp,
} from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";
import Field from "./Field";
import Section from "./Section";
import PillToggle from "./PillToggle";
import CoverPhotoUpload from "./CoverPhotoUpload";
import {
    FormState,
    ChargeRow,
    cls,
    slugify,
    CATEGORY_OPTIONS,
    ROI_TYPE_OPTIONS,
    PAYOUT_OPTIONS,
    RISK_OPTIONS,
    STATUS_OPTIONS,
} from "./types";

const ChargesSection = dynamic(() => import("./ChargesSection"), { ssr: false });

type Props = {
    form: FormState;
    set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
    slugEdited: boolean;
    setSlugEdited: (v: boolean) => void;
    photoFile: File | null;
    photoPreview: string;
    onPhotoFile: (f: File) => void;
    onPhotoRemove: () => void;
    onBack: () => void;
    footerActions: React.ReactNode;
    charges: ChargeRow[];
    onChargesChange: (charges: ChargeRow[]) => void;
};

const InvestmentPlanForm = ({
    form,
    set,
    slugEdited,
    setSlugEdited,
    photoFile,
    photoPreview,
    onPhotoFile,
    onPhotoRemove,
    onBack,
    footerActions,
    charges,
    onChargesChange,
}: Props) => {
    const handleNameChange = (name: string) => {
        set("name", name);
        if (!slugEdited) set("slug", slugify(name));
    };

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3">

                {/* ── Main Form ── */}
                <div className="lg:col-span-2 px-6 pt-2 pb-6 border-r border-slate-100">

                    <Section icon={<Tag size={14} />} title="Plan Identity">
                        <div className="flex flex-col gap-4">
                            <Field label="Plan Name" required>
                                <input
                                    type="text"
                                    placeholder="e.g. Large Income Fund"
                                    value={form.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className={cls.input}
                                />
                            </Field>
                            <Field label="URL Slug" hint="Auto-generated from name. Edit manually if needed.">
                                <div className="flex items-center gap-0">
                                    <span className="flex items-center h-10 px-3 text-xs text-slate-400 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg select-none">
                                        /plans/
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="plan-slug"
                                        value={form.slug}
                                        onChange={(e) => {
                                            setSlugEdited(true);
                                            set("slug", e.target.value);
                                        }}
                                        className={[cls.input, "rounded-l-none font-mono text-xs"].join(" ")}
                                    />
                                </div>
                            </Field>
                            <Field label="Category" required>
                                <PillToggle
                                    value={form.category}
                                    onChange={(v) => set("category", v as FormState["category"])}
                                    options={CATEGORY_OPTIONS}
                                />
                            </Field>
                        </div>
                    </Section>

                    <Section icon={<FileText size={14} />} title="Description">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-1.5">
                                <RichTextEditor
                                    label="Short Description"
                                    value={form.shortDescription}
                                    onChange={(v) => set("shortDescription", v)}
                                    placeholder="Brief one-liner describing the plan…"
                                    minHeight="120px"
                                />
                                <p className="text-[11px] text-slate-400">Shown as a tagline on plan cards.</p>
                            </div>
                            <RichTextEditor
                                label="Full Description"
                                value={form.description}
                                onChange={(v) => set("description", v)}
                                placeholder="Detailed explanation of the plan, strategy, and expected outcomes…"
                                minHeight="180px"
                            />
                        </div>
                    </Section>

                    <Section icon={<DollarSign size={14} />} title="Investment Range">
                        {form.category === "crypto" ? (
                            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-blue-50 border border-blue-100">
                                <DollarSign size={14} className="text-blue-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-blue-600">
                                    No minimum or maximum limit for Crypto plans. Clients can invest any amount.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Minimum Amount (USD)" required>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="100"
                                            value={form.minAmount}
                                            onChange={(e) => set("minAmount", e.target.value)}
                                            className={[cls.input, "pl-6"].join(" ")}
                                        />
                                    </div>
                                </Field>
                                <Field label="Maximum Amount (USD)" required>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="1000"
                                            value={form.maxAmount}
                                            onChange={(e) => set("maxAmount", e.target.value)}
                                            className={[cls.input, "pl-6"].join(" ")}
                                        />
                                    </div>
                                </Field>
                            </div>
                        )}
                    </Section>

                    <Section icon={<TrendingUp size={14} />} title="Returns (ROI)">
                        <div className="flex flex-col gap-4">
                            <Field label="ROI Type">
                                <PillToggle
                                    value={form.roiType}
                                    onChange={(v) => set("roiType", v as FormState["roiType"])}
                                    options={ROI_TYPE_OPTIONS}
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label={form.roiType === "range" ? "ROI Min (%)" : "ROI Rate (%)"} required>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            placeholder="12"
                                            value={form.roiMin}
                                            onChange={(e) => set("roiMin", e.target.value)}
                                            className={[cls.input, "pr-10"].join(" ")}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">% p.a.</span>
                                    </div>
                                </Field>
                                {form.roiType === "range" && (
                                    <Field label="ROI Max (%)" required>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                placeholder="25"
                                                value={form.roiMax}
                                                onChange={(e) => set("roiMax", e.target.value)}
                                                className={[cls.input, "pr-10"].join(" ")}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">% p.a.</span>
                                        </div>
                                    </Field>
                                )}
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Clock size={14} />} title="Payout & Duration">
                        <div className="flex flex-col gap-4">
                            <Field label="Payout Frequency">
                                <PillToggle
                                    value={form.payoutType}
                                    onChange={(v) => set("payoutType", v as FormState["payoutType"])}
                                    options={PAYOUT_OPTIONS}
                                />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Minimum Duration" required>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="12"
                                            value={form.durationMinMonths}
                                            onChange={(e) => set("durationMinMonths", e.target.value)}
                                            className={[cls.input, "pr-16"].join(" ")}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">months</span>
                                    </div>
                                </Field>
                                <Field label="Maximum Duration" required>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="60"
                                            value={form.durationMaxMonths}
                                            onChange={(e) => set("durationMaxMonths", e.target.value)}
                                            className={[cls.input, "pr-16"].join(" ")}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">months</span>
                                    </div>
                                </Field>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<ShieldCheck size={14} />} title="Lock-in & Exit Protection">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Lock-in Period" hint="Leave empty if no lock-in applies.">
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="12"
                                        value={form.lockInMonths}
                                        onChange={(e) => set("lockInMonths", e.target.value)}
                                        className={[cls.input, "pr-16"].join(" ")}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">months</span>
                                </div>
                            </Field>
                            <Field label="Early Exit Penalty" hint="Charged on full amount if exiting before maturity.">
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="30"
                                        value={form.exitPenaltyPercent}
                                        onChange={(e) => set("exitPenaltyPercent", e.target.value)}
                                        className={[cls.input, "pr-7"].join(" ")}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>
                                </div>
                            </Field>
                        </div>
                    </Section>

                    <ChargesSection charges={charges} onChange={onChargesChange} />

                    <Section icon={<AlertTriangle size={14} />} title="Terms & Conditions">
                        <RichTextEditor
                            label="Terms & Conditions"
                            value={form.termsAndConditions}
                            onChange={(v) => set("termsAndConditions", v)}
                            placeholder="Enter any specific terms, conditions, or important notices for this plan…"
                            minHeight="160px"
                        />
                    </Section>
                </div>

                {/* ── Sidebar ── */}
                <div className="px-6 pt-6 pb-6 flex flex-col gap-7">
                    <CoverPhotoUpload
                        file={photoFile}
                        preview={photoPreview}
                        onFile={onPhotoFile}
                        onRemove={onPhotoRemove}
                    />

                    <div className="h-px bg-slate-100" />

                    <div className="flex flex-col gap-2">
                        <label className={cls.label}>Risk Level</label>
                        <PillToggle
                            value={form.riskLevel}
                            onChange={(v) => set("riskLevel", v as FormState["riskLevel"])}
                            options={RISK_OPTIONS}
                        />
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="flex flex-col gap-2">
                        <label className={cls.label}>Status</label>
                        <PillToggle
                            value={form.status}
                            onChange={(v) => set("status", v as FormState["status"])}
                            options={STATUS_OPTIONS}
                        />
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="flex flex-col gap-4">
                        <button
                            type="button"
                            onClick={() => set("featured", !form.featured)}
                            className={[
                                "flex items-center gap-3 p-3.5 rounded-xl border transition-all",
                                form.featured
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-slate-50 border-slate-200 hover:border-slate-300",
                            ].join(" ")}
                        >
                            <div
                                className={[
                                    "relative rounded-full transition-colors shrink-0",
                                    form.featured ? "bg-amber-400" : "bg-slate-300",
                                ].join(" ")}
                                style={{ width: 38, height: 21 }}
                            >
                                <span
                                    className={[
                                        "absolute top-0.5 left-0.5 w-[17px] h-[17px] rounded-full bg-white shadow transition-transform",
                                        form.featured ? "translate-x-[17px]" : "translate-x-0",
                                    ].join(" ")}
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <Star
                                        size={12}
                                        className={form.featured ? "text-amber-500 fill-amber-400" : "text-slate-400"}
                                    />
                                    <p className="text-xs font-semibold text-slate-700">Featured Plan</p>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">Highlight on the plans listing page</p>
                            </div>
                        </button>

                        <Field label="Sort Order" hint="Lower number appears first.">
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={form.sortOrder}
                                onChange={(e) => set("sortOrder", e.target.value)}
                                className={cls.input}
                            />
                        </Field>
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ChevronLeft size={15} />
                    Back
                </button>
                {footerActions}
            </div>
        </div>
    );
};

export default InvestmentPlanForm;
