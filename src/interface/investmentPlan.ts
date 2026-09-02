export interface InvestmentPlanInterface {
    _id?: string;

    // BASIC
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    photourl?: string;

    // CATEGORY
    category: "monthly" | "lumpsum" | "crypto";

    // INVESTMENT RANGE
    minAmount: number;
    maxAmount: number;
    currency: "USD";

    // ROI
    roiType: "fixed" | "range";
    roiMin: number;
    roiMax?: number;
    roiPeriod: "annum";

    // PAYOUT
    payoutType: "monthly" | "quarterly" | "maturity";

    // DURATION
    durationMinMonths: number;
    durationMaxMonths: number;

    // LOCKING
    lockInMonths?: number;
    exitPenaltyPercent?: number;

    // RISK
    riskLevel: "low" | "medium" | "high" | "very_high";

    // TERMS
    termsAndConditions?: string;

    // STATUS
    status: "draft" | "active" | "inactive";

    // DISPLAY
    featured?: boolean;
    sortOrder?: number;

    // META
    createdBy?: string;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
