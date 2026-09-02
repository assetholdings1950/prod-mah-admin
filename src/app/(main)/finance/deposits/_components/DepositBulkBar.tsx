"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Trash2, X, RefreshCw } from "lucide-react";

interface Props {
    selectedCount: number;
    isActioning: boolean;
    onBulkApprove: () => void;
    onBulkReject: () => void;
    onBulkDelete: () => void;
    onClearSelection: () => void;
}

export default function DepositBulkBar({
    selectedCount, isActioning,
    onBulkApprove, onBulkReject, onBulkDelete, onClearSelection,
}: Props) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 60 }}
                    transition={{ type: "spring", damping: 22, stiffness: 300 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
                >
                    <div className="flex items-center gap-2.5 bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/40 px-4 py-3 border border-slate-700">
                        {/* count badge */}
                        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
                            <span className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center text-[11px] font-black text-white">
                                {selectedCount}
                            </span>
                            <span className="text-xs font-semibold text-slate-300">selected</span>
                        </div>

                        {/* approve */}
                        <button
                            onClick={onBulkApprove}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 h-8 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-emerald-900/30"
                        >
                            {isActioning ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            Approve All
                        </button>

                        {/* reject */}
                        <button
                            onClick={onBulkReject}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 h-8 px-3.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-red-900/30"
                        >
                            <XCircle size={13} />
                            Reject All
                        </button>

                        {/* delete */}
                        <button
                            onClick={onBulkDelete}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 h-8 px-3.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                        >
                            <Trash2 size={13} />
                            Delete
                        </button>

                        {/* clear */}
                        <button
                            onClick={onClearSelection}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
