import {
    LayoutDashboard,
    Users,
    Percent,
    Bell,
    Layers,
    PlusCircle,
    DollarSign,
    UserCog,
    Wallet,
    CreditCard,
    Receipt,
    CalendarClock,
    History,
    Briefcase,
    ClipboardList,
    CalendarDays,
    ClipboardCheck,
    Mail,
    Headset,
    Inbox,
    ChartNoAxesCombined,
    Landmark,
} from "lucide-react"
/* ─────────────────── NAV CONFIG ─────────────────── */

type NavItem = {
    name: string
    href: string
    icon: React.ElementType
    badge?: string
    badgeVariant?: "red" | "blue" | "amber"
    subMenu?: { name: string; href: string; icon: React.ElementType }[]
}


export type NavGroup_ = {
    label: string
    items: NavItem[]
}

export const navGroups: NavGroup_[] = [
    {
        label: "Overview",
        items: [
            {
                name: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
            },
            {
                name: "Notifications",
                href: "/notifications",
                icon: Bell,
            },
            {
                name: "Email Center",
                href: "/email-center",
                icon: Mail,
            },
        ],
    },

    {
        label: "User Management",
        items: [
            {
                name: "Agents",
                href: "/agents",
                icon: UserCog,

                subMenu: [
                    {
                        name: "All Agents",
                        href: "/agents/all",
                        icon: Users,
                    },
                    {
                        name: "Agent Commissions",
                        href: "/agents/commissions",
                        icon: Percent,
                    },
                ],
            },

            {
                name: "Clients",
                href: "/clients",
                icon: Users,

                subMenu: [
                    {
                        name: "All Clients",
                        href: "/clients/all",
                        icon: Users,
                    },
                ],
            },

            {
                name: "Consultant Requests",
                href: "/consultations",
                icon: Headset,
            },
        ],
    },

    {
        label: "Investment Management",
        items: [
            {
                name: "Investment Plans",
                href: "/investment-plans",
                icon: Layers,

                subMenu: [
                    {
                        name: "All Plans",
                        href: "/investment-plans/all",
                        icon: Layers,
                    },
                    {
                        name: "Create Plan",
                        href: "/investment-plans/create",
                        icon: PlusCircle,
                    },
                ],
            },
            {
                name: "Bonds",
                href: "/bonds",
                icon: Landmark,
                subMenu: [
                    { name: "All Bonds", href: "/bonds/all", icon: Landmark },
                    { name: "Create Bond", href: "/bonds/create", icon: PlusCircle },
                ],
            },
            {
                name: "Fund Reports",
                href: "/fund-reports",
                icon: ChartNoAxesCombined,
            },
        ],
    },

    {
        label: "Finance",
        items: [
            {
                name: "Deposits",
                href: "/finance/deposits",
                icon: Wallet,

                subMenu: [
                    {
                        name: "All Deposits",
                        href: "/finance/deposits/all",
                        icon: Layers,
                    },
                ],
            },

            {
                name: "Withdrawals",
                href: "/finance/withdrawals",
                icon: CreditCard,

                subMenu: [
                    {
                        name: "All Withdrawals",
                        href: "/finance/withdrawals/all",
                        icon: Layers,
                    },
                ],
            },

            {
                name: "Transactions",
                href: "/finance/transactions/all",
                icon: Receipt,
                subMenu: [
                    {
                        name: "All Transactions",
                        href: "/finance/transactions/all",
                        icon: Receipt,
                    },
                ],
            },
            {
                name: "Payment Methods",
                href: "/finance/payment-methods",
                icon: CreditCard,
                subMenu: [
                    {
                        name: "All Methods",
                        href: "/finance/payment-methods/all",
                        icon: Layers,
                    },
                    {
                        name: "Add Method",
                        href: "/finance/payment-methods/create",
                        icon: PlusCircle,
                    },
                ],
            },
        ],
    },

    {
        label: "Earnings",
        items: [
            {
                name: "Interest Payouts",
                href: "/interest-payouts",
                icon: DollarSign,
                subMenu: [
                    {
                        name: "All Payouts",
                        href: "/interest-payouts/all",
                        icon: DollarSign,
                    },
                ],
            },
        ],
    },

    {
        label: "Hiring",
        items: [
            {
                name: "Hiring Dashboard",
                href: "/hiring",
                icon: LayoutDashboard,
            },
            {
                name: "Job Openings",
                href: "/jobs",
                icon: Briefcase,
            },
            {
                name: "Applications",
                href: "/applications",
                icon: ClipboardList,
            },
            {
                name: "Interest Requests",
                href: "/hiring/interests",
                icon: Inbox,
            },
            {
                name: "Assignments",
                href: "/assessments",
                icon: ClipboardCheck,
            },
            {
                name: "Interviews",
                href: "/interviews",
                icon: CalendarDays,
            },
            {
                name: "Candidate Emails",
                href: "/hiring/email-logs",
                icon: Mail,
            },
        ],
    },

    {
        label: "Reports",
        items: [
            {
                name: "Financial Reports",
                href: "/reports/financial",
                icon: DollarSign,
            },
        ],
    },

    {
        label: "System",
        items: [
            {
                name: "Cron Scheduler",
                href: "/system/cron",
                icon: CalendarClock,
            },
            {
                name: "Activity Logs",
                href: "/system/activity-logs",
                icon: History,
            },
        ],
    },
];
