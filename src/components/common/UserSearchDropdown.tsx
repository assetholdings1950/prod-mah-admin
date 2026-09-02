"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Search, UserRound, X } from "lucide-react";
import appClient from "@/lib/appClient";

export interface UserOption {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    clientId?: string;
    agentId?: string;
}

interface Props {
    userModel: "Client" | "Agent";
    selectedId?: string | null;
    onSelect: (user: UserOption | null) => void;
    placeholder?: string;
}

function getFullName(u: UserOption) {
    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    return name || u.email || u.clientId || u.agentId || `…${u._id.slice(-6)}`;
}

function getSubLabel(u: UserOption, userModel: "Client" | "Agent") {
    return userModel === "Agent" ? (u.agentId ?? u.email) : (u.clientId ?? u.email);
}

export default function UserSearchDropdown({ userModel, selectedId, onSelect, placeholder }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Resolve selectedId → display name when arriving from URL
    useEffect(() => {
        if (!selectedId) { setSelectedUser(null); return; }
        if (selectedUser?._id === selectedId) return;
        const endpoint = userModel === "Client"
            ? `/api/clients/details?id=${selectedId}`
            : `/api/agents/details?id=${selectedId}`;
        appClient.get(endpoint).then((res) => {
            const u = res.data?.data ?? res.data?.client ?? res.data?.agent ?? res.data;
            if (u?._id) setSelectedUser(u);
        }).catch(() => { });
    }, [selectedId, userModel]);

    // Debounced search
    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (!query.trim()) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const endpoint = userModel === "Client"
                    ? `/api/clients/get?search=${encodeURIComponent(query)}&limit=8`
                    : `/api/agents/get?search=${encodeURIComponent(query)}&limit=8`;
                const res = await appClient.get(endpoint);
                const list: UserOption[] = userModel === "Client"
                    ? (res.data?.clients?.docs ?? res.data?.clients ?? [])
                    : (res.data?.agents?.docs ?? res.data?.agents ?? []);
                setResults(list);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query, userModel]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Autofocus + Escape to close
    useEffect(() => {
        if (!open) return;
        setTimeout(() => inputRef.current?.focus(), 10);
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const handleSelect = useCallback((user: UserOption) => {
        setSelectedUser(user);
        setOpen(false);
        setQuery("");
        setResults([]);
        onSelect(user);
    }, [onSelect]);

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedUser(null);
        setQuery("");
        setResults([]);
        onSelect(null);
    }, [onSelect]);

    const isClient = userModel === "Client";
    const accentFg = isClient ? "text-blue-600" : "text-purple-600";
    const accentBg = isClient ? "bg-blue-50" : "bg-purple-50";
    const accentBd = isClient ? "border-blue-200" : "border-purple-200";
    const accentAvBg = isClient ? "bg-blue-100" : "bg-purple-100";
    const accentDot = isClient ? "bg-blue-400" : "bg-purple-400";
    const fallback = placeholder ?? (isClient ? "Search client…" : "Search agent…");

    return (
        <div ref={containerRef} className="relative shrink-0">
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`flex items-center gap-2 text-[12px] rounded-lg border px-3 py-1.5 transition w-[185px] ${selectedUser
                        ? `${accentBg} ${accentBd} ${accentFg} font-medium`
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                    }`}
            >
                {selectedUser ? (
                    <>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accentDot}`} />
                        <span className="truncate flex-1 text-left">{getFullName(selectedUser)}</span>
                        <span
                            role="button"
                            onClick={handleClear}
                            className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer ml-auto"
                        >
                            <X size={11} />
                        </span>
                    </>
                ) : (
                    <>
                        <Search size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate flex-1 text-left">{fallback}</span>
                        <ChevronDown size={12} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                    </>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute top-full mt-1.5 left-0 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    {/* Search input row */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
                        <Search size={13} className="text-slate-400 shrink-0" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or email…"
                            className="flex-1 text-[12px] bg-transparent outline-none text-slate-700 placeholder:text-slate-300"
                        />
                        {searching && <Loader2 size={12} className="animate-spin text-slate-400 shrink-0" />}
                    </div>

                    {/* Results list */}
                    <div className="max-h-60 overflow-y-auto">
                        {!query.trim() ? (
                            <p className="px-3 py-6 text-center text-[11px] text-slate-400">
                                Start typing to search {isClient ? "clients" : "agents"}…
                            </p>
                        ) : results.length === 0 && !searching ? (
                            <p className="px-3 py-6 text-center text-[11px] text-slate-400">
                                No {isClient ? "clients" : "agents"} found
                            </p>
                        ) : (
                            results.map((user) => {
                                const isSelected = selectedUser?._id === user._id;
                                return (
                                    <button
                                        key={user._id}
                                        type="button"
                                        onClick={() => handleSelect(user)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition text-left ${isSelected ? `${accentBg}` : "hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${accentAvBg} ${accentFg}`}>
                                            {(user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "") || <UserRound size={12} />}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-[12px] font-medium text-slate-700 truncate">
                                                {getFullName(user)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono truncate">
                                                {getSubLabel(user, userModel)}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${accentDot}`} />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
