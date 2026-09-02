export type Tab =
    | "personal"
    | "contact"
    | "account"
    | "account-manager"
    | "kyc"
    | "bank"
    | "wallets"
    | "financial"
    | "notes"
    | "transactions"
    | "balance"
    | "portfolio"
    | "activity"
    | "account-form";

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
    riskProfile: "conservative" | "moderate" | "aggressive";
    kycStatus: "pending" | "under_review" | "approved" | "rejected";
    status: "pending" | "active" | "inactive" | "suspended" | "blocked" | "closed";
    isKycRequired: boolean;
    kycRemarks: string;
    notes: string;
}

export type SetFormField = <K extends keyof FormState>(key: K, value: FormState[K]) => void;
