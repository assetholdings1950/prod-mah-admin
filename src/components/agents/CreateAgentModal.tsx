"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, TicketCheck, UserRound, X } from "lucide-react";
import appClient from "@/lib/appClient";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

interface CreatedAgent {
    _id: string;
    agentId: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface CreateAgentModalProps {
    onClose: () => void;
    onCreated: (agent: CreatedAgent) => void;
}

const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 outline-none transition focus:border-navy/35 focus:bg-white focus:ring-2 focus:ring-navy/10 placeholder:text-slate-400";
const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400";

export default function CreateAgentModal({ onClose, onCreated }: CreateAgentModalProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [referralCode, setReferralCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !submitting) onClose();
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [onClose, submitting]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedEmail = email.trim().toLowerCase();
        if (!firstName.trim() || !lastName.trim() || !normalizedEmail || !password) {
            toastError("Complete all required agent details.");
            return;
        }
        if (password.length < 8) {
            toastError("Password must contain at least 8 characters.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await appClient.post("/api/agents/create", {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: normalizedEmail,
                password,
                referralCode: referralCode.trim().toUpperCase() || undefined,
            });

            if (!response.data?.status || !response.data?.agent) {
                throw new Error(response.data?.message || "Agent account could not be created.");
            }

            const agent = response.data.agent as CreatedAgent;
            toastSuccess("Agent account created successfully.", {
                description: `Agent ID: ${agent.agentId}`,
            });
            onCreated(agent);
            onClose();
        } catch (error: unknown) {
            const apiError = error as { response?: { data?: { message?: string } }; message?: string };
            toastError(
                apiError.response?.data?.message ||
                apiError.message ||
                "Agent account could not be created."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            onMouseDown={() => { if (!submitting) onClose(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-agent-title"
                className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-5">
                    <div>
                        <h2 id="create-agent-title" className="text-base font-extrabold text-navy">
                            Create Agent Account
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            The account will be active and email-verified immediately.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close create agent dialog"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Required account details */}
                    <div className="space-y-4 p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label>
                                <span className={labelClass}>First Name *</span>
                                <div className="relative">
                                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        required
                                        autoFocus
                                        autoComplete="given-name"
                                        value={firstName}
                                        onChange={(event) => setFirstName(event.target.value)}
                                        placeholder="First name"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </label>
                            <label>
                                <span className={labelClass}>Last Name *</span>
                                <div className="relative">
                                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        required
                                        autoComplete="family-name"
                                        value={lastName}
                                        onChange={(event) => setLastName(event.target.value)}
                                        placeholder="Last name"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </label>
                        </div>

                        <label>
                            <span className={labelClass}>Email Address *</span>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    required
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="agent@example.com"
                                    className={`${inputClass} pl-10`}
                                />
                            </div>
                        </label>

                        <label>
                            <span className={labelClass}>Password *</span>
                            <div className="relative">
                                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    minLength={8}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Minimum 8 characters"
                                    className={`${inputClass} px-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-navy"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </label>

                        <label>
                            <span className={labelClass}>Referring Agent Code</span>
                            <div className="relative">
                                <TicketCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    autoComplete="off"
                                    value={referralCode}
                                    onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                                    placeholder="Enter agent referral code (optional)"
                                    className={`${inputClass} pl-10 uppercase`}
                                />
                            </div>
                            <span className="mt-1.5 block text-[11px] text-slate-400">
                                Links this account to the agent who owns the code.
                            </span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-xs font-bold text-white transition hover:bg-navy/95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting && <Loader2 size={15} className="animate-spin" />}
                            {submitting ? "Creating Agent…" : "Create Agent"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
