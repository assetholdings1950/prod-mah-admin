import { IAgents } from "@/interface/agent";
import Select from "@/components/common/Select";
import { Field, ReadonlyField, inputCls } from "../clients/primitives";
import { FormState, SetFormField } from "./types";

interface Props {
    form: FormState;
    set: SetFormField;
    agent: IAgents;
}

export const PersonalTab = ({ form, set, agent }: Props) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="First Name">
            <input
                className={inputCls}
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="First name"
            />
        </Field>
        <Field label="Last Name">
            <input
                className={inputCls}
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Last name"
            />
        </Field>
        <Field label="Date of Birth">
            <input
                type="date"
                className={inputCls}
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
            />
        </Field>
        <Field label="Gender">
            <Select
                fullWidth
                value={form.gender}
                onChange={(v) => set("gender", v as FormState["gender"])}
                options={[
                    { value: "male",   label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other",  label: "Other" },
                ]}
            />
        </Field>
        <ReadonlyField label="Email" value={agent.email} />
        <ReadonlyField label="Agent ID" value={agent.agentId} />
    </div>
);
