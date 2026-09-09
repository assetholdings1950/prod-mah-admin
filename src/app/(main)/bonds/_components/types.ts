import { BondInterface } from "@/interface/bond";

export type BondFormState = {
    name: string; slug: string; shortDescription: string; description: string; currency: "USD";
    minInvestment: string; maxInvestment: string; termValue: string; termUnit: "months" | "years";
    couponRateAnnual: string; couponFrequency: BondInterface["couponFrequency"];
    usdtBenefitEnabled: boolean; usdtBenefitPercent: string; usdtLockType: BondInterface["usdtLockType"];
    usdtLockMonths: string; usdtUnlockMethod: BondInterface["usdtUnlockMethod"]; usdtDescription: string;
    earlyRedemptionAllowed: boolean; minHoldingMonths: string; noticeDays: string; principalPenaltyPercent: string;
    usdtEarlyExitTreatment: BondInterface["usdtEarlyExitTreatment"]; usdtPartialForfeitPercent: string;
    unpaidCouponTreatment: BondInterface["unpaidCouponTreatment"]; paidCouponTreatment: BondInterface["paidCouponTreatment"];
    paidCouponClawbackPercent: string; redemptionFeePercent: string; earlyRedemptionTerms: string;
    riskLevel: BondInterface["riskLevel"]; termsAndConditions: string; riskDisclosure: string; usdtDisclosure: string;
    offeringDocumentUrl: string; termSheetUrl: string; internalNotes: string; status: BondInterface["status"];
    offeringDocumentUploading: boolean; termSheetUploading: boolean;
    featured: boolean; sortOrder: string;
};

export const EMPTY_BOND_FORM: BondFormState = {
    name: "", slug: "", shortDescription: "", description: "", currency: "USD",
    minInvestment: "", maxInvestment: "", termValue: "", termUnit: "years",
    couponRateAnnual: "", couponFrequency: "quarterly",
    usdtBenefitEnabled: true, usdtBenefitPercent: "50", usdtLockType: "same_as_bond", usdtLockMonths: "",
    usdtUnlockMethod: "automatic", usdtDescription: "",
    earlyRedemptionAllowed: true, minHoldingMonths: "0", noticeDays: "0", principalPenaltyPercent: "0",
    usdtEarlyExitTreatment: "full_forfeit", usdtPartialForfeitPercent: "", unpaidCouponTreatment: "forfeit",
    paidCouponTreatment: "no_clawback", paidCouponClawbackPercent: "", redemptionFeePercent: "0",
    earlyRedemptionTerms: "", riskLevel: "medium", termsAndConditions: "", riskDisclosure: "",
    usdtDisclosure: "", offeringDocumentUrl: "", termSheetUrl: "", internalNotes: "",
    offeringDocumentUploading: false, termSheetUploading: false,
    status: "draft", featured: false, sortOrder: "0",
};

export const slugifyBond = (value: string) =>
    value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const optionalNumber = (value: string) => value === "" ? undefined : Number(value);

export const buildBondPayload = (form: BondFormState) => ({
    name: form.name.trim(), slug: form.slug || slugifyBond(form.name),
    shortDescription: form.shortDescription, description: form.description, currency: form.currency,
    minInvestment: Number(form.minInvestment), maxInvestment: optionalNumber(form.maxInvestment),
    termMonths: Number(form.termValue) * (form.termUnit === "years" ? 12 : 1),
    couponRateAnnual: Number(form.couponRateAnnual), couponFrequency: form.couponFrequency,
    usdtBenefitEnabled: form.usdtBenefitEnabled,
    usdtBenefitPercent: form.usdtBenefitEnabled ? Number(form.usdtBenefitPercent) : 0,
    usdtLockType: form.usdtLockType,
    usdtLockMonths: form.usdtLockType === "custom" ? optionalNumber(form.usdtLockMonths) : undefined,
    usdtUnlockMethod: form.usdtUnlockMethod, usdtDescription: form.usdtDescription,
    earlyRedemptionAllowed: form.earlyRedemptionAllowed,
    minHoldingMonths: form.earlyRedemptionAllowed ? Number(form.minHoldingMonths || 0) : 0,
    noticeDays: form.earlyRedemptionAllowed ? Number(form.noticeDays || 0) : 0,
    principalPenaltyPercent: form.earlyRedemptionAllowed ? Number(form.principalPenaltyPercent || 0) : 0,
    usdtEarlyExitTreatment: form.usdtEarlyExitTreatment,
    usdtPartialForfeitPercent: form.usdtEarlyExitTreatment === "partial_forfeit" ? optionalNumber(form.usdtPartialForfeitPercent) : undefined,
    unpaidCouponTreatment: form.unpaidCouponTreatment, paidCouponTreatment: form.paidCouponTreatment,
    paidCouponClawbackPercent: form.paidCouponTreatment === "partial_clawback" ? optionalNumber(form.paidCouponClawbackPercent) : undefined,
    redemptionFeePercent: form.earlyRedemptionAllowed ? Number(form.redemptionFeePercent || 0) : 0,
    earlyRedemptionTerms: form.earlyRedemptionTerms, riskLevel: form.riskLevel,
    termsAndConditions: form.termsAndConditions, riskDisclosure: form.riskDisclosure,
    usdtDisclosure: form.usdtDisclosure, offeringDocumentUrl: form.offeringDocumentUrl.trim(),
    termSheetUrl: form.termSheetUrl.trim(), internalNotes: form.internalNotes, status: form.status,
    featured: form.featured, sortOrder: Number(form.sortOrder || 0),
});

