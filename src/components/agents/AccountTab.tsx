import Select from "@/components/common/Select";
import { CurrentPasswordField, Field, Toggle, inputCls } from "../clients/primitives";
import { FormState, SetFormField } from "./types";
import { IAgents } from "@/interface/agent";

export interface CommissionTierPolicyOption {
    _id: string;
    name: string;
    slug: string;
    commissionRate: number;
    active: boolean;
    isDefault: boolean;
}

interface Props {
    form: FormState;
    set: SetFormField;
    agent?: IAgents | null;
    tierPolicies: CommissionTierPolicyOption[];
}

export const AccountTab = ({ form, set, agent, tierPolicies }: Props) => {
    const selectedPolicy = tierPolicies.find((policy) => policy._id === form.commissionTierPolicy);

    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Account Status">
            <Select
                fullWidth
                value={form.status}
                onChange={(v) => set("status", v as FormState["status"])}
                options={["pending","active","inactive","suspended","blocked","closed"].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
        </Field>
        <Field label="Commission Tier Policy">
            <Select
                fullWidth
                value={form.commissionTierPolicy}
                onChange={(v) => set("commissionTierPolicy", v)}
                options={tierPolicies.map((policy) => ({
                    value: policy._id,
                    label: `${policy.name} — ${policy.commissionRate}%${policy.isDefault ? " (default)" : ""}`,
                }))}
            />
        </Field>
        <Field label="Commission Rate (%)">
            <input
                type="number"
                className={`${inputCls} bg-slate-50 text-slate-500`}
                value={selectedPolicy?.commissionRate ?? form.commissionPercentage}
                readOnly
            />
            <p className="mt-1 text-[11px] text-slate-400">Managed by the selected tier policy.</p>
        </Field>
        <Field label="Preferred Currency">
            <input
                className={inputCls}
                value={form.preferredCurrency}
                onChange={(e) => set("preferredCurrency", e.target.value.toUpperCase())}
                placeholder="USD"
                maxLength={10}
            />
        </Field>
        <Toggle
            checked={form.isCommissionEligible}
            onChange={() => set("isCommissionEligible", !form.isCommissionEligible)}
            label="Commission Eligible"
            description="Allow this agent to earn commission from referred client investments"
        />
        <Toggle
            checked={form.isKycRequired}
            onChange={() => set("isKycRequired", !form.isKycRequired)}
            label="KYC Required"
            description="Force KYC verification before this agent can earn commissions or withdraw"
        />
        <CurrentPasswordField value={agent?.currentPassword} />
    </div>
    );
};
