import Select from "@/components/common/Select";
import { Field, Toggle, inputCls } from "../clients/primitives";
import { FormState, SetFormField } from "./types";

interface Props {
    form: FormState;
    set: SetFormField;
}

export const AccountTab = ({ form, set }: Props) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Account Status">
            <Select
                fullWidth
                value={form.status}
                onChange={(v) => set("status", v as FormState["status"])}
                options={["pending","active","inactive","suspended","blocked","closed"].map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
        </Field>
        <Field label="Agent Level">
            <Select
                fullWidth
                value={form.agentLevel}
                onChange={(v) => set("agentLevel", v as FormState["agentLevel"])}
                options={[
                    { value: "basic",    label: "Basic" },
                    { value: "silver",   label: "Silver" },
                    { value: "gold",     label: "Gold" },
                    { value: "diamond",  label: "Diamond" },
                ]}
            />
        </Field>
        <Field label="Commission Rate (%)">
            <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                className={inputCls}
                value={form.commissionPercentage}
                onChange={(e) => set("commissionPercentage", parseFloat(e.target.value) || 0)}
                placeholder="5"
            />
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
    </div>
);
