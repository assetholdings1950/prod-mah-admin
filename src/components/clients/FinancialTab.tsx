import { IClients } from "@/interface/client";
import { ReadonlyField } from "./primitives";

interface Props {
    client: IClients;
}

export const FinancialTab = ({ client }: Props) => {
    const c = client.preferredCurrency;
    const money = (n: number) => `${c} ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    const count = (n: number) => String(n);

    const items: { label: string; value: string }[] = [
        { label: "Available Balance", value: money(client.availableBalance) },
        { label: "Portfolio Value", value: money(client.portfolioValue) },
        { label: "Total Invested Amount", value: money(client.totalInvestedAmount) },
        { label: "Active Investment Amount", value: money(client.activeInvestmentAmount) },
        { label: "Total Profit Earned", value: money(client.totalProfitEarned) },
        { label: "Total Interest Earned", value: money(client.totalInterestEarned) },
        { label: "Total Deposits", value: money(client.totalDeposits) },
        { label: "Total Withdrawals", value: money(client.totalWithdrawals) },
        { label: "Total Investments", value: count(client.totalInvestments) },
        { label: "Active Investments", value: count(client.activeInvestments) },
        { label: "Completed Investments", value: count(client.completedInvestments) },
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
