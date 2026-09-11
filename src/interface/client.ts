import { UserInterface } from "./user"

export interface IBankDetail {
    _id: string;
    userId: string;
    userModel: "Client" | "Agent" | "User";
    bankName: string | null;
    branchName: string | null;
    accountName: string | null;
    accountNumber: string | null;
    ifscCode: string | null;
    swiftCode: string | null;
    isPrimary: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IWalletDetail {
    _id: string;
    userId: string;
    userModel: "Client" | "Agent" | "User";
    network: string | null;
    walletAddress: string | null;
    label: string | null;
    isPrimary: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IWithdrawalRequest {
    _id: string;
    userId: string | { _id: string; fullName: string; firstName: string; lastName: string; email: string; clientId?: string; agentId?: string };
    userModel: "Client" | "Agent" | "User";
    amount: number;
    currency: string;
    withdrawalMethod: "bank" | "wallet";
    bankDetailId?: string | IBankDetail | null;
    walletId?: string | IWalletDetail | null;
    status: "pending" | "approved" | "rejected";
    note?: string | null;
    adminNote?: string | null;
    approvedBy?: string | UserInterface | null;
    approvedAt?: string | null;
    rejectedBy?: string | UserInterface | null;
    rejectedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface IClients {
    _id: string,
    email: string,
    passwordHash: string,
    refreshToken: string | null,
    isVerified: boolean,
    clientId: string,
    agent: UserInterface,
    accountManager: {
        _id: string;
        agentId: string;
        fullName: string | null;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string | null;
        profileImage: string | null;
        agentLevel: "basic" | "silver" | "gold" | "diamond";
        status: string;
        kycStatus: string;
    } | null,
    accountManagerAssignedAt?: string | null,
    accountManagerAssignedBy?: UserInterface | null,
    referralCode: string,
    fullName: string | null,
    firstName: string,
    lastName: string,
    dateOfBirth: string | null,
    gender: "male" | "female" | "other",
    profileImage: string | null,
    phoneNumber: string | null,
    country: string | null,
    countryCode: string | null,
    state: string | null,
    city: string | null,
    address: string | null,
    postalCode: string | null,
    preferredCurrency: string | "USD",
    riskProfile: "conservative" | "moderate" | "aggressive",
    kycStatus: "pending" | "under_review" | "approved" | "rejected",
    kycVerification: {
        liveSelfie: string,
        selfDeclarationVideo: string,
        governmentIdType: string | null | "passport" | "national_id" | "driving_license" | "voter_id" | "aadhaar" | "pan" | "other",
        governmentIdNumber: string | null,
        governmentIdFront: string | null,
        governmentIdBack: string | null,
        remarks: string | null,
        submittedAt: string | null,
        verifiedAt: string | null,
        verifiedBy: UserInterface
    },
    bankDetails: IBankDetail[],
    wallets: IWalletDetail[],
    totalInvestments: number | 0,
    activeInvestments: number | 0,
    completedInvestments: number | 0,
    totalInvestedAmount: number | 0,
    activeInvestmentAmount: number | 0,
    portfolioValue: number | 0,
    totalProfitEarned: number | 0,
    totalInterestEarned: number | 0,
    totalDeposits: number | 0,
    totalWithdrawals: number | 0,
    availableBalance: number | 0,
    isKycRequired: boolean,
    isProfileCompleted: boolean,
    currentPassword?: string | null,
    notes: string | null,
    createdBy: UserInterface,
    updatedBy: UserInterface,
    status: "pending" | "active" | "inactive" | "suspended" | "blocked" | "closed",
    createdAt: string,
    updatedAt: string,
    referredBy?: {
        _id: string;
        name: string;
        email: string;
        type: "Agent" | "Client";
        code: string;
    } | null;
    referredClients?: string[];
    totalClients?: number;
}
