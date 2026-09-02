export interface WithdrawalUserRef {
    _id: string;
    email?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    clientId?: string;
    agentId?: string;
    profileImage?: string;
}

export interface WithdrawalBankDetailRef {
    _id: string;
    bankName?: string | null;
    branchName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    swiftCode?: string | null;
    isPrimary?: boolean;
}

export interface WithdrawalWalletDetailRef {
    _id: string;
    network?: string | null;
    walletAddress?: string | null;
    label?: string | null;
    isPrimary?: boolean;
}

export interface WithdrawalAdminRef {
    _id: string;
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
}

export interface WithdrawalRequestInterface {
    _id?: string;
    userId: WithdrawalUserRef | string;
    userModel: "User" | "Agent" | "Client";
    amount: number;
    currency: string;
    withdrawalMethod: "bank" | "wallet";
    bankDetailId?: WithdrawalBankDetailRef | null;
    walletId?: WithdrawalWalletDetailRef | null;
    note?: string;
    status: "pending" | "approved" | "rejected";
    adminNote?: string;
    approvedBy?: WithdrawalAdminRef | null;
    approvedAt?: string;
    rejectedBy?: WithdrawalAdminRef | null;
    rejectedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
