"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, RefreshCw, X } from "lucide-react";

interface RejectModalProps {
    open: boolean;
    title?: string;
    subtitle?: string;
    loading?: boolean;
    onConfirm: (note: string) => void;
    onCancel: () => void;
}

export default function RejectModal({
    open,
    title = "Reject Deposit",
    subtitle = "Provide a reason for the depositor",
    loading = false,
    onConfirm,
    onCancel,
}: RejectModalProps) {
    const [note, setNote] = useState("");

    const handleConfirm = () => {
        onConfirm(note);
        setNote("");
    };

    const handleCancel = () => {
        setNote("");
        onCancel();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
                >
                    <motion.div
                        initial={{ scale: 0.94, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 10 }}
                        transition={{ type: "spring", damping: 22, stiffness: 320 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="bg-red-500 px-5 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                    <XCircle size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white">{title}</p>
                                    <p className="text-[11px] text-red-100">{subtitle}</p>
                                </div>
                            </div>
                            <button onClick={handleCancel} className="text-white/60 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                    Rejection Reason <span className="text-slate-400 normal-case">(optional)</span>
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="e.g. Transaction hash mismatch, insufficient proof..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none transition-all"
                                />
                            </div>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-100 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
