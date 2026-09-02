import { IAgents } from "@/interface/agent";
import { ReadonlyField } from "../clients/primitives";

interface Props {
    agent: IAgents;
}

export const FinancialTab = ({ agent }: Props) => {
    const c = agent.preferredCurrency || "USD";
    const money = (n: number | undefined) => `${c} ${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    const count = (n: number | undefined) => String(n ?? 0);
    const date = (d: string | null | undefined) => d ? new Date(d).toLocaleString() : null;

    const items: { label: string; value: string | null }[] = [
        { label: "Available Commission Balance", value: money(agent.availableCommissionBalance) },
        { label: "Pending Commission", value: money(agent.pendingCommission) },
        { label: "Total Commission Earned", value: money(agent.totalCommissionEarned) },
        { label: "Total Commission Paid", value: money(agent.totalCommissionPaid) },
        { label: "Lifetime Business Volume", value: money(agent.lifetimeBusinessVolume) },
        { label: "Total Investment Volume", value: money(agent.totalInvestmentVolume) },
        { label: "Total Deposits", value: money(agent.totalDeposits) },
        { label: "Total Withdrawals", value: money(agent.totalWithdrawals) },
        { label: "Total Referred Clients", value: count(agent.totalClients) },
        { label: "Active Referred Clients", value: count(agent.activeClients) },
        { label: "Salary Activated", value: agent.salaryActivated ? "Yes" : "No" },
        { label: "Sales count (this month)", value: count(agent.salesThisMonth) },
        { label: "Salary Eligible (this month)", value: agent.isSalaryEligibleThisMonth ? "Eligible" : "Not Eligible" },
        { label: "Last Commission Paid At", value: date(agent.lastCommissionPaidAt) },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
                <ReadonlyField key={item.label} label={item.label} value={item.value} />
            ))}
            <p className="sm:col-span-2 lg:col-span-3 text-[11px] text-slate-400 mt-1">
                Financial figures are read-only and managed by the system.
            </p>
        </div>
    );
};
