export type Tab =
    | "personal"
    | "contact"
    | "account"
    | "kyc"
    | "bank"
    | "wallets"
    | "financial"
    | "salary"
    | "notes"
    | "transactions"
    | "balance"
    | "activity";

export interface FormState {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: "male" | "female" | "other";
    phoneNumber: string;
    countryCode: string;
    country: string;
    state: string;
    city: string;
    address: string;
    postalCode: string;
    preferredCurrency: string;
    agentLevel: string;
    commissionTierPolicy: string;
    commissionPercentage: number;
    isCommissionEligible: boolean;
    salaryActivated?: boolean;
    isSalaryEligibleThisMonth?: boolean;
    salesThisMonth?: number;
    kycStatus: "pending" | "under_review" | "approved" | "rejected";
    status: "pending" | "active" | "inactive" | "suspended" | "blocked" | "closed";
    isKycRequired: boolean;
    kycRemarks: string;
    notes: string;
}

export type SetFormField = <K extends keyof FormState>(key: K, value: FormState[K]) => void;
