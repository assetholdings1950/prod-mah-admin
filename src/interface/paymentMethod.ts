export interface PaymentMethodInterface {
    _id?: string;
    name: string;
    slug: string;
    type: "fiat" | "crypto";
    currency: string;
    network: string;
    walletAddress?: string;
    accountDetails?: string;
    qrCodeUrl?: string;
    instructions?: string;
    processingTime: string;
    status: "active" | "inactive";
    sortOrder: number;
    createdBy?: {
        _id: string;
        email: string;
        fullName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        role: string[];
        status: string;
        createdAt: string;
    };
    updatedBy?: object | null;
    createdAt?: string;
    updatedAt?: string;
}
