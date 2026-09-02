"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
    value: string;
    label: string;
    dotColor?: string;             // e.g. "bg-emerald-400" — renders a colored dot
    icon?: React.ElementType;      // renders an icon before label
    iconClass?: string;
}

interface Props {
    value: string;
    options: DropdownOption[];
    onChange: (v: string) => void;
    className?: string;
}

export default function DropdownSelect({ value, options, onChange, className = "" }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find((o) => o.value === value) ?? options[0];

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    return (
        <div ref={ref} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`h-9 min-w-[130px] px-3 flex items-center gap-2 text-[12px] font-medium rounded-lg border transition-all ${
                    open
                        ? "bg-white border-slate-400 shadow-sm text-slate-800"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`}
            >
                {/* selected indicator */}
                {selected?.dotColor && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dotColor}`} />
                )}
                {selected?.icon && (() => {
                    const Icon = selected.icon;
                    return <Icon size={12} className={selected.iconClass ?? "text-slate-500"} />;
                })()}
                <span className="flex-1 text-left truncate">{selected?.label ?? "Select…"}</span>
                <ChevronDown
                    size={13}
                    className={`shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute top-full left-0 mt-1.5 min-w-full w-max max-w-[220px] bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1.5 overflow-hidden">
                    {options.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors text-left ${
                                    isActive
                                        ? "bg-slate-50 text-slate-900"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                }`}
                            >
                                {opt.dotColor && (
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`} />
                                )}
                                {Icon && <Icon size={12} className={opt.iconClass ?? "text-slate-400"} />}
                                <span className="flex-1 truncate">{opt.label}</span>
                                {isActive && <Check size={11} className="text-slate-800 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
