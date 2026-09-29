export interface TransactionUserRef {
    _id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    clientId?: string;
    agentId?: string;
}

export interface TransactionAdminRef {
    _id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
}

export type TransactionType = "deposit" | "withdrawal" | "investment" | "earning" | "salary" | "penalty" | "charge";
export type TransactionStatus = "pending" | "completed" | "failed";
export type TransactionUserModel = "User" | "Agent" | "Client";

export interface TransactionInterface {
    _id: string;
    // A referenced client/agent/user may have been deleted while its financial
    // transaction record remains for audit history.
    userId?: string | TransactionUserRef | null;
    userModel: TransactionUserModel;
    type: TransactionType;
    amount: number;
    currency: string;
    status: TransactionStatus;
    referenceId?: string | null;
    description?: string;
    createdBy?: string | TransactionAdminRef | null;
    createdAt: string;
    updatedAt: string;
}

export interface TransactionSummary {
    totalCount: number;
    completedCount: number;
    pendingCount: number;
    failedCount: number;
    depositCount: number;
    withdrawalCount: number;
    investmentCount: number;
    earningCount: number;
    completedVolume: number;
    volumeByCurrency: Record<string, { total: number; count: number }>;
}
