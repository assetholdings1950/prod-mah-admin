"use client"

import React, { useState } from "react"
import Image from "next/image"
import BrandLogo from "@/assets/MAH_main-logo.jpeg"
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react"
import appClient from "@/lib/appClient"
import { toastLoading, toastUpdate } from "@/utils/toast-message/taost-message"
import { useAppDispatch } from "@/store/hooks/hooks"
import { signin } from "@/store/slices/authSlice"
import { useRouter, useSearchParams } from "next/navigation"

// Background image as base64 — replace with your actual import if preferred:
import BgImage from "@/assets/sign-in-page-illustration.png"

const SignInPage = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    })
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const dispatch = useAppDispatch()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const toastId = toastLoading("Logging you in...", {
            description: "Checking your credentials, please wait.",
        })

        try {
            const res = await appClient.post("/api/auth/signin", {
                email: formData.email,
                password: formData.password,
            })

            if (res.data.status) {
                const user = res.data.user
                user.accessToken = res.data.accessToken
                console.log({ user })
                toastUpdate(toastId, "success", "You're signed in", {
                    description: res.data?.message || "Welcome back!",
                })

                const hasAdminRole = user.role.some((r: any) => r.roleCode === "superadmin");

                if (!hasAdminRole) {
                    toastUpdate(toastId, "error", "Access denied", {
                        description: "You do not have permission to access the Admin Portal.",
                    });
                    setLoading(false);
                    return;
                }

                dispatch(signin({ user }))
                router.replace(callbackUrl)
            } else {
                toastUpdate(toastId, "error", "Sign in failed", {
                    description: res.data?.message || "Something went wrong. Please try again.",
                })
                setLoading(false)
            }
        } catch {
            toastUpdate(toastId, "error", "Connection error", {
                description: "Unable to reach the server. Please try again.",
            })
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

            {/* ── Full-screen background image ── */}
            <div className="absolute inset-0 z-0">
                <Image src={BgImage} alt="" fill className="object-cover object-center" priority />


                {/* Subtle light veil so card reads cleanly */}
                <div className="absolute inset-0 bg-white/20" />
            </div>

            {/* ── Login card ── */}
            <div className="relative z-10 w-full max-w-md mx-4">

                {/* Logo */}
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg mb-5 border border-white/60">
                        <Image
                            src={BrandLogo}
                            alt="Merlion Asset Holdings"
                            width="200"
                            height="54"
                            priority
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Admin Portal</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your Merlion Asset Holdings with confidence</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/70 overflow-hidden">
                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600" />

                    <form onSubmit={handleSubmit} className="p-8 space-y-5">

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail size={16} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="admin@merlionassetholdings.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-10 pr-12 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2 px-1">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={formData.rememberMe}
                                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-blue-500 accent-blue-500 cursor-pointer"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-slate-500 cursor-pointer select-none">
                                Keep me logged in
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-slate-800/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" strokeDasharray="24" strokeDashoffset="12" strokeLinecap="round" />
                                    </svg>
                                    <span>Verifying…</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    <span>Secure Login</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="bg-slate-50/80 px-8 py-4 border-t border-slate-100 text-center">
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">
                            Merlion Asset Holdings · Singapore
                        </p>
                    </div>
                </div>

                <p className="text-center mt-6 text-white/60 text-xs drop-shadow">
                    &copy; 2026 Merlion Asset Holdings. All rights reserved.
                </p>
            </div>
        </div>
    )
}

export default SignInPage