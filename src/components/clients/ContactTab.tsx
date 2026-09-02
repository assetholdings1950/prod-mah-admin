import { Field, inputCls } from "./primitives";
import { FormState, SetFormField } from "./types";

interface Props {
    form: FormState;
    set: SetFormField;
}

export const ContactTab = ({ form, set }: Props) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Country Code">
            <input
                className={inputCls}
                value={form.countryCode}
                onChange={(e) => set("countryCode", e.target.value)}
                placeholder="+1"
            />
        </Field>
        <Field label="Phone Number">
            <input
                className={inputCls}
                value={form.phoneNumber}
                onChange={(e) => set("phoneNumber", e.target.value)}
                placeholder="Phone number"
            />
        </Field>
        <Field label="Country">
            <input
                className={inputCls}
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="Country"
            />
        </Field>
        <Field label="State / Province">
            <input
                className={inputCls}
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="State"
            />
        </Field>
        <Field label="City">
            <input
                className={inputCls}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="City"
            />
        </Field>
        <Field label="Postal Code">
            <input
                className={inputCls}
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
                placeholder="ZIP / Postal code"
            />
        </Field>
        <div className="sm:col-span-2">
            <Field label="Address">
                <input
                    className={inputCls}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Street address"
                />
            </Field>
        </div>
    </div>
);
