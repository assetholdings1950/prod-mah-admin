const PillToggle = ({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string; activeClass?: string }[];
}) => (
    <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
            <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={[
                    "text-xs px-3.5 py-2 rounded-lg border transition-all font-medium select-none",
                    value === opt.value
                        ? (opt.activeClass ?? "bg-navy text-white border-navy shadow-sm shadow-navy/20")
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700",
                ].join(" ")}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

export default PillToggle;
