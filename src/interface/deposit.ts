export interface DepositUserRef {
    _id: string;
    email?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    clientId?: string;
    agentId?: string;
    profileImage?: string;
}

export interface DepositPaymentMethodRef {
    _id: string;
    name: string;
    type: "fiat" | "crypto";
    currency: string;
    network: string;
    qrCodeUrl?: string;
}

export interface DepositAdminRef {
    _id: string;
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
}

export interface DepositRequestInterface {
    _id?: string;
    userId: DepositUserRef | string;
    userModel: "User" | "Agent" | "Client";
    paymentMethodId: DepositPaymentMethodRef | string;
    amount: number;
    currency: string;
    network?: string;
    transactionHash?: string;
    senderWalletAddress?: string;
    paymentProofUrl?: string;
    note?: string;
    status: "pending" | "approved" | "rejected";
    adminNote?: string;
    approvedBy?: DepositAdminRef | null;
    approvedAt?: string;
    rejectedBy?: DepositAdminRef | null;
    rejectedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