export const validateBondForm = (form: BondFormState) => {
    if (!form.name.trim()) return "Bond name is required.";
    if (!form.slug.trim()) return "Bond slug is required.";
    if (!form.minInvestment || Number(form.minInvestment) <= 0) return "Minimum investment must be greater than zero.";
    if (form.maxInvestment && Number(form.maxInvestment) < Number(form.minInvestment)) return "Maximum investment cannot be below the minimum investment.";
    if (!form.termValue || Number(form.termValue) <= 0) return "Bond term must be greater than zero.";
    if (!form.couponRateAnnual || Number(form.couponRateAnnual) <= 0) return "Annual coupon rate must be greater than zero.";
    if (form.usdtBenefitEnabled && Number(form.usdtBenefitPercent) <= 0) return "USDT benefit must be greater than zero.";
    if (form.usdtBenefitEnabled && form.usdtLockType === "custom" && Number(form.usdtLockMonths) <= 0) return "Enter a valid custom USDT lock period.";
    if (form.earlyRedemptionAllowed && form.usdtEarlyExitTreatment === "partial_forfeit" && Number(form.usdtPartialForfeitPercent) <= 0) return "Enter the USDT forfeiture percentage.";
    if (form.earlyRedemptionAllowed && form.paidCouponTreatment === "partial_clawback" && Number(form.paidCouponClawbackPercent) <= 0) return "Enter the coupon clawback percentage.";
    return null;
};

export const bondToForm = (bond: BondInterface): BondFormState => ({
    ...EMPTY_BOND_FORM,
    name: bond.name || "", slug: bond.slug || "",
    shortDescription: bond.shortDescription || "", description: bond.description || "",
    minInvestment: String(bond.minInvestment ?? ""), maxInvestment: String(bond.maxInvestment ?? ""),
    termValue: String(bond.termMonths % 12 === 0 ? bond.termMonths / 12 : bond.termMonths),
    termUnit: bond.termMonths % 12 === 0 ? "years" : "months",
    couponRateAnnual: String(bond.couponRateAnnual ?? ""), couponFrequency: bond.couponFrequency,
    usdtBenefitEnabled: bond.usdtBenefitEnabled, usdtBenefitPercent: String(bond.usdtBenefitPercent ?? 50),
    usdtLockType: bond.usdtLockType, usdtLockMonths: String(bond.usdtLockMonths ?? ""),
    usdtUnlockMethod: bond.usdtUnlockMethod, usdtDescription: bond.usdtDescription || "",
    earlyRedemptionAllowed: bond.earlyRedemptionAllowed, minHoldingMonths: String(bond.minHoldingMonths ?? 0),
    noticeDays: String(bond.noticeDays ?? 0), principalPenaltyPercent: String(bond.principalPenaltyPercent ?? 0),
    usdtEarlyExitTreatment: bond.usdtEarlyExitTreatment, usdtPartialForfeitPercent: String(bond.usdtPartialForfeitPercent ?? ""),
    unpaidCouponTreatment: bond.unpaidCouponTreatment, paidCouponTreatment: bond.paidCouponTreatment,
    paidCouponClawbackPercent: String(bond.paidCouponClawbackPercent ?? ""), redemptionFeePercent: String(bond.redemptionFeePercent ?? 0),
    earlyRedemptionTerms: bond.earlyRedemptionTerms || "", riskLevel: bond.riskLevel,
    termsAndConditions: bond.termsAndConditions || "", riskDisclosure: bond.riskDisclosure || "",
    usdtDisclosure: bond.usdtDisclosure || "", offeringDocumentUrl: bond.offeringDocumentUrl || "",
    termSheetUrl: bond.termSheetUrl || "", internalNotes: bond.internalNotes || "",
    status: bond.status, featured: bond.featured, sortOrder: String(bond.sortOrder ?? 0),
});
