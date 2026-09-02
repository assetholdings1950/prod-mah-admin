"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Trash2, RefreshCw, X } from "lucide-react";

type Variant = "danger" | "warning" | "success";

interface ConfirmModalProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: Variant;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const VARIANT_CONFIG: Record<Variant, { header: string; icon: React.ElementType; confirmBtn: string }> = {
    danger: {
        header: "bg-red-500",
        icon: Trash2,
        confirmBtn: "bg-red-500 hover:bg-red-600 text-white shadow-red-100",
    },
    warning: {
        header: "bg-amber-500",
        icon: AlertTriangle,
        confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100",
    },
    success: {
        header: "bg-emerald-500",
        icon: CheckCircle2,
        confirmBtn: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-100",
    },
};

export default function ConfirmModal({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    variant = "danger",
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const cfg = VARIANT_CONFIG[variant];
    const Icon = cfg.icon;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
                >
                    <motion.div
                        initial={{ scale: 0.94, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 10 }}
                        transition={{ type: "spring", damping: 22, stiffness: 320 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                        <div className={`${cfg.header} px-5 py-4 flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Icon size={16} className="text-white" />
                                </div>
                                <p className="text-sm font-black text-white">{title}</p>
                            </div>
                            <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`flex-1 h-10 text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${cfg.confirmBtn}`}
                                >
                                    {loading
                                        ? <RefreshCw size={14} className="animate-spin" />
                                        : <Icon size={14} />}
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
