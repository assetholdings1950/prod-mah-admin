"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
    value: string;
    label: string;
    /** Small icon rendered inside a chip before the label */
    icon?: React.ReactNode;
    /** Tailwind color pair for the icon chip, e.g. "text-blue-600 bg-blue-100" */
    color?: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    /** "sm" = compact filter bar height (h-8, text-xs)
     *  "md" = standard form-field height (h-[42px], text-sm) — default */
    size?: "sm" | "md";
    /** Stretch to parent width instead of inline sizing */
    fullWidth?: boolean;
    className?: string;
}

export default function Select({
    value,
    onChange,
    options,
    placeholder = "Select…",
    disabled = false,
    size = "md",
    fullWidth = false,
    className = "",
}: SelectProps) {
    const [open, setOpen]       = useState(false);
    const [visible, setVisible] = useState(false);
    const containerRef          = useRef<HTMLDivElement>(null);
    const listRef               = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);

    // Animate open
    useEffect(() => {
        if (open) {
            const id = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(id);
        }
    }, [open]);

    const close = useCallback(() => {
        setVisible(false);
        setTimeout(() => setOpen(false), 140);
    }, []);

    const toggle = () => {
        if (disabled) return;
        if (open) close();
        else setOpen(true);
    };

    const pick = (val: string) => {
        onChange(val);
        close();
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) close();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [close]);

    // Keyboard: Escape + Arrow navigation
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") { close(); return; }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const idx  = options.findIndex((o) => o.value === value);
                const next = e.key === "ArrowDown"
                    ? Math.min(idx + 1, options.length - 1)
                    : Math.max(idx - 1, 0);
                onChange(options[next].value);
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, value, options, onChange, close]);

    // ── Sizing tokens ─────────────────────────────────────────────────────────
    const triggerH   = size === "sm" ? "h-8"      : "h-[42px]";
    const triggerPx  = size === "sm" ? "px-2.5"   : "px-3.5";
    const triggerR   = size === "sm" ? "rounded-lg" : "rounded-xl";
    const triggerTxt = size === "sm" ? "text-[12px]" : "text-[13px]";
    const optPy      = size === "sm" ? "py-1.5"   : "py-2.5";
    const optPx      = size === "sm" ? "px-2.5"   : "px-3.5";
    const optTxt     = size === "sm" ? "text-[12px]" : "text-[13px]";
    const chevronSz  = size === "sm" ? 12 : 14;

    return (
        <div
            ref={containerRef}
            className={`relative ${fullWidth ? "w-full" : "inline-flex"} ${className}`}
        >
            {/* ── Trigger ──────────────────────────────────────────────────── */}
            <button
                type="button"
                disabled={disabled}
                onClick={toggle}
                className={[
                    "flex items-center justify-between gap-2 font-medium transition-all duration-150",
                    fullWidth ? "w-full" : "min-w-[140px]",
                    triggerH, triggerPx, triggerR, triggerTxt,
                    "border shadow-sm",
                    open
                        ? "bg-white border-primary/50 ring-2 ring-primary/10 text-slate-800"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100/80",
                    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                ].join(" ")}
            >
                {selected?.icon && (
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${selected.color ?? "bg-slate-100 text-slate-500"}`}>
                        {selected.icon}
                    </span>
                )}
                <span className={selected ? "truncate" : "text-slate-400 truncate"}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown
                    size={chevronSz}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {/* ── Dropdown panel ───────────────────────────────────────────── */}
            {open && (
                <div
                    ref={listRef}
                    className={[
                        "absolute top-full mt-1.5 z-50 overflow-hidden",
                        "bg-white border border-slate-200/80 rounded-xl",
                        "shadow-[0_8px_30px_rgba(0,0,0,0.10)] shadow-slate-200/60",
                        "py-1.5",
                        "min-w-full",
                        "transition-all duration-[140ms] ease-out",
                        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1.5",
                    ].join(" ")}
                    style={{ width: "max-content", maxWidth: 300 }}
                >
                    {/* Subtle top highlight line */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

                    {options.map((opt, i) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => pick(opt.value)}
                                className={[
                                    "w-full flex items-center gap-2.5",
                                    optPx, optPy, optTxt,
                                    "transition-colors duration-100 text-left",
                                    isSelected
                                        ? "bg-primary/[0.06] text-primary font-semibold"
                                        : "text-slate-700 hover:bg-slate-50",
                                    i === 0 ? "mt-0" : "",
                                ].join(" ")}
                            >
                                {opt.icon && (
                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${opt.color ?? "bg-slate-100 text-slate-500"}`}>
                                        {opt.icon}
                                    </span>
                                )}
                                <span className="flex-1">{opt.label}</span>
                                {isSelected && (
                                    <Check size={13} className="text-primary shrink-0" strokeWidth={2.5} />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
