import { cls } from "./types";

const Field = ({
    label,
    required,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-1.5">
        <label className={cls.label}>
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
);

export default Field;
