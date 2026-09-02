import Select from "@/components/common/Select";
import { Field, Toggle, inputCls } from "./primitives";
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
        <Field label="Risk Profile">
            <Select
                fullWidth
                value={form.riskProfile}
                onChange={(v) => set("riskProfile", v as FormState["riskProfile"])}
                options={[
                    { value: "conservative", label: "Conservative" },
                    { value: "moderate",     label: "Moderate" },
                    { value: "aggressive",   label: "Aggressive" },
                ]}
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
            checked={form.isKycRequired}
            onChange={() => set("isKycRequired", !form.isKycRequired)}
            label="KYC Required"
            description="Force KYC verification before this client can transact"
        />
    </div>
);
