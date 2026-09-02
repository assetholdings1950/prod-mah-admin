"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, UserRound } from "lucide-react";
import { HiringCandidateOption } from "@/lib/hiringApi";

type CandidateSelectProps = {
    candidates: HiringCandidateOption[];
    value: string;
    onChange: (reference: string) => void;
    loading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
};

export default function CandidateSelect({
    candidates,
    value,
    onChange,
    loading = false,
    disabled = false,
    placeholder = "Select candidate",
    className = "",
}: CandidateSelectProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);

    const selected = candidates.find(candidate => candidate.reference === value);
    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return candidates;
        return candidates.filter(candidate =>
            `${candidate.firstName} ${candidate.lastName} ${candidate.email} ${candidate.reference}`
                .toLowerCase()
                .includes(term),
        );
    }, [candidates, query]);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, []);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    const choose = (reference: string) => {
        onChange(reference);
        setQuery("");
        setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex(index => Math.min(index + 1, filtered.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(index => Math.max(index - 1, 0));
        } else if (event.key === "Enter" && filtered[activeIndex]) {
            event.preventDefault();
            choose(filtered[activeIndex].reference);
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    };

    const displayValue = selected
        ? `${selected.firstName} ${selected.lastName} — ${selected.email}`
        : value || placeholder;

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Candidate"
                disabled={disabled || loading}
                onClick={() => setOpen(current => !current)}
                className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-xs text-navy outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
                <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className={`min-w-0 flex-1 truncate ${!selected && !value ? "text-slate-400" : ""}`}>
                    {loading ? "Loading candidates…" : displayValue}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 p-2">
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search name, email, or reference…"
                                className="h-9 min-w-0 flex-1 bg-transparent text-xs text-navy outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    <div role="listbox" className="max-h-64 overflow-y-auto overscroll-contain p-1.5">
                        {filtered.length ? filtered.map((candidate, index) => {
                            const isSelected = candidate.reference === value;
                            return (
                                <button
                                    key={candidate._id}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => choose(candidate.reference)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${index === activeIndex ? "bg-blue-50" : "hover:bg-slate-50"}`}
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-navy">
                                        {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-bold text-navy">{candidate.firstName} {candidate.lastName}</span>
                                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{candidate.email}</span>
                                        <span className="mt-0.5 block text-[9px] text-slate-400">{candidate.reference}</span>
                                    </span>
                                    {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                                </button>
                            );
                        }) : <p className="px-3 py-8 text-center text-xs text-slate-400">No candidates match your search.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
