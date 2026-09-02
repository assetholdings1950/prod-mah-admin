"use client";

import React, { useRef, useState, useEffect } from "react";
import {
    Banknote,
    Bitcoin,
    Check,
    ChevronDown,
    ChevronLeft,
    Clock,
    CreditCard,
    Hash,
    Info,
    Link2,
    Tag,
} from "lucide-react";
import ImageUploader from "@/components/common/ImageUploader";
import RichTextEditor from "@/components/common/RichTextEditor";
import {
    FormState,
    cls,
    slugify,
    TYPE_OPTIONS,
    FIAT_CURRENCIES,
    CRYPTO_CURRENCIES,
    FIAT_NETWORKS,
    CRYPTO_NETWORKS,
    STATUS_OPTIONS,
} from "./types";

// ========================= INNER PRIMITIVES =========================

const Field = ({
    label,
    required,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-1.5">
        <label className={cls.label}>
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
);

const Section = ({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) => (
    <div className="py-6 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-navy/[0.06] flex items-center justify-center text-navy/50">
                {icon}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
        </div>
        {children}
    </div>
);

const PillToggle = ({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string; activeClass?: string }[];
}) => (
    <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={[
                    "text-xs px-3.5 py-2 rounded-lg border transition-all font-medium select-none",
                    value === opt.value
                        ? (opt.activeClass ?? "bg-navy text-white border-navy shadow-sm shadow-navy/20")
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700",
                ].join(" ")}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

// ========================= CUSTOM SELECT =========================

const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string;
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={[
                    cls.input,
                    "flex items-center justify-between cursor-pointer text-left",
                    !selected ? "text-slate-300" : "",
                ].join(" ")}
            >
                <span>{selected ? selected.label : (placeholder ?? "Select…")}</span>
                <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 overflow-hidden max-h-56 overflow-y-auto">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={[
                                "w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors",
                                value === opt.value
                                    ? "bg-navy/[0.06] text-navy font-semibold"
                                    : "text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                        >
                            <span>{opt.label}</span>
                            {value === opt.value && <Check className="h-3 w-3 text-navy flex-shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ========================= PROPS =========================

type Props = {
    form: FormState;
    set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
    slugEdited: boolean;
    setSlugEdited: (v: boolean) => void;
    qrFile: File | null;
    qrPreview: string;
    onQrFile: (f: File | null) => void;
    onQrPreview: (p: string) => void;
    onBack: () => void;
    footerActions: React.ReactNode;
};

// ========================= COMPONENT =========================

const PaymentMethodForm = ({
    form,
    set,
    slugEdited,
    setSlugEdited,
    qrFile,
    qrPreview,
    onQrFile,
    onQrPreview,
    onBack,
    footerActions,
}: Props) => {
    const isCrypto = form.type === "crypto";
    const currencies = isCrypto ? CRYPTO_CURRENCIES : FIAT_CURRENCIES;
    const networks = isCrypto ? CRYPTO_NETWORKS : FIAT_NETWORKS;

    const currencyOptions = [
        ...currencies.map((c) => ({ label: c, value: c })),
        { label: "Other (custom)", value: "OTHER" },
    ];
    const networkOptions = [
        ...networks.map((n) => ({ label: n.toUpperCase(), value: n })),
        { label: "Other", value: "other" },
    ];

    const handleNameChange = (name: string) => {
        set("name", name);
        if (!slugEdited) set("slug", slugify(name));
    };

    const handleTypeChange = (type: string) => {
        set("type", type as FormState["type"]);
        set("currency", type === "crypto" ? "USDT" : "USD");
        set("network", type === "crypto" ? "TRC20" : "bank");
        set("walletAddress", "");
        set("accountDetails", "");
    };

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3">

                {/* ── Main Form ── */}
                <div className="lg:col-span-2 px-6 pt-2 pb-6 border-r border-slate-100">

                    {/* 1. Identity */}
                    <Section icon={<Tag size={14} />} title="Method Identity">
                        <div className="flex flex-col gap-4">
                            <Field label="Display Name" required>
                                <input
                                    type="text"
                                    placeholder="e.g. USD Bank Transfer"
                                    value={form.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className={cls.input}
                                />
                            </Field>

                            <Field label="URL Slug" hint="Auto-generated from name. Edit manually if needed.">
                                <div className="flex items-center">
                                    <span className="flex items-center h-10 px-3 text-xs text-slate-400 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg select-none">
                                        /methods/
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="usd-bank-transfer"
                                        value={form.slug}
                                        onChange={(e) => {
                                            setSlugEdited(true);
                                            set("slug", e.target.value);
                                        }}
                                        className={[cls.input, "rounded-l-none font-mono text-xs"].join(" ")}
                                    />
                                </div>
                            </Field>

                            <Field label="Type" required>
                                <PillToggle
                                    value={form.type}
                                    onChange={handleTypeChange}
                                    options={TYPE_OPTIONS}
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Currency" required>
                                    <CustomSelect
                                        value={form.currency}
                                        onChange={(v) => set("currency", v)}
                                        options={currencyOptions}
                                        placeholder="Select currency"
                                    />
                                    {form.currency === "OTHER" && (
                                        <input
                                            type="text"
                                            placeholder="Enter currency code"
                                            className={[cls.input, "mt-2"].join(" ")}
                                            onChange={(e) => set("currency", e.target.value)}
                                        />
                                    )}
                                </Field>

                                <Field label="Network / Channel" required>
                                    <CustomSelect
                                        value={form.network}
                                        onChange={(v) => set("network", v)}
                                        options={networkOptions}
                                        placeholder="Select network"
                                    />
                                </Field>
                            </div>
                        </div>
                    </Section>

                    {/* 2. Payment Details */}
                    <Section
                        icon={isCrypto ? <Bitcoin size={14} /> : <Banknote size={14} />}
                        title={isCrypto ? "Crypto Details" : "Bank Details"}
                    >
                        {isCrypto ? (
                            <Field label="Wallet Address" required hint="The wallet address clients will send funds to.">
                                <input
                                    type="text"
                                    placeholder="e.g. TJHi3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    value={form.walletAddress}
                                    onChange={(e) => set("walletAddress", e.target.value)}
                                    className={[cls.input, "font-mono text-xs"].join(" ")}
                                />
                            </Field>
                        ) : (
                            <Field label="Account Details" hint="Bank name, account number, routing/SWIFT, beneficiary name, etc.">
                                <textarea
                                    rows={6}
                                    placeholder={"Bank: Chase Bank\nAccount Name: Company Name\nAccount Number: 123456789\nRouting Number: 021000021\nSWIFT: CHASUS33"}
                                    value={form.accountDetails}
                                    onChange={(e) => set("accountDetails", e.target.value)}
                                    className={cls.textarea}
                                />
                            </Field>
                        )}
                    </Section>

                    {/* 3. Instructions */}
                    <Section icon={<Info size={14} />} title="Deposit Instructions">
                        <Field
                            label="Instructions"
                            hint="Step-by-step guide shown to clients when using this method."
                        >
                            <RichTextEditor
                                value={form.instructions}
                                onChange={(v) => set("instructions", v)}
                                placeholder="1. Log in to your bank&#10;2. Send funds to the account details above&#10;3. Upload your payment receipt"
                                minHeight="180px"
                            />
                        </Field>
                    </Section>

                    {/* 4. Processing Time */}
                    <Section icon={<Clock size={14} />} title="Processing">
                        <Field label="Processing Time" hint="Shown to clients as the expected deposit confirmation time.">
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="e.g. 1-3 business days"
                                    value={form.processingTime}
                                    onChange={(e) => set("processingTime", e.target.value)}
                                    className={[cls.input, "pl-9"].join(" ")}
                                />
                            </div>
                        </Field>
                    </Section>
                </div>

                {/* ── Sidebar ── */}
                <div className="px-6 pt-6 pb-6 flex flex-col gap-6">

                    {/* QR Code */}
                    <div className="flex flex-col gap-1.5">
                        <label className={cls.label}>QR Code / Cover Image</label>
                        <ImageUploader
                            image={qrFile}
                            imagePreview={qrPreview}
                            setImage={onQrFile}
                            setImagePreview={onQrPreview}
                        />
                        <p className="text-[11px] text-slate-400">Used as the card cover and QR code for crypto / UPI payments.</p>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Status */}
                    <div className="flex flex-col gap-2">
                        <label className={cls.label}>Status</label>
                        <PillToggle
                            value={form.status}
                            onChange={(v) => set("status", v as FormState["status"])}
                            options={STATUS_OPTIONS}
                        />
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Sort Order */}
                    <Field label="Sort Order" hint="Lower number appears first in client-facing lists.">
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="number"
                                min="0"
                                placeholder="1"
                                value={form.sortOrder}
                                onChange={(e) => set("sortOrder", e.target.value)}
                                className={[cls.input, "pl-9"].join(" ")}
                            />
                        </div>
                    </Field>

                    <div className="h-px bg-slate-100" />

                    {/* Type Info Card */}
                    <div className={[
                        "rounded-xl border p-3.5 flex items-start gap-3",
                        isCrypto ? "bg-violet-50 border-violet-100" : "bg-sky-50 border-sky-100",
                    ].join(" ")}>
                        <div className={[
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            isCrypto ? "bg-violet-100" : "bg-sky-100",
                        ].join(" ")}>
                            {isCrypto
                                ? <Bitcoin className="h-4 w-4 text-violet-600" />
                                : <Banknote className="h-4 w-4 text-sky-600" />}
                        </div>
                        <div>
                            <p className={["text-xs font-bold", isCrypto ? "text-violet-800" : "text-sky-800"].join(" ")}>
                                {isCrypto ? "Crypto Payment" : "Fiat Payment"}
                            </p>
                            <p className={["text-[11px] mt-0.5", isCrypto ? "text-violet-500" : "text-sky-500"].join(" ")}>
                                {isCrypto
                                    ? "Clients send crypto to the wallet address. Ensure the network matches."
                                    : "Clients initiate a bank transfer using the provided account details."}
                            </p>
                        </div>
                    </div>

                    {/* Slug preview */}
                    {form.slug && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                            <Link2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">/methods/{form.slug}</span>
                        </div>
                    )}

                    {/* Placeholder preview when no QR */}
                    {!qrPreview && (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6 bg-slate-50/50">
                            <div className={[
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                isCrypto ? "bg-violet-100" : "bg-sky-100",
                            ].join(" ")}>
                                <CreditCard className={`h-5 w-5 ${isCrypto ? "text-violet-500" : "text-sky-500"}`} />
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium text-center">
                                No cover image set.<br />Upload above to preview.
                            </p>
                        </div>
                    )}
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

export default PaymentMethodForm;
