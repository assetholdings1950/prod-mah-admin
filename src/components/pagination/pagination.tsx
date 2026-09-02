import { ChevronLeft, ChevronRight } from "lucide-react";
import Select from "@/components/common/Select";



// ---------- Pagination ----------
interface PaginationProps {
    page: number;
    totalPages: number;
    limit: number;
    totalDocs: number;
    perPageOptions: number[];
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    page,
    totalPages,
    limit,
    totalDocs,
    perPageOptions,
    onPageChange,
    onLimitChange,
}) => {
    const startItem = totalDocs === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, totalDocs);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/40">
            {/* Per page + count */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Rows</span>
                    <Select
                        size="sm"
                        value={String(limit)}
                        onChange={(v) => onLimitChange(Number(v))}
                        options={perPageOptions.map((o) => ({ value: String(o), label: String(o) }))}
                    />
                </div>
                <span className="text-xs text-slate-400">
                    {totalDocs === 0
                        ? "No results"
                        : `${startItem}–${endItem} of ${totalDocs.toLocaleString()} clients`}
                </span>
            </div>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft size={14} />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 7) {
                        p = i + 1;
                    } else if (page <= 4) {
                        p = i + 1;
                    } else if (page >= totalPages - 3) {
                        p = totalPages - 6 + i;
                    } else {
                        p = page - 3 + i;
                    }
                    return (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${page === p
                                ? "bg-slate-800 text-white border border-slate-800"
                                : "border border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300"
                                }`}
                        >
                            {p}
                        </button>
                    );
                })}

                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};


export default Pagination