type ApiEndPoints = {
    auth: {
        signin: string,
        refresh: string,
        logout: string,
        createUser: string,
        getUser: (search: string, page: string, limit: string, status: string | boolean, roleId: string[]) => string,
        update: string,
        delete: (ids: string[]) => string,
        resetPassword: string
    },
    category: {
        createCategory: string,
        getCategoryList: (page: string, limit: string, search: string) => string,
        delete: (ids: string[]) => string,
        update: string
    },
    brand: {
        createBrand: string,
        getBrandList: (page: string, limit: string, search: string) => string,
        delete: (ids: string[]) => string,
        update: string
    },
    clients: {
        getClientList: (page: string, limit: string, search: string, status?: string, kycStatus?: string, riskProfile?: string, country?: string, preferredCurrency?: string) => string,
        getById: (id: string) => string,
        delete: (ids: string[]) => string,
        update: string,
        bankDetails: {
            getList: (clientId: string) => string,
            add: string,
            update: string,
            delete: (id: string) => string,
        },
        wallets: {
            getList: (clientId: string) => string,
            add: string,
            update: string,
            delete: (id: string) => string,
        },
    },
    agents: {
        create: string,
        getAgentList: (page: string, limit: string, search: string, status?: string, kycStatus?: string, agentLevel?: string, country?: string, preferredCurrency?: string) => string,
        getById: (id: string) => string,
        delete: (ids: string[]) => string,
        update: string,
        approveKyc: string,
        bankDetails: {
            getList: (agentId: string) => string,
            add: string,
            update: string,
            delete: (id: string) => string,
        },
        wallets: {
            getList: (agentId: string) => string,
            add: string,
            update: string,
            delete: (id: string) => string,
        },
    },
    investmentPlans: {
        create: string;
        getList: (page: string, limit: string, search: string, category?: string, status?: string, riskLevel?: string) => string;
        getById: (id: string) => string;
        delete: (ids: string[]) => string;
        update: string;
    },
    planCharges: {
        getByPlanId: (planId: string) => string;
        upsert: string;
    },
    paymentMethods: {
        create: string;
        getList: (page: string, limit: string, search: string, type?: string, status?: string) => string;
        getById: (id: string) => string;
        update: string;
        toggleStatus: (id: string) => string;
        delete: (ids: string[]) => string;
    };
    deposits: {
        summary: string;
        getList: (page: string, limit: string, search: string, status?: string, userModel?: string) => string;
        getById: (id: string) => string;
        approve: (id: string) => string;
        reject: (id: string) => string;
        bulkApprove: string;
        bulkReject: string;
        delete: string;
        deleteAll: string;
    };
    withdrawals: {
        summary: string;
        getList: (page: string, limit: string, search: string, status?: string, userModel?: string, userId?: string) => string;
        getById: (id: string) => string;
        create: string;
        approve: (id: string) => string;
        reject: (id: string) => string;
        bulkApprove: string;
        bulkReject: string;
        delete: string;
        deleteAll: string;
    };
    transactions: {
        summary: string;
        getList: (page: string, limit: string, search: string, type?: string, status?: string, userModel?: string, startDate?: string, endDate?: string, sortBy?: string, sortOrder?: string, userId?: string) => string;
        userWallet: (userId: string, userModel: string) => string;
        fundBalances: (userId: string, userModel: string) => string;
        deleteAll: string;
    };
    cloudionary: {
        adminUpload: string,
    },
    dashboard: {
        summary: string;
    };
    portfolios: {
        adminList: (page: string, limit: string, search: string, status?: string, investmentMode?: string, category?: string, clientId?: string, startDate?: string, endDate?: string, sortBy?: string, sortOrder?: string) => string;
        adminPayoutSummary: string;
        deleteAll: string;
        deleteByClient: (clientId: string) => string;
        updateStatus: (id: string) => string;
    };
    cron: {
        status: string;
        logs: (page: string, limit: string, cronName?: string, status?: string) => string;
        run: (name: string) => string;
        deleteAll: string;
    };
    activityLogs: {
        getList: (page: string, limit: string, userId?: string, userModel?: string, category?: string, action?: string, search?: string) => string;
    };
    notifications: {
        getList: (params: URLSearchParams) => string;
        getById: (id: string) => string;
        updateReadState: string;
        summary: string;
    };
    accountForms: {
        getByClient: (clientId: string) => string;
        updateStatus: (id: string) => string;
        delete: (id: string) => string;
    };
    reports: {
        financial: (params: URLSearchParams) => string;
    };
    jobs: {
        adminList: string;
        create: string;
        update: (id: string) => string;
        delete: (id: string) => string;
    };
    consultant: {
        adminList: (page: string, limit: string, search?: string, status?: string, topic?: string) => string;
        update: (id: string) => string;
        delete: (id: string) => string;
    };
}

