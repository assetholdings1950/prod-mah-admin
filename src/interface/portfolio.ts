export type PortfolioStatus = "active" | "paused" | "matured" | "closed" | "cancelled";
export type InvestmentMode = "sip" | "lumpsum";
export type PortfolioCategory = "monthly" | "lumpsum" | "crypto";
export type PayoutType = "monthly" | "quarterly" | "maturity";

export interface PortfolioClientRef {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    clientId?: string;
}

export interface PortfolioLot {
    _id: string;
    lotNo: number;
    amountUsd: number;
    paidCurrency: string;
    paidAmount: number;
    rate: number;
    investedAt: string;
    maturityDate: string;
    monthlyInterestUsd: number;
    expectedProfitUsd: number;
    expectedMaturityValueUsd: number;
    status: "active" | "matured" | "closed";
}

export interface PortfolioSummary {
    totalInvestedUsd: number;
    totalExpectedProfitUsd: number;
    totalPaidProfitUsd: number;
    currentValueUsd: number;
    expectedMaturityValueUsd: number;
    totalLots: number;
    activeLots: number;
    maturedLots: number;
}

export interface PortfolioSipMeta {
    monthlyAmountUsd: number | null;
    totalInstallments: number | null;
    paidInstallments: number;
    missedInstallments: number;
    nextDueDate: string | null;
    lastPaidDate: string | null;
}

export interface PortfolioPlanSnapshot {
    name?: string;
    slug?: string;
    category?: PortfolioCategory;
    currency?: string;
    roiType?: "fixed" | "range";
    roiMin?: number;
    roiMax?: number;
    payoutType?: PayoutType;
    riskLevel?: "low" | "medium" | "high" | "very_high";
    lockInMonths?: number | null;
    exitPenaltyPercent?: number;
}

export interface PortfolioInterface {
    _id: string;
    clientId: string | PortfolioClientRef;
    portfolioId: string;
    planId: string | { _id: string; name: string; slug: string };
    planSnapshot: PortfolioPlanSnapshot;
    investmentMode: InvestmentMode;
    amountUsd: number;
    durationMonths: number;
    paidFromWallet: {
        currency: string;
        amount: number;
        rate: number;
    };
    sip: PortfolioSipMeta;
    lots?: PortfolioLot[];
    summary: PortfolioSummary;
    startedAt: string | null;
    maturityDate: string | null;
    lockInEndDate: string | null;
    closedAt: string | null;
    status: PortfolioStatus;
    createdAt: string;
    updatedAt: string;
}

export interface PortfolioPayoutAdminSummary {
    totalPortfolios: number;
    activeCount: number;
    maturedCount: number;
    totalInvestedUsd: number;
    totalExpectedProfitUsd: number;
    totalPaidProfitUsd: number;
    pendingProfitUsd: number;
    totalCurrentValueUsd: number;
    sipCount: number;
    lumpsumCount: number;
    monthlyPayoutCount: number;
    maturityPayoutCount: number;
    thisMonthPayoutCount: number;
    thisMonthPaidUsd: number;
}
