"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">

            {/* Background geometric accents */}
            <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
                <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full border border-[#0B234A]/5" />
                <div className="absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full border border-[#0B234A]/5" />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full border border-[#0B234A]/5" />
                <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full border border-[#0B234A]/5" />
                {/* Diagonal rule top-left */}
                <div className="absolute top-0 left-0 w-48 h-[1px] bg-gradient-to-r from-[#0B234A]/20 to-transparent origin-left rotate-[30deg] translate-y-24 translate-x-8" />
                <div className="absolute top-0 left-0 w-32 h-[1px] bg-gradient-to-r from-[#0B234A]/10 to-transparent origin-left rotate-[30deg] translate-y-32 translate-x-12" />
                {/* Diagonal rule bottom-right */}
                <div className="absolute bottom-24 right-8 w-48 h-[1px] bg-gradient-to-l from-[#0B234A]/20 to-transparent origin-right -rotate-[30deg]" />
            </div>

            {/* Brand mark */}
            <div className="absolute top-8 left-10 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#0B234A] flex items-center justify-center">
                    <span className="text-white font-black text-[11px] tracking-wider">M</span>
                </div>
                <span className="text-[13px] font-semibold text-[#0B234A] tracking-wide hidden sm:block">
                    Merlion Asset Holdings
                </span>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-lg">

                {/* Ornamental line above */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#BFC5CD]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#BFC5CD]">Error 404</span>
                    <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#BFC5CD]" />
                </div>

                {/* Big 404 */}
                <h1
                    className="font-heading font-black text-[#0B234A] leading-none select-none"
                    style={{ fontSize: "clamp(6rem, 18vw, 11rem)", letterSpacing: "-0.03em" }}
                >
                    404
                </h1>

                {/* Subtitle */}
                <h2
                    className="font-heading font-semibold text-[#0B234A] mt-2"
                    style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", letterSpacing: "0.04em" }}
                >
                    Page Not Found
                </h2>

                <p className="mt-4 text-[14px] text-[#BFC5CD] leading-relaxed max-w-sm">
                    The page you are looking for may have been moved, renamed, or does not exist.
                    Please check the URL or navigate back to the dashboard.
                </p>

                {/* Ornamental divider */}
                <div className="flex items-center gap-2 my-8">
                    <div className="w-8 h-[1px] bg-[#D8DCE2]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#BFC5CD]" />
                    <div className="w-8 h-[1px] bg-[#D8DCE2]" />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#D8DCE2] text-[#0B234A] text-[13px] font-semibold tracking-wide hover:bg-[#0B234A]/5 transition-colors"
                    >
                        <ArrowLeft size={15} />
                        Go Back
                    </button>

                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0B234A] text-white text-[13px] font-semibold tracking-wide hover:bg-[#15376B] transition-colors shadow-lg shadow-[#0B234A]/20"
                    >
                        <LayoutDashboard size={15} />
                        Go to Dashboard
                    </Link>
                </div>
            </div>

            {/* Footer line */}
            <div className="absolute bottom-6 text-[11px] text-[#BFC5CD] tracking-widest uppercase">
                Merlion Asset Holdings &mdash; Singapore
            </div>
        </div>
    );
}