export const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_ENDPOINTS: ApiEndPoints = {
    auth: {
        signin: "/auth/sign-in",
        refresh: "/auth/refresh",
        logout: "/auth/logout",
        createUser: "/auth/create-user",
        getUser: (search, page, limit, status, roleId) => `/auth/get-user?search=${search}&page=${page}&limit=${limit}&isUserActive=${status === "all" ? "all" : status === "active" ? true : false}&roles=${encodeURIComponent(JSON.stringify(roleId))}`,
        update: "/auth/update",
        delete: (ids) => `/auth/delete-users?ids=${encodeURIComponent(JSON.stringify(ids))}`,
        resetPassword: "/auth/reset-password-by-admin"
    },
    category: {
        createCategory: "/category",
        getCategoryList: (page, limit, search) => `/category?page=${page}&limit=${limit}&search=${search}`,
        delete: (ids) => `/category?ids=${encodeURIComponent(JSON.stringify(ids))}`,
        update: "/category/update"
    },
    brand: {
        createBrand: "/brand",
        getBrandList: (page, limit, search) => `/brand?page=${page}&limit=${limit}&search=${search}`,
        delete: (ids) => `/brand?ids=${encodeURIComponent(JSON.stringify(ids))}`,
        update: "/brand/update"
    },
    clients: {
        getClientList: (page, limit, search, status, kycStatus, riskProfile, country, preferredCurrency) => {
            const p = new URLSearchParams({ page, limit, search });
            if (status) p.set("status", status);
            if (kycStatus) p.set("kycStatus", kycStatus);
            if (riskProfile) p.set("riskProfile", riskProfile);
            if (country) p.set("country", country);
            if (preferredCurrency) p.set("preferredCurrency", preferredCurrency);
            return `/clients?${p.toString()}`;
        },
        getById: (id) => `/clients/${id}`,
        delete: (ids) => `/clients?ids=${encodeURIComponent(JSON.stringify(ids))}`,
        update: "/clients/update",
        bankDetails: {
            getList: (clientId) => `/clients/${clientId}/bank-details`,
            add: "/clients/bank-details",
            update: "/clients/bank-details/update",
            delete: (id) => `/clients/bank-details/${id}`,
        },
        wallets: {
            getList: (clientId) => `/clients/${clientId}/wallets`,
            add: "/clients/wallets",
            update: "/clients/wallets/update",
            delete: (id) => `/clients/wallets/${id}`,
        },
    },
    agents: {
        create: "/agent/admin/create",
        getAgentList: (page, limit, search, status, kycStatus, agentLevel, country, preferredCurrency) => {
            const p = new URLSearchParams({ page, limit, search });
            if (status) p.set("status", status);
            if (kycStatus) p.set("kycStatus", kycStatus);
            if (agentLevel) p.set("agentLevel", agentLevel);
            if (country) p.set("country", country);
            if (preferredCurrency) p.set("preferredCurrency", preferredCurrency);
            return `/agent?${p.toString()}`;
        },
        getById: (id) => `/agent/${id}`,
        delete: (ids) => `/agent?ids=${encodeURIComponent(JSON.stringify(ids))}`,
        update: "/agent/update",
        approveKyc: "/agent/approve-kyc",
        bankDetails: {
            getList: (agentId) => `/agent/${agentId}/bank-details`,
            add: "/agent/bank-details",
            update: "/agent/bank-details/update",
            delete: (id) => `/agent/bank-details/${id}`,
        },
        wallets: {
            getList: (agentId) => `/agent/${agentId}/wallets`,
            add: "/agent/wallets",
            update: "/agent/wallets/update",
            delete: (id) => `/agent/wallets/${id}`,
        },
    },
    planCharges: {
        getByPlanId: (planId) => `/plan-charges/${planId}`,
        upsert:      "/plan-charges",
    },
    investmentPlans: {
        create: "/investment-plans",
        getList: (page, limit, search, category?, status?, riskLevel?) => {
            const p = new URLSearchParams({ page, limit, search });
            if (category) p.set("category", category);
            if (status) p.set("status", status);
            if (riskLevel) p.set("riskLevel", riskLevel);
            return `/investment-plans?${p.toString()}`;
        },
        getById: (id) => `/investment-plans/${id}`,
        delete: (ids) => `/investment-plans?ids=${encodeURIComponent(JSON.stringify(ids))}`,
        update: `/investment-plans/update`,
    },
    paymentMethods: {
        create: "/payment-methods/admin",
        getList: (page, limit, search, type?, status?) => {
            const p = new URLSearchParams({ page, limit, search });
            if (type) p.set("type", type);
            if (status) p.set("status", status);
            return `/payment-methods/admin?${p.toString()}`;
        },
        getById: (id) => `/payment-methods/admin/${id}`,
        update: "/payment-methods/admin/update",
        toggleStatus: (id) => `/payment-methods/admin/${id}/toggle-status`,
        delete: (ids) => `/payment-methods/admin?ids=${encodeURIComponent(JSON.stringify(ids))}`,
    },
    deposits: {
        summary: "/deposits/admin/summary",
        getList: (page, limit, search, status?, userModel?) => {
            const p = new URLSearchParams({ page, limit, search });
            if (status) p.set("status", status);
            if (userModel) p.set("userModel", userModel);
            return `/deposits/admin?${p.toString()}`;
        },
        getById: (id) => `/deposits/admin/${id}`,
        approve: (id) => `/deposits/admin/${id}/approve`,
        reject: (id) => `/deposits/admin/${id}/reject`,
        bulkApprove: "/deposits/admin/bulk-approve",
        bulkReject: "/deposits/admin/bulk-reject",
        delete: "/deposits/admin",
        deleteAll: "/deposits/admin/delete-all",
    },
    withdrawals: {
        summary: "/withdrawals/admin/summary",
        getList: (page, limit, search, status?, userModel?, userId?) => {
            const p = new URLSearchParams({ page, limit, search });
            if (status) p.set("status", status);
            if (userModel) p.set("userModel", userModel);
            if (userId) p.set("userId", userId);
            return `/withdrawals/admin?${p.toString()}`;
        },
        getById: (id) => `/withdrawals/admin/${id}`,
        create: "/withdrawals",
        approve: (id) => `/withdrawals/admin/${id}/approve`,
        reject: (id) => `/withdrawals/admin/${id}/reject`,
        bulkApprove: "/withdrawals/admin/bulk-approve",
        bulkReject: "/withdrawals/admin/bulk-reject",
        delete: "/withdrawals/admin",
        deleteAll: "/withdrawals/admin/delete-all",
    },
    transactions: {
        summary: "/transactions/admin/summary",
        getList: (page, limit, search, type?, status?, userModel?, startDate?, endDate?, sortBy?, sortOrder?, userId?) => {
            const p = new URLSearchParams({ page, limit, search });
            if (type) p.set("type", type);
            if (status) p.set("status", status);
            if (userModel) p.set("userModel", userModel);
            if (startDate) p.set("startDate", startDate);
            if (endDate) p.set("endDate", endDate);
            if (sortBy) p.set("sortBy", sortBy);
            if (sortOrder) p.set("sortOrder", sortOrder);
            if (userId) p.set("userId", userId);
            return `/transactions/admin?${p.toString()}`;
        },
        userWallet: (userId, userModel) => `/transactions/admin/user-wallet?userId=${userId}&userModel=${userModel}`,
        fundBalances: (userId, userModel) => `/transactions/admin/fund-balances?userId=${userId}&userModel=${userModel}`,
        deleteAll: "/transactions/admin/delete-all",
    },
    cloudionary: {
        adminUpload: "/cloudionary/admin-upload",
    },
    dashboard: {
        summary: "/dashboard/summary",
    },
    portfolios: {
        deleteAll: "/portfolio/admin/delete-all",
        deleteByClient: (clientId) => `/portfolio/admin/client/${clientId}`,
        updateStatus: (id) => `/portfolio/admin/${id}/status`,
        adminList: (page, limit, search, status?, investmentMode?, category?, clientId?, startDate?, endDate?, sortBy?, sortOrder?) => {
            const p = new URLSearchParams({ page, limit, search });
            if (status)         p.set("status", status);
            if (investmentMode) p.set("investmentMode", investmentMode);
            if (category)       p.set("category", category);
            if (clientId)       p.set("clientId", clientId);
            if (startDate)      p.set("startDate", startDate);
            if (endDate)        p.set("endDate", endDate);
            if (sortBy)         p.set("sortBy", sortBy);
            if (sortOrder)      p.set("sortOrder", sortOrder);
            return `/portfolio/admin/list?${p.toString()}`;
        },
        adminPayoutSummary: "/portfolio/admin/payout-summary",
    },
    cron: {
        status: "/cron/status",
        logs: (page, limit, cronName?, status?) => {
            const p = new URLSearchParams({ page, limit });
            if (cronName) p.set("cronName", cronName);
            if (status)   p.set("status", status);
            return `/cron/logs?${p.toString()}`;
        },
        run: (name) => `/cron/run/${name}`,
        deleteAll: "/cron/delete-all",
    },
    activityLogs: {
        getList: (page, limit, userId?, userModel?, category?, action?, search?) => {
            const p = new URLSearchParams({ page, limit });
            if (userId)    p.set("userId", userId);
            if (userModel) p.set("userModel", userModel);
            if (category)  p.set("category", category);
            if (action)    p.set("action", action);
            if (search)    p.set("search", search);
            return `/activity-logs?${p.toString()}`;
        },
    },
    notifications: {
        getList: (params) => `/notifications?${params.toString()}`,
        getById: (id) => `/notifications/${id}`,
        updateReadState: "/notifications/read",
        summary: "/notifications?summaryOnly=true",
    },
    accountForms: {
        getByClient: (clientId) => `/account-forms/client/${clientId}`,
        updateStatus: (id) => `/account-forms/${id}/status`,
        delete: (id) => `/account-forms/${id}`,
    },
    reports: {
        financial: (params) => `/reports/financial?${params.toString()}`,
    },
    jobs: {
        adminList: "/jobs/admin",
        create: "/jobs",
        update: (id) => `/jobs/${id}`,
        delete: (id) => `/jobs/${id}`,
    },
    consultant: {
        adminList: (page, limit, search, status, topic) => {
            const p = new URLSearchParams({ page, limit });
            if (search) p.set("search", search);
            if (status) p.set("status", status);
            if (topic) p.set("topic", topic);
            return `/consultant/admin/list?${p.toString()}`;
        },
        update: (id) => `/consultant/admin/${id}`,
        delete: (id) => `/consultant/admin/${id}`,
    },
}
