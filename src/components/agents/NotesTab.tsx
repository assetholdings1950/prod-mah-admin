import { Field, inputCls } from "../clients/primitives";
import { SetFormField } from "./types";

interface Props {
    notes: string;
    set: SetFormField;
}

export const NotesTab = ({ notes, set }: Props) => (
    <div className="flex flex-col gap-2">
        <Field label="Internal Notes">
            <textarea
                rows={10}
                className={`${inputCls} resize-none`}
                value={notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Add internal notes about this agent..."
            />
        </Field>
        <p className="text-[11px] text-slate-400">Notes are visible to admins only and not shared with the agent.</p>
    </div>
);
